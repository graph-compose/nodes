# Multi-Language Audio Dubbing Pipeline

Take any YouTube video and produce fully dubbed versions in Spanish, French, or any language you choose, with natural-sounding AI voices replacing the original audio track. The entire pipeline runs as a single durable workflow: if anything fails mid-way (a flaky TTS call, a rate limit, a restart), it resumes exactly where it left off.

The pipeline is split into two phases. First, the video is downloaded, the audio extracted, and the transcript chunked into translation-sized segments. Then a nested `forEach` loop fans out across every combination of language and chunk, translating, synthesising speech, and stitching the final dubbed video back together, all in parallel.

## Node breakdown

### `download_video`: [ytdl/download](https://github.com/graph-compose/nodes/tree/main/python/src/routes/ytdl)

Accepts a YouTube URL and downloads the video in MP4 format at the highest available quality. The output URL is used throughout the rest of the pipeline, both in the preparation phase and inside the nested forEach loops via parent results propagation.

Configured with a 10-minute `startToCloseTimeout` and 2 retry attempts with a 10s backoff to handle intermittent download failures.

### `extract_audio`: [video/audio-extraction](https://github.com/graph-compose/nodes/tree/main/nodes/src/nodes/routes/video)

Strips the audio track from the downloaded video file, returning a standalone audio URL. This is passed to Whisper for transcription. Separating the audio first gives Whisper a cleaner input signal than passing the raw video.

### `transcribe_audio`: [openai/speech/transcribe](https://github.com/graph-compose/nodes/tree/main/nodes/src/nodes/routes/openai)

Sends the extracted audio to OpenAI Whisper using `verbose_json` response format. This returns not just the transcript text but also per-segment timing metadata (`startTime`, `endTime`, `duration`). That timing data is critical, it's used later by `concat_audio` to time-stretch each dubbed audio clip to fit its original slot in the video.

### `chunk_transcript`: [text/chunk](https://github.com/graph-compose/nodes/tree/main/nodes/src/nodes/routes/text)

Splits the Whisper segments into chunks of ~3,500 characters, preserving sentence boundaries and carrying timing metadata into each chunk. Chunking is necessary because the full transcript can exceed GPT-4o's comfortable working window for translation, and because smaller chunks produce more accurate, natural-sounding translations.

The output, `results.chunk_transcript.data.data.chunks`, is what the inner forEach loop iterates over.

---

### `dub_langs`: Outer forEach

Iterates over an array of target language objects. Each item specifies a `lang` (display name for the translation prompt), a `code` (ISO 639-1, used to label the output video), and a `voiceId` (the ElevenLabs voice to use for that language).

Items are deliberately lean, no transcript data is embedded here. The inner loops access transcript chunks directly from the parent scope via `results.chunk_transcript`.

### `dub_chunks`: Inner forEach

Iterates over the transcript chunks from `results.chunk_transcript`. Because this loop runs inside the `dub_langs` child workflow, it can read parent results directly, the chunks don't need to be threaded through the outer loop items.

Every combination of language and chunk gets its own `translate` and `tts` execution.

### `translate`: [llm/query](https://github.com/graph-compose/nodes/tree/main/python/src/routes/llm)

Calls GPT-4o to translate the current chunk (`row.data.text`) into the target language (`rows.dub_langs.data.lang`). The system prompt instructs the model to produce natural spoken-language output, not literal word-for-word translation, since the result goes directly to TTS.

Note how `rows.dub_langs.data.lang` accesses the **outer** loop item from inside a grandchild node. This is the rows reference pattern: `rows.<forEachNodeId>.data.<field>`.

### `tts`: [elevenlabs/tts/generate](https://github.com/graph-compose/nodes/tree/main/nodes/src/nodes/routes/elevenlabs)

Generates the dubbed audio clip for the current chunk using ElevenLabs `eleven_multilingual_v2`. The voice ID (`rows.dub_langs.data.voiceId`) comes from the outer loop item, not the chunk.

This node is configured for aggressive retries, 6 attempts, starting at 30s and doubling each time up to 5 minutes, because ElevenLabs enforces per-minute rate limits that can trigger under parallel load.

---

### `concat_audio`: [audio/concat](https://github.com/graph-compose/nodes/tree/main/nodes/src/nodes/routes/audio)

After the inner loop completes for a given language, this node collects all TTS audio URLs from `results.dub_chunks.data.items` and concatenates them into a single audio track. The `targetDurations` array, sourced from the original Whisper timing data, tells the node how long each clip should be, allowing it to time-stretch clips to stay in sync with the original video.

### `replace_audio`: [video/replace-audio](https://github.com/graph-compose/nodes/tree/main/nodes/src/nodes/routes/video)

Replaces the original video's audio track with the dubbed audio, producing a labelled output file (e.g. `es`, `fr`). The source video URL comes from `results.download_video`, accessed via parent results propagation across both forEach boundaries.

---

## Key patterns

- **Nested forEach**: languages x chunks processed as a matrix without flattening or duplicating data
- **Parent results propagation**: inner loops read `results.chunk_transcript` and `results.download_video` from the grandparent scope
- **Row references**: grandchild nodes access outer loop context via `rows.dub_langs.data.*`
- **Timing-aware concatenation**: Whisper segment durations feed directly into `targetDurations` to keep dubbed audio in sync

## Customising

**Add languages:** Extend the `dub_langs` forEach items array. Each entry needs `lang`, `code`, and a `voiceId` from the [ElevenLabs voice library](https://elevenlabs.io/voice-library).

**Use a different video source:** Replace `download_video` with any HTTP node that returns a video URL. The rest of the pipeline only depends on `results.download_video.data.data.task_result.url`.

**Swap TTS providers:** Replace the `tts` node's HTTP config with any speech synthesis API. The translate node output at `results.translate.data.data.response` is just a string.

## Required setup

| Secret | Description |
|--------|-------------|
| `OPENAI_API_KEY` | Used by `transcribe_audio` (Whisper) and `translate` (GPT-4o) |
| `ELEVENLABS_API_KEY` | Used by `tts` for voice synthesis |

You also need both services available:
- This nodes service for HTTP route definitions, proxy routes, and non-Python nodes.
- The [Python service](https://github.com/graph-compose/nodes/tree/main/python) in this repository for `ytdl/download` and `llm/query`.
