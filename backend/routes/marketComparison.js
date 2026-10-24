
import express from "express";

const router = express.Router();

const PRODUCT_GURU_URL = "https://myproduct.guru";
const OPEN_FOOD_FACTS_URL =
  "https://world.openfoodfacts.org/cgi/search.pl";

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreMatch(query, title) {
  const queryWords = normalize(query).split(/\s+/).filter(Boolean);
  const titleWords = new Set(normalize(title).split(/\s+/));

  if (!queryWords.length) return 0;

  const matches = queryWords.filter(word =>
    titleWords.has(word)
  ).length;

  return matches / queryWords.length;
}

function classifyMatch(query, product) {
  const score = scoreMatch(query, product.title);

  // Exact means the normalized title matches.
  // This is a basic fallback, not definitive product identity.
  if (normalize(query) === normalize(product.title)) {
    return { type: "exact", score: 1 };
  }

  if (score >= 0.5) {
    return { type: "similar", score };
  }

  return { type: "reject", score };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "MajorProjectProductComparison/1.0",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Provider returned ${response.status}`);
  }

  return response.json();
}

async function searchProductGuru(query) {
  const url = new URL("/search", PRODUCT_GURU_URL);
  url.searchParams.set("q", query);

  const data = await fetchJson(url.toString());

  // Adapt this mapping after confirming ProductGuru's
  // actual API response format.
  const items = Array.isArray(data)
    ? data
    : data.products || data.results || [];

  return items.map(item => ({
    source: "ProductGuru",
    identifier: String(item.id || item.barcode || item.gtin || ""),
    title: item.title || item.name || item.product_name || "",
    brand: item.brand || "",
    price: null,
    currency: "INR",
    image: item.image || item.image_url || "",
    productUrl: item.url || item.product_url || "",
  })).filter(item => item.title);
}

async function searchOpenFoodFacts(query) {
  const url = new URL(OPEN_FOOD_FACTS_URL);

  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "15");
  url.searchParams.set(
    "fields",
    "code,product_name,brands,image_front_url,url"
  );

  const data = await fetchJson(url.toString());

  return (data.products || []).map(item => ({
    source: "Open Food Facts",
    identifier: item.code || "",
    title: item.product_name || "",
    brand: item.brands || "",
    price: null,
    currency: "INR",
    image: item.image_front_url || "",
    productUrl:
      item.url ||
      `https://world.openfoodfacts.org/product/${item.code}`,
  })).filter(item => item.title);
}

router.get("/", async (req, res) => {
  const query = String(req.query.query || "").trim();
  const category = String(req.query.category || "").toLowerCase();

  if (!query) {
    return res.status(400).json({
      message: "Product query is required.",
    });
  }

  if (query.length > 200) {
    return res.status(400).json({
      message: "Product query is too long.",
    });
  }

  const providers = [
    {
      name: "ProductGuru",
      search: () => searchProductGuru(query),
    },
  ];

  // Open Food Facts is useful for food products only.
  if (
    /food|grocery|snack|drink|beverage|organic|dairy/.test(category)
  ) {
    providers.push({
      name: "Open Food Facts",
      search: () => searchOpenFoodFacts(query),
    });
  }

  const responses = await Promise.allSettled(
    providers.map(provider => provider.search())
  );

  const allProducts = [];
  const providersAvailable = [];

  responses.forEach((result, index) => {
    if (result.status === "fulfilled") {
      providersAvailable.push(providers[index].name);
      allProducts.push(...result.value);
    }
  });

  const exactMatches = [];
  const similarProducts = [];

  for (const product of allProducts) {
    const match = classifyMatch(query, product);

    if (match.type === "reject") continue;

    const normalizedProduct = {
      ...product,
      matchScore: match.score,
    };

    if (match.type === "exact") {
      exactMatches.push(normalizedProduct);
    } else {
      similarProducts.push(normalizedProduct);
    }
  }

  return res.json({
    query,
    exactMatches,
    similarProducts,
    providersAvailable,
    notice:
      "These sources do not provide verified live prices from Amazon, Flipkart or Meesho.",
  });
});

export default router;
