
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
import { API_URL } from '../config';

function ProductCard({ product }) {
  const safeUrl = (() => {
    try {
      const url = new URL(product.productUrl);
      return ['https:', 'http:'].includes(url.protocol)
        ? url.href
        : null;
    } catch {
      return null;
    }
  })();

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 2.5,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {product.image ? (
        <Box
          component="img"
          src={product.image}
          alt={product.title || 'Product'}
          loading="lazy"
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
          Match relevance:{' '}
          {Math.round((product.matchScore || 0) * 100)}%
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

  const query = useMemo(
    () => (queryProp ?? listing?.title ?? '').trim(),
    [queryProp, listing?.title]
  );

  const category = categoryProp ?? listing?.category ?? '';

  useEffect(() => {
    if (!open) return undefined;

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
          category,
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

        setData(payload);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            err.message || 'Comparison is unavailable right now.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [open, query, category]);

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
          </Tabs>
        </Box>

        {loading && (
          <Box
            sx={{
              py: 7,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography color="text.secondary">
              Searching product databases…
            </Typography>
          </Box>
        )}

        {error && !loading && (
          <Alert severity="warning" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && data && (
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
                    key={`${product.source}-${product.identifier || product.title}-${index}`}
                    product={product}
                  />
                ))}
              </Box>
            ) : (
              <Box sx={{ py: 7, textAlign: 'center' }}>
                <SearchIcon
                  sx={{
                    fontSize: 44,
                    color: 'text.disabled',
                    mb: 1,
                  }}
                />

                <Typography fontWeight={650}>
                  No matching products found
                </Typography>

                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ mt: 0.5 }}
                >
                  Try another listing title. More marketplaces can be
                  added later.
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mt: 2,
                flexWrap: 'wrap',
              }}
            >
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
      </DialogContent>
    </Dialog>
  );
}
