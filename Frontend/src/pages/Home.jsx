
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  TextField,
  Button,
  MenuItem,
} from '@mui/material';
import { useOutletContext, useLocation } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { categories } from '../data/mockData';
import { API_URL } from '../config';

const RADIUS_OPTIONS = [
  { value: 'infinite', label: 'All locations' },
  { value: '1', label: '1 km' },
  { value: '3', label: '3 km' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
];

export default function Home() {
  const { search, setSearch } = useOutletContext();
  const routeLocation = useLocation();

  const [activeCategory, setActiveCategory] = useState('All');
  const [radius, setRadius] = useState('infinite');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');

  // Request location only when a finite radius is selected.
  useEffect(() => {
    if (radius === 'infinite' || location) {
      setLocationLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    let cancelled = false;
    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;

        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLocationLoading(false);
      },
      (geoError) => {
        if (cancelled) return;

        console.error('Location error:', geoError);

        setLocationError(
          geoError.code === 1
            ? 'Location permission was denied. Allow location access to filter by distance, or choose All locations.'
            : 'Unable to get your location. Choose All locations or try again.'
        );

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );

    return () => {
      cancelled = true;
    };
  }, [radius, location]);

  const fetchListings = useCallback(
    async (signal) => {
      if (radius !== 'infinite' && !location) {
        setListings([]);
        setLoading(false);
        return;
      }

      if (
        minPrice !== '' &&
        maxPrice !== '' &&
        Number(minPrice) > Number(maxPrice)
      ) {
        setError('Minimum price cannot be greater than maximum price.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();

        // Send coordinates only for radius-based searches.
        if (radius !== 'infinite') {
          params.set('longitude', String(location.longitude));
          params.set('latitude', String(location.latitude));
          params.set('radius', radius);
        }

        if (activeCategory !== 'All') {
          params.set('category', activeCategory);
        }

        if (minPrice !== '') {
          params.set('minPrice', minPrice);
        }

        if (maxPrice !== '') {
          params.set('maxPrice', maxPrice);
        }

        if (search.trim()) {
          params.set('search', search.trim());
        }

        const query = params.toString();

        const response = await fetch(
          `${API_URL}/listings${query ? `?${query}` : ''}`,
          { signal }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || 'Failed to fetch listings.'
          );
        }

        if (!Array.isArray(data)) {
          throw new Error('The server returned an unexpected response.');
        }

        setListings(data);
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') return;

        console.error('Listings API error:', fetchError);

        setError(
          fetchError.message || 'Unable to load listings.'
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [
      location,
      radius,
      activeCategory,
      minPrice,
      maxPrice,
      search,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchListings(controller.signal);

    return () => controller.abort();
  }, [fetchListings, routeLocation.key]);

  const resetFilters = () => {
    setActiveCategory('All');
    setRadius('infinite');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    setError('');
  };

  const radiusLabel =
    radius === 'infinite'
      ? 'from all locations'
      : `within ${radius} km`;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        What's nearby
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mr: 0.5 }}
        >
          {loading
            ? radius !== 'infinite' && locationLoading
              ? 'Getting your location...'
              : 'Finding listings...'
            : `${listings.length} listings ${radiusLabel}`}
        </Typography>

        <TextField
          select
          label="Radius"
          size="small"
          value={radius}
          onChange={(event) => setRadius(event.target.value)}
          sx={{ width: 150 }}
        >
          {RADIUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Min ₹"
          type="number"
          size="small"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          sx={{ width: 100 }}
          inputProps={{ min: 0 }}
        />

        <TextField
          label="Max ₹"
          type="number"
          size="small"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          sx={{ width: 100 }}
          inputProps={{ min: 0 }}
        />

        <Button
          variant="outlined"
          size="small"
          onClick={resetFilters}
        >
          Reset
        </Button>
      </Box>

      {locationError && radius !== 'infinite' && (
        <Typography
          color="warning.main"
          variant="body2"
          sx={{ mb: 2 }}
        >
          {locationError}
        </Typography>
      )}

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        {categories.map((category) => (
          <Chip
            key={category}
            label={category}
            onClick={() => setActiveCategory(category)}
            color={activeCategory === category ? 'primary' : 'default'}
            variant={activeCategory === category ? 'filled' : 'outlined'}
            sx={{
              borderColor: 'divider',
              fontWeight: 500,
              ...(activeCategory !== category && {
                bgcolor: 'background.paper',
              }),
            }}
          />
        ))}
      </Box>

      {loading && (
        <Typography color="text.secondary">
          {radius !== 'infinite' && locationLoading
            ? 'Requesting your location...'
            : 'Finding listings...'}
        </Typography>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && listings.length > 0 && (
        <Grid container spacing={2.5}>
          {listings.map((listing) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={listing._id}
            >
              <ListingCard listing={listing} />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && !error && listings.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <Typography>No listings match your filters.</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Try changing your filters or resetting them.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
