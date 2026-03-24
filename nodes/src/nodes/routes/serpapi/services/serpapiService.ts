import axios from "axios";
import type { SerpApiSearchRequest } from "../schemas/serpapiSchemas";

const SERPAPI_BASE_URL = "https://serpapi.com/search";

const RECENCY_TO_TBS: Record<string, string> = {
  hour: "qdr:h",
  day: "qdr:d",
  week: "qdr:w",
  month: "qdr:m",
  year: "qdr:y",
};

const toUsDate = (date: string): string => {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    throw new Error("dateMin/dateMax must be in YYYY-MM-DD format.");
  }
  return `${Number(month)}/${Number(day)}/${year}`;
};

export const searchSerpApi = async (request: SerpApiSearchRequest) => {
  const {
    apiKey,
    query,
    engine,
    num,
    location,
    uule,
    lat,
    lon,
    radius,
    ludocid,
    lsig,
    kgmid,
    si,
    ibp,
    uds,
    googleDomain,
    gl,
    hl,
    cr,
    lr,
    safe,
    nfpr,
    filter,
    tbm,
    start,
    recency,
    dateMin,
    dateMax,
    tbs,
    device,
    noCache,
    async,
    zeroTrace,
    output,
    jsonRestrictor,
    extraParams,
  } = request;

  let resolvedTbs = tbs;

  if (!resolvedTbs && (dateMin || dateMax)) {
    if (!dateMin || !dateMax) {
      throw new Error("Both dateMin and dateMax are required for date range.");
    }
    resolvedTbs = `cdr:1,cd_min:${toUsDate(dateMin)},cd_max:${toUsDate(dateMax)}`;
  }

  if (!resolvedTbs && recency) {
    resolvedTbs = RECENCY_TO_TBS[recency];
  }

  const response = await axios.get(SERPAPI_BASE_URL, {
    params: {
      api_key: apiKey,
      q: query,
      engine,
      num,
      location,
      uule,
      lat,
      lon,
      radius,
      ludocid,
      lsig,
      kgmid,
      si,
      ibp,
      uds,
      google_domain: googleDomain,
      gl,
      hl,
      cr,
      lr,
      safe,
      nfpr,
      filter,
      tbm,
      start,
      tbs: resolvedTbs,
      device,
      no_cache: noCache,
      async,
      zero_trace: zeroTrace,
      output: output || "json",
      json_restrictor: jsonRestrictor,
      ...(extraParams || {}),
    },
  });

  return response.data;
};
