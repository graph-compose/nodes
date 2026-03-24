import snoowrap from "snoowrap";
import type {
  RedditSearchPostData,
  RedditSearchRequest,
} from "../schemas/redditSchemas";

type AppOnlyClient = {
  getSubreddit: (name: string) => {
    search: (options: {
      query: string;
      sort: "relevance" | "hot" | "top" | "new" | "comments";
      time: "hour" | "day" | "week" | "month" | "year" | "all";
      limit: number;
    }) => Promise<any[]>;
  };
};

const createRedditClient = async (
  body: RedditSearchRequest,
): Promise<AppOnlyClient> => {
  if (body.username && body.password) {
    return new snoowrap({
      userAgent: body.userAgent,
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      username: body.username,
      password: body.password,
    }) as AppOnlyClient;
  }

  return (await snoowrap.fromApplicationOnlyAuth({
    userAgent: body.userAgent,
    clientId: body.clientId,
    clientSecret: body.clientSecret,
    grantType: "client_credentials",
  })) as AppOnlyClient;
};

export const searchRedditPosts = async (
  body: RedditSearchRequest,
): Promise<RedditSearchPostData[]> => {
  try {
    const reddit = await createRedditClient(body);
    const subreddit = reddit.getSubreddit(body.subreddit || "all");

    const results = await subreddit.search({
      query: body.query,
      sort: body.sort,
      time: body.time,
      limit: body.limit,
    });

    return results.map((post: any) => ({
      id: String(post.id),
      title: String(post.title || ""),
      selftext: String(post.selftext || ""),
      url: String(post.url || ""),
      permalink: String(post.permalink || ""),
      subreddit: String(post.subreddit?.display_name || body.subreddit || "all"),
      author: post.author?.name ? String(post.author.name) : null,
      score: Number(post.score || 0),
      numComments: Number(post.num_comments || 0),
      createdUtc: Number(post.created_utc || 0),
      isSelf: Boolean(post.is_self),
      over18: Boolean(post.over_18),
      spoiler: Boolean(post.spoiler),
    }));
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : String(error);
    const isRedditNetworkBlock =
      details.includes("whoa there, pardner") || details.includes("Blocked");

    if (isRedditNetworkBlock) {
      throw new Error(
        "Reddit blocked this request due to network policy. Use a unique userAgent (appName:service:version (by /u/actual_username)) and prefer script auth (include username/password) for hosted environments. If using script auth, use a dedicated low-risk automation account.",
      );
    }

    throw error;
  }
};
