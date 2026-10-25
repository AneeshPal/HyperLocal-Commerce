
import express from "express";

const router = express.Router();

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

const REVIEW_TERMS =
  /\breview\b|\btested\b|\bworth it\b|\bshould you buy\b|\bpros and cons\b|\bcamera test\b|\bbattery test\b|\blong term review\b|\bfull review\b/i;

const EXCLUDE_TERMS =
  /\b(giveaway|trailer|reaction video|music video|shorts compilation)\b/i;

router.get("/", async (req, res) => {
  const query = String(req.query.query || "").trim();
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!query || query.length > 200) {
    return res.status(400).json({
      message: "Provide a valid product query.",
    });
  }

  if (!apiKey) {
    return res.status(503).json({
      message: "YOUTUBE_API_KEY is missing from backend .env.",
    });
  }

  try {
    async function youtubeRequest(endpoint, params) {
      const searchParams = new URLSearchParams({
        ...params,
        key: apiKey,
      });

      const response = await fetch(
        `${YOUTUBE_API}/${endpoint}?${searchParams.toString()}`,
        { signal: AbortSignal.timeout(15000) }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error?.message || "YouTube API request failed."
        );
      }

      return payload;
    }

    const [relevant, popular] = await Promise.all([
      youtubeRequest("search", {
        part: "snippet",
        type: "video",
        q: `${query} review`,
        maxResults: "25",
        order: "relevance",
        regionCode: "IN",
        relevanceLanguage: "en",
        safeSearch: "moderate",
      }),
      youtubeRequest("search", {
        part: "snippet",
        type: "video",
        q: `${query} review`,
        maxResults: "25",
        order: "viewCount",
        regionCode: "IN",
        relevanceLanguage: "en",
        safeSearch: "moderate",
      }),
    ]);

    const candidates = new Map();

    for (const item of [
      ...(relevant.items || []),
      ...(popular.items || []),
    ]) {
      const id = item.id?.videoId;

      if (id) candidates.set(id, item);
    }

    const ids = [...candidates.keys()];

    if (!ids.length) {
      return res.json({ query, reviews: [] });
    }

    const details = await youtubeRequest("videos", {
      part: "snippet,statistics",
      id: ids.join(","),
    });

    const queryWords = query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 1);

    const videos = (details.items || [])
      .map((video) => {
        const snippet = video.snippet || {};
        const stats = video.statistics || {};
        const title = snippet.title || "";
        const description = snippet.description || "";
        const titleText = title.toLowerCase();
        const fullText = `${title} ${description}`.toLowerCase();

        const matchedWords = queryWords.filter((word) =>
          fullText.includes(word)
        ).length;

        const relevance = queryWords.length
          ? matchedWords / queryWords.length
          : 0;

        const thumbnails = snippet.thumbnails || {};

        return {
          videoId: video.id,
          title,
          channel: snippet.channelTitle || "",
          thumbnail:
            thumbnails.high?.url ||
            thumbnails.medium?.url ||
            thumbnails.default?.url ||
            `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${video.id}`,
          viewCount: Number(stats.viewCount || 0),
          likeCount:
            stats.likeCount == null ? null : Number(stats.likeCount),
          commentCount:
            stats.commentCount == null
              ? null
              : Number(stats.commentCount),
          publishedAt: snippet.publishedAt || null,
          relevance,
          isReview: REVIEW_TERMS.test(titleText),
          excluded: EXCLUDE_TERMS.test(titleText),
        };
      })
      .filter(
        (video) =>
          video.relevance >= 0.5 &&
          video.isReview &&
          !video.excluded
      );

    const maxViews = Math.max(
      1,
      ...videos.map((video) => Math.log10(video.viewCount + 1))
    );

    const reviews = videos
      .map((video) => {
        const popularity =
          Math.log10(video.viewCount + 1) / maxViews;

        const likeRatio =
          video.likeCount != null && video.viewCount > 0
            ? video.likeCount / video.viewCount
            : 0;

        const engagement = Math.min(1, likeRatio / 0.1);

        const published = video.publishedAt
          ? new Date(video.publishedAt).getTime()
          : 0;

        const ageDays = published
          ? Math.max(0, (Date.now() - published) / 86400000)
          : Infinity;

        const recency = Number.isFinite(ageDays)
          ? Math.exp(-ageDays / 730)
          : 0;

        const score =
          video.relevance * 0.5 +
          popularity * 0.25 +
          engagement * 0.15 +
          recency * 0.1;

        let reliabilityLabel = "Check review details";

        if (
          video.relevance >= 0.8 &&
          video.viewCount >= 10000 &&
          video.likeCount != null &&
          video.likeCount >= 100
        ) {
          reliabilityLabel = "Popular, relevant review";
        } else if (
          video.relevance >= 0.7 &&
          video.viewCount >= 1000
        ) {
          reliabilityLabel = "Relevant review";
        }

        return {
          videoId: video.videoId,
          title: video.title,
          channel: video.channel,
          thumbnail: video.thumbnail,
          url: video.url,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          commentCount: video.commentCount,
          publishedAt: video.publishedAt,
          relevance: Number(video.relevance.toFixed(2)),
          rankingScore: Number(score.toFixed(3)),
          reliabilityLabel,
        };
      })
      .sort((a, b) => b.rankingScore - a.rankingScore)
      .slice(0, 6);

    return res.json({ query, reviews });
  } catch (error) {
    console.error("YouTube review search failed:", error.message);

    return res.status(502).json({
      message:
        "Could not retrieve YouTube reviews. Check the API key, quota, and backend logs.",
    });
  }
});

export default router;
