
import express from "express";

const router = express.Router();

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v2";

const MAX_RESULTS_PER_SEARCH = 8;
const MAX_PAGES_TO_SCRAPE = 16;
const SCRAPE_CONCURRENCY = 4;

const STORES = [
  { name: "Amazon", domain: "amazon.in" },
  { name: "Flipkart", domain: "flipkart.com" },
  { name: "Meesho", domain: "meesho.com" },
];

const OFFICIAL_BRANDS = {
  apple: ["apple.com"],
  samsung: ["samsung.com"],
  google: ["store.google.com", "google.com"],
  oneplus: ["oneplus.in", "oneplus.com"],
  xiaomi: ["mi.com", "xiaomi.com"],
  realme: ["realme.com"],
  vivo: ["vivo.com"],
  oppo: ["oppo.com"],
  motorola: ["motorola.in", "motorola.com"],
  nike: ["nike.com"],
  adidas: ["adidas.co.in", "adidas.com"],
  puma: ["puma.com"],
  sony: ["sony.co.in", "sony.com"],
  lenovo: ["lenovo.com"],
  dell: ["dell.com"],
  hp: ["hp.com"],
  boat: ["boat-lifestyle.com"],
};

function cleanText(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim());

    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.username || url.password) return null;

    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function hostnameOf(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function belongsToDomain(url, domains) {
  const hostname = hostnameOf(url);

  return domains.some((domain) => {
    const normalized = domain.toLowerCase().replace(/^www\./, "");
    return hostname === normalized || hostname.endsWith(`.${normalized}`);
  });
}

function getSource(url) {
  const store = STORES.find((item) => belongsToDomain(url, [item.domain]));
  if (store) return store.name;

  for (const [brand, domains] of Object.entries(OFFICIAL_BRANDS)) {
    if (belongsToDomain(url, domains)) {
      return `${brand[0].toUpperCase()}${brand.slice(1)} Official`;
    }
  }

  return hostnameOf(url);
}

function getBrandDomains(query) {
  const result = [];
  const text = query.toLowerCase();

  for (const [brand, domains] of Object.entries(OFFICIAL_BRANDS)) {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text)) {
      result.push(...domains);
    }
  }

  return [...new Set(result)];
}

