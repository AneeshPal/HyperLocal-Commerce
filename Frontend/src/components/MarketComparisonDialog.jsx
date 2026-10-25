
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import YouTubeIcon from '@mui/icons-material/YouTube';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';

import { API_URL } from '../config';

function formatCount(value) {
  if (value == null) return 'Unavailable';

  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value) {
  if (!value) return 'Date unavailable';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Accept only valid HTTP/HTTPS links.
function getSafeUrl(value) {
  if (!value || typeof value !== 'string') return null;

  try {
    const url = new URL(value);

    return ['https:', 'http:'].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

// Normalize backend score formats.
// Backend may send either 0–100 or legacy 0–1 scores.
function normalizeScore(value) {
  const score = Number(value);

  if (!Number.isFinite(score)) return 0;

  const percentage = score > 0 && score <= 1
    ? score * 100
    : score;

  return Math.min(100, Math.max(0, Math.round(percentage)));
}

function normalizeProduct(product) {
  const productUrl =
    product?.productUrl ||
    product?.url ||
    product?.link ||
    '';

  return {
    ...product,
    title: String(product?.title || '').trim(),
    productUrl,
    matchScore: normalizeScore(product?.matchScore),
  };
}

// Remove error pages, generic store pages and non-product results.
function isRealProductListing(product) {
  const title = String(product?.title || '').trim();
  const lowerTitle = title.toLowerCase();
  const url = getSafeUrl(product?.productUrl);

  if (!title || title.length < 4 || !url) return false;

  const invalidTitlePatterns = [
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
    /^online shopping site/i,
    /^search results/i,
    /^category\b/i,
    /^just a moment/i,
    /^amazon(?:\.in)?\s*$/i,
    /^flipkart\s*$/i,
    /^meesho\s*$/i,
  ];

  if (invalidTitlePatterns.some((pattern) => pattern.test(title))) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '');

    // Never display a store homepage.
    if (!path) return false;

    // Ignore generic search, category and help pages.
    if (
      /\/(search|searchresult|category|categories|collections|customer-service|help|sitemap)$/i.test(
        path
      )
    ) {
      return false;
    }

    if (parsed.searchParams.has('k') || parsed.searchParams.has('q')) {
      return false;
    }

    // Reject generic marketplace homepages even if they have a query string.
    const storeDomains = [
      'amazon.in',
      'amazon.com',
      'flipkart.com',
      'meesho.com',
    ];

    const isStoreHomepage = storeDomains.some(
      (domain) =>
        hostname === domain &&
        (path === '' || path === '/')
    );

    if (isStoreHomepage) return false;
  } catch {
    return false;
  }

  // Do not show results that have no overlap with the search at all.
  return product.matchScore > 0;
}

function normalizeProductList(items) {
  if (!Array.isArray(items)) return [];

  const seen = new Set();

  return items
    .map(normalizeProduct)
    .filter(isRealProductListing)
    .filter((product) => {
      const key = product.productUrl
        .split('#')[0]
        .replace(/\/+$/, '')
        .toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
}

function ProductCard({ product }) {
  const safeUrl = getSafeUrl(product.productUrl);
  const score = normalizeScore(product.matchScore);

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 2.5,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {product.image ? (
        <Box
          component="img"
          src={product.image}
          alt={product.title || 'Product'}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
          sx={{
            width: '100%',
            height: 150,
            objectFit: 'contain',
            bgcolor: '#fafafa',
            p: 1,
          }}
        />
      ) : (
        <Box
          sx={{
            height: 150,
            bgcolor: '#f7f7f5',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <SearchIcon sx={{ fontSize: 42, color: 'text.disabled' }} />
        </Box>
      )}

      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          flexGrow: 1,
        }}
      >
        <Chip
          label={product.source || 'Marketplace'}
          size="small"
          sx={{ alignSelf: 'flex-start' }}
        />

        <Typography fontWeight={650} sx={{ lineHeight: 1.35 }}>
          {product.title || 'Untitled product'}
        </Typography>

        {product.brand && (
          <Typography variant="body2" color="text.secondary">
            {product.brand}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary">
          {product.price == null
            ? 'Price unavailable from this source'
            : `${product.currency || 'INR'} ${Number(
                product.price
              ).toLocaleString('en-IN')}`}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Match relevance: {score}%
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          component="a"
          href={safeUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          endIcon={<OpenInNewIcon />}
          fullWidth
          disabled={!safeUrl}
        >
          View product
        </Button>
      </CardContent>
    </Card>
  );
}

function ReviewCard({ review }) {
  const videoUrl = (() => {
    const safeUrl = getSafeUrl(review.url);

    if (!safeUrl) return null;

    try {
      const url = new URL(safeUrl);
      const hostname = url.hostname.toLowerCase();

      if (
        ['https:', 'http:'].includes(url.protocol) &&
        [
          'youtube.com',
          'www.youtube.com',
          'm.youtube.com',
          'youtu.be',
        ].includes(hostname)
      ) {
        return url.href;
      }
    } catch {
      // Ignore malformed video links.
    }

    return null;
  })();

  if (!videoUrl) return null;

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2.5,
        overflow: 'hidden',
      }}
    >
      <Box
        component="a"
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: 'block',
          aspectRatio: '16 / 9',
          bgcolor: '#f4f4f4',
        }}
      >
        {review.thumbnail ? (
          <Box
            component="img"
            src={review.thumbnail}
            alt={review.title || 'YouTube review'}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <YouTubeIcon sx={{ fontSize: 54, color: '#e62117' }} />
          </Box>
        )}
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
        }}
      >
        <Typography fontWeight={700} sx={{ lineHeight: 1.4 }}>
          {review.title || 'Product review'}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {review.channel || 'YouTube creator'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            icon={<VisibilityOutlinedIcon />}
            label={`${formatCount(review.viewCount)} views`}
            variant="outlined"
          />

          <Chip
            size="small"
            icon={<ThumbUpAltOutlinedIcon />}
            label={
              review.likeCount == null
                ? 'Likes unavailable'
                : `${formatCount(review.likeCount)} likes`
            }
            variant="outlined"
          />

          {review.commentCount != null && (
            <Chip
              size="small"
              icon={<CommentOutlinedIcon />}
              label={`${formatCount(review.commentCount)} comments`}
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary">
          Published: {formatDate(review.publishedAt)}
        </Typography>

        <Chip
          size="small"
          color={
            review.reliabilityLabel === 'Popular, relevant review'
              ? 'success'
              : review.reliabilityLabel === 'Relevant review'
                ? 'primary'
                : 'default'
          }
          label={review.reliabilityLabel || 'Check review details'}
          sx={{ alignSelf: 'flex-start', maxWidth: '100%' }}
        />

        <Box sx={{ flexGrow: 1 }} />

        <Button
          component="a"
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          color="error"
          startIcon={<YouTubeIcon />}
          endIcon={<OpenInNewIcon />}
          fullWidth
        >
          Watch review
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MarketComparisonDialog({
  open,
  onClose,
  listing,
  query: queryProp,
  category: categoryProp,
}) {
  const [tab, setTab] = useState(0);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  const query = useMemo(
    () => String(queryProp ?? listing?.title ?? '').trim(),
    [queryProp, listing?.title]
  );

  const category = categoryProp ?? listing?.category ?? '';

  // Load marketplace products.
  useEffect(() => {
    if (!open || tab === 3) return undefined;

    if (!query) {
      setData(null);
      setError('The listing does not have a product title to search.');
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError('');
      setData(null);

      try {
        const params = new URLSearchParams({
          query,
          category: String(category || ''),
        });

        const response = await fetch(
          `${API_URL}/market-comparison?${params.toString()}`,
          { signal: controller.signal }
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload.message || 'Could not load product matches.'
          );
        }

        setData({
          ...payload,
          exactMatches: normalizeProductList(payload.exactMatches),
          similarProducts: normalizeProductList(payload.similarProducts),
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            err.message || 'Comparison is unavailable right now.'
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [open, query, category, tab]);

  // Load YouTube reviews only when the user opens View Reviews.
  useEffect(() => {
    if (!open || tab !== 3 || !query) return undefined;

    const controller = new AbortController();

    async function loadReviews() {
      setReviewsLoading(true);
      setReviewsError('');
      setReviews([]);

      try {
        const params = new URLSearchParams({ query });

        const response = await fetch(
          `${API_URL}/product-reviews?${params.toString()}`,
          { signal: controller.signal }
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload.message || 'Could not load YouTube reviews.'
          );
        }

        setReviews(
          Array.isArray(payload.reviews) ? payload.reviews : []
        );
      } catch (err) {
        if (err.name !== 'AbortError') {
          setReviewsError(
            err.message || 'Reviews are unavailable right now.'
          );
        }
      } finally {
        if (!controller.signal.aborted) setReviewsLoading(false);
      }
    }

    loadReviews();

    return () => controller.abort();
  }, [open, tab, query]);

  // Reset selected tab when the dialog opens for a new session.
  useEffect(() => {
    if (open) setTab(0);
  }, [open, query]);

  const exactMatches = Array.isArray(data?.exactMatches)
    ? data.exactMatches
    : [];

  const similarProducts = Array.isArray(data?.similarProducts)
    ? data.similarProducts
    : [];

  const products =
    tab === 0
      ? [...exactMatches, ...similarProducts]
      : tab === 1
        ? exactMatches
        : similarProducts;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      aria-labelledby="market-comparison-title"
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          maxHeight: '88vh',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(18, 22, 28, 0.68)',
            backdropFilter: 'blur(3px)',
          },
        },
      }}
    >
      <DialogTitle
        id="market-comparison-title"
        sx={{ pr: 7, pb: 1 }}
      >
        <Typography variant="h5" fontWeight={750}>
          Browse market
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Results for {query}
        </Typography>

        <IconButton
          aria-label="Close market comparison"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 0, bgcolor: '#fcfcfb' }}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            bgcolor: '#fcfcfb',
            borderBottom: 1,
            borderColor: 'divider',
            mb: 2,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab
              label={`All (${exactMatches.length + similarProducts.length})`}
            />
            <Tab label={`Exact matches (${exactMatches.length})`} />
            <Tab label={`Similar products (${similarProducts.length})`} />
            <Tab
              icon={<YouTubeIcon />}
              iconPosition="start"
              label="View Reviews"
            />
          </Tabs>
        </Box>

        {tab !== 3 && loading && (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <CircularProgress />
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Searching product databases…
            </Typography>
          </Box>
        )}

        {tab !== 3 && error && !loading && (
          <Alert severity="warning" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {tab !== 3 && !loading && !error && data && (
          <>
            {data.notice && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {data.notice}
              </Alert>
            )}

            {products.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 2,
                }}
              >
                {products.map((product, index) => (
                  <ProductCard
                    key={`${product.source}-${product.productUrl}-${index}`}
                    product={product}
                  />
                ))}
              </Box>
            ) : (
              <Box sx={{ py: 7, textAlign: 'center' }}>
                <SearchIcon
                  sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }}
                />

                <Typography fontWeight={650}>
                  No matching products found
                </Typography>

                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ mt: 0.5 }}
                >
                  Try another listing title.
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              {(Array.isArray(data.providersAvailable)
                ? data.providersAvailable
                : []
              ).map((provider) => (
                <Chip
                  key={provider}
                  label={`Source: ${provider}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </>
        )}

        {tab === 3 && (
          <Box sx={{ py: 1 }}>
            <Typography variant="h6" fontWeight={750} sx={{ mb: 0.5 }}>
              Top YouTube reviews
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Compare popularity, likes and recency for {query}. These are
              signals to help evaluate reviews, not guarantees of accuracy.
            </Typography>

            {reviewsLoading && (
              <Box sx={{ py: 7, textAlign: 'center' }}>
                <CircularProgress />
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Finding and ranking product reviews…
                </Typography>
              </Box>
            )}

            {reviewsError && !reviewsLoading && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {reviewsError}
              </Alert>
            )}

            {!reviewsLoading && !reviewsError && reviews.length > 0 && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 2,
                }}
              >
                {reviews.map((review, index) => (
                  <ReviewCard
                    key={review.videoId || review.url || index}
                    review={review}
                  />
                ))}
              </Box>
            )}

            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <YouTubeIcon
                  sx={{ fontSize: 48, color: '#e62117', mb: 1 }}
                />

                <Typography fontWeight={650}>
                  No matching review videos found
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, mb: 2 }}
                >
                  Try searching YouTube directly.
                </Typography>

                <Button
                  component="a"
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} review`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  color="error"
                  endIcon={<OpenInNewIcon />}
                >
                  Search YouTube
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