async function firecrawlRequest(endpoint, body) {
  if (!FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is missing from backend/.env");
  }

  const response = await fetch(`${FIRECRAWL_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload.error || payload.message || `Firecrawl HTTP ${response.status}`
    );
  }

  return payload;
}

function extractSearchResults(response) {
  const possible = [
    response?.data?.web,
    response?.data?.results,
    response?.data,
    response?.results,
    response?.web,
  ];

  for (const value of possible) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

async function searchProducts(query, domain = null) {
  const searchQuery = domain
    ? `site:${domain} ${query} product price`
    : `${query} buy online India product price`;

  try {
    const response = await firecrawlRequest("/search", {
      query: searchQuery,
      limit: MAX_RESULTS_PER_SEARCH,
    });

    const results = extractSearchResults(response);

    console.log(
      `[MarketComparison] Search "${searchQuery}" returned ${results.length} results`
    );

    return results
      .map((item) => {
        const url = normalizeUrl(item.url || item.link);
        if (!url) return null;

        if (domain && !belongsToDomain(url, [domain])) return null;

        return {
          url,
          searchTitle: cleanText(item.title || item.metadata?.title || ""),
          searchDescription: cleanText(
            item.description || item.snippet || item.metadata?.description || ""
          ),
          source: getSource(url),
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error(
      `[MarketComparison] Search failed (${domain || "general"}): ${error.message}`
    );
    return [];
  }
}

function firstValue(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
}

function parsePrice(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value !== "string") return null;

  const text = value.replace(/,/g, "").trim();

  if (/^\d+(?:\.\d{1,2})?$/.test(text)) {
    const number = Number(text);
    return number > 0 ? number : null;
  }

  const match = text.match(
    /(?:₹|INR|Rs\.?|US\$|\$)\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:₹|INR|Rs\.?|US\$|\$)/i
  );

  if (!match) return null;

  const number = Number(match[1] || match[2]);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function getPrice(data, metadata = {}) {
  const product = data?.product || {};
  const offers = product.offers;
  const offer = Array.isArray(offers) ? offers[0] : offers;

  const raw = firstValue(
    product.price,
    offer?.price,
    data?.price,
    metadata.productPrice,
    metadata["product:price:amount"],
    metadata.price
  );

  return parsePrice(raw);
}

function getCurrency(data, metadata = {}, url = "") {
  const product = data?.product || {};
  const offers = product.offers;
  const offer = Array.isArray(offers) ? offers[0] : offers;

  const currency = firstValue(
    product.currency,
    offer?.priceCurrency,
    data?.currency,
    metadata["product:price:currency"]
  );

  if (currency) return String(currency).toUpperCase();

  const raw = JSON.stringify([
    product.price,
    offer?.price,
    data?.price,
    metadata.productPrice,
    metadata["product:price:amount"],
  ]);

  if (/₹|\bINR\b|\bRs\.?/i.test(raw)) return "INR";
  if (/US\$|\$/.test(raw)) return "USD";

  return /\.in(?:\/|$)/i.test(url) ? "INR" : null;
}

function getImage(data, metadata = {}) {
  const candidates = [
    data?.json?.image,
    data?.llm_extraction?.image,
    data?.product?.images,
    data?.product?.image,
    data?.images,
    data?.image,
    metadata.ogImage,
    metadata["og:image"],
    metadata.twitterImage,
    metadata["twitter:image"],
  ];

  for (const candidate of candidates) {
    const values = Array.isArray(candidate) ? candidate : [candidate];

    for (const value of values) {
      const raw = typeof value === "string" ? value : value?.url || value?.src;
      const url = normalizeUrl(raw);

      if (url) return url;
    }
  }

  return null;
}

function getTitle(data, metadata = {}, fallback = "") {
  const extracted = data?.json || data?.llm_extraction || {};
  const product = data?.product || {};

  return cleanText(
    firstValue(
      extracted.title,
      product.title,
      product.name,
      data?.title,
      metadata.ogTitle,
      metadata["og:title"],
      metadata.title,
      fallback,
      ""
    )
  ).slice(0, 300);
}

function getDescription(data, metadata = {}, fallback = "") {
  return cleanText(
    firstValue(
      data?.json?.description,
      data?.product?.description,
      data?.description,
      metadata.ogDescription,
      metadata["og:description"],
      metadata.description,
      fallback,
      ""
    )
  ).slice(0, 1000);
}

function tokenize(value) {
  return cleanText(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function scoreProduct(query, title) {
  const queryTerms = [...new Set(tokenize(query).filter((word) => word.length > 1))];
  const titleTerms = new Set(tokenize(title));

  if (!queryTerms.length || !titleTerms.size) return 0;

  const matched = queryTerms.filter((word) => titleTerms.has(word)).length;

  return Math.min(100, Math.round((matched / queryTerms.length) * 100));
}

function getModelNumbers(value) {
  return tokenize(value).filter((token) => /\d/.test(token));
}

function isAccessoryQuery(query) {
  return /\b(charger|charging cable|usb cable|adapter|case|cover|screen protector|tempered glass|power bank|earbuds|headphones|replacement battery)\b/i.test(
    query
  );
}

function isAccessoryTitle(title) {
  return /\b(charger|charging cable|usb cable|adapter|phone case|mobile case|back cover|screen protector|tempered glass|power bank|replacement battery|camera protector)\b/i.test(
    title
  );
}

function hasAccessoryConflict(query, title) {
  return !isAccessoryQuery(query) && isAccessoryTitle(title);
}

function isErrorOrGenericTitle(title) {
  const patterns = [
    /^product listing$/i,
    /^untitled product$/i,
    /^503\b.*service unavailable/i,
    /^502\b.*bad gateway/i,
    /^404\b.*not found/i,
    /access denied/i,
    /robot check/i,
    /captcha/i,
    /page not found/i,
    /internal server error/i,
    /service unavailable/i,
    /^search results/i,
    /^category\b/i,
    /^just a moment/i,
    /^online shopping site/i,
  ];

  return !title || title.length < 4 || patterns.some((pattern) => pattern.test(title));
}

function isLikelyProductUrl(url) {
  const hostname = hostnameOf(url);

  const allowedDomains = [
    ...STORES.map((store) => store.domain),
    ...Object.values(OFFICIAL_BRANDS).flat(),
  ];

  if (!belongsToDomain(url, allowedDomains)) return false;

  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");

    if (!path) return false;

    if (
      /\/(search|searchresult|category|categories|collections|customer-service|help|sitemap)$/i.test(path)
    ) {
      return false;
    }

    if (parsed.searchParams.has("k") || parsed.searchParams.has("q")) {
      return false;
    }

    // Marketplace homepages and common generic pages are never product URLs.
    if (
      ["amazon.in", "amazon.com", "flipkart.com", "meesho.com"].includes(hostname) &&
      (path === "" || path === "/")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function validateExtractedProduct(product, query) {
  if (!product) return null;

  const title = cleanText(product.title);
  if (isErrorOrGenericTitle(title)) return null;
  if (hasAccessoryConflict(query, title)) return null;

  const score = scoreProduct(query, title);

  // Require strong title overlap. The prompt's own match flag is not enough.
  if (score < 50) return null;

  // Prevent an exact-looking result with a different model number.
  const queryModels = getModelNumbers(query);
  const titleModels = getModelNumbers(title);

  const hasModelConflict =
    queryModels.length > 0 &&
    titleModels.length > 0 &&
    queryModels.some((model) => !titleModels.includes(model));

  if (hasModelConflict) return null;

  return {
    ...product,
    title,
    matchScore: score,
  };
}

async function scrapeProduct(candidate, query) {
  try {
    const response = await firecrawlRequest("/scrape", {
      url: candidate.url,
      formats: [
        "product",
        "images",
        "markdown",
        {
          type: "json",
          prompt: `
Extract the actual product sold on this page.

User's requested product: "${query}"

Return these fields:
- title: exact product name and model
- brand: manufacturer
- price: current selling price as a number, or null
- currency: currency code such as INR, or null
- image: main product image URL, or null
- productUrl: canonical product page URL
- isProductPage: true only when this page is an actual individual product page
- isAccessory: true if this is an accessory rather than the requested main product
- matchesQuery: true only if the product is the requested item

Rules:
1. Never substitute a charger, cable, case, cover, adapter, screen protector,
   or other accessory for a phone or other main product.
2. Reject homepages, search results, category pages, error pages, articles,
   ads and recommendation pages.
3. The title must identify the actual product model.
4. Keep storage, size, model number and other important variants accurate.
5. Extract the current selling price, not a made-up or estimated price.
6. Never invent missing values. Return null when a field cannot be verified.
7. Use the main product image, not a logo, banner or unrelated image.
`,
          schema: {
            type: "object",
            properties: {
              title: { type: ["string", "null"] },
              brand: { type: ["string", "null"] },
              price: { type: ["number", "null"] },
              currency: { type: ["string", "null"] },
              image: { type: ["string", "null"] },
              productUrl: { type: ["string", "null"] },
              isProductPage: { type: "boolean" },
              isAccessory: { type: "boolean" },
              matchesQuery: { type: "boolean" },
            },
            required: [
              "title",
              "brand",
              "price",
              "currency",
              "image",
              "productUrl",
              "isProductPage",
              "isAccessory",
              "matchesQuery",
            ],
          },
        },
      ],
      onlyMainContent: false,
    });

    const data = response.data || response;
    const metadata = data.metadata || {};
    const extracted = data.json || data.llm_extraction || {};
    const title = getTitle(data, metadata, candidate.searchTitle);

    // Require the structured extraction to identify a genuine product page.
    if (
      extracted.isProductPage !== true ||
      extracted.isAccessory === true ||
      extracted.matchesQuery !== true
    ) {
      console.log(`[MarketComparison] Rejected irrelevant result: ${candidate.url}`);
      return null;
    }

    const productUrl =
      normalizeUrl(extracted.productUrl) ||
      normalizeUrl(metadata.canonical) ||
      candidate.url;

    if (!productUrl || !isLikelyProductUrl(productUrl)) return null;

    const product = {
      id: productUrl,
      title,
      brand: extracted.brand || null,
      description: getDescription(data, metadata, candidate.searchDescription),
      source: getSource(productUrl),
      url: productUrl,
      productUrl,
      price:
        typeof extracted.price === "number" && extracted.price > 0
          ? extracted.price
          : getPrice(data, metadata),
      currency:
        extracted.currency ||
        getCurrency(data, metadata, productUrl),
      image:
        normalizeUrl(extracted.image) ||
        getImage(data, metadata),
      category: null,
      matchScore: 0,
    };

    return validateExtractedProduct(product, query);
  } catch (error) {
    console.error(
      `[MarketComparison] Extraction failed for ${candidate.url}: ${error.message}`
    );

    // Do not show unverified snippets as confirmed product listings.
    return null;
  }
}

async function mapWithConcurrency(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;

      results[index] = await callback(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );

  return results;
}

function deduplicate(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (!item?.url) return false;

    const key = item.url
      .split("#")[0]
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "")
      .toLowerCase();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

router.get("/", async (req, res) => {
  try {
    const query = cleanText(req.query.query || "");
    const category = cleanText(req.query.category || "");

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Please provide a product query.",
      });
    }

    if (query.length > 200 || category.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Query or category is too long.",
      });
    }

    if (!FIRECRAWL_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "FIRECRAWL_API_KEY is missing from backend/.env.",
      });
    }

    const fullQuery = [query, category].filter(Boolean).join(" ");
    const officialDomains = getBrandDomains(fullQuery);

    const targets = [
      ...STORES.map((store) => store.domain),
      ...officialDomains,
    ];

    const searchResponses = await Promise.all(
      targets.map((domain) => searchProducts(fullQuery, domain))
    );

    let candidates = deduplicate(searchResponses.flat())
      .filter((candidate) => isLikelyProductUrl(candidate.url))
      .slice(0, MAX_PAGES_TO_SCRAPE);

    if (candidates.length === 0) {
      console.warn("[MarketComparison] Trying general web search.");

      candidates = deduplicate(await searchProducts(fullQuery))
        .filter((candidate) => isLikelyProductUrl(candidate.url))
        .slice(0, MAX_PAGES_TO_SCRAPE);
    }

    console.log(
      `[MarketComparison] Found ${candidates.length} candidate URLs for "${fullQuery}".`
    );

    if (!candidates.length) {
      return res.json({
        success: true,
        query,
        category: category || null,
        exactMatches: [],
        similarProducts: [],
        total: 0,
        notice: "No product pages were found for this search.",
        debug: {
          searchedDomains: targets,
          candidateUrls: 0,
        },
      });
    }

    const extractedResults = await mapWithConcurrency(
      candidates,
      SCRAPE_CONCURRENCY,
      (candidate) => scrapeProduct(candidate, fullQuery)
    );

    const products = deduplicate(extractedResults.filter(Boolean))
      .map((product) => ({
        ...product,
        category: category || null,
        matchScore: Math.min(100, product.matchScore),
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    const exactMatches = products.filter(
      (product) => product.matchScore >= 70
    );

    const similarProducts = products.filter(
      (product) =>
        product.matchScore >= 50 && product.matchScore < 70
    );

    return res.json({
      success: true,
      query,
      category: category || null,
      exactMatches,
      similarProducts,
      total: products.length,
      notice:
        products.length === 0
          ? "No sufficiently relevant product listings passed validation. Try a more specific model name."
          : undefined,
      providersAvailable: [...new Set(products.map((product) => product.source))],
      debug: {
        searchedDomains: targets,
        candidateUrls: candidates.length,
        returnedProducts: products.length,
        productsWithPrice: products.filter(
          (product) => product.price !== null
        ).length,
        productsWithImage: products.filter(
          (product) => Boolean(product.image)
        ).length,
      },
    });
  } catch (error) {
    console.error("[MarketComparison] Route error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to compare products.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});

export default router;
