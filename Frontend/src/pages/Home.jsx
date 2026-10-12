
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Typography,
  Chip,
  Grid,
  TextField,
  Button,
} from '@mui/material';

import {
  useOutletContext,
  useLocation,
} from 'react-router-dom';

import ListingCard from '../components/ListingCard';
import { categories } from '../data/mockData';

export default function Home() {
  const { search, setSearch } = useOutletContext();
  const routeLocation = useLocation();

  const [activeCategory, setActiveCategory] = useState('All');
  const [radius, setRadius] = useState(3);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [location, setLocation] = useState(null);
  const [listings, setListings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [error, setError] = useState('');

  // Get the browser's current location once.
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

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

        setError(
          geoError.code === 1
            ? 'Location permission was denied. Please allow location access to find nearby listings.'
            : 'Unable to get your location. Please try again.'
        );

        setLocationLoading(false);
        setLoading(false);
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
  }, []);

  // Fetch listings whenever filters change or Home is revisited.
  const fetchListings = useCallback(
    async (signal) => {
      if (!location || !radius) return;

      if (
        minPrice !== '' &&
        maxPrice !== '' &&
        Number(minPrice) > Number(maxPrice)
      ) {
        setError(
          'Minimum price cannot be greater than maximum price.'
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          longitude: String(location.longitude),
          latitude: String(location.latitude),
          radius: String(radius),
        });

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

        const response = await fetch(
          `http://localhost:8080/api/listings?${params.toString()}`,
          { signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Failed to fetch listings.'
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
          fetchError.message || 'Unable to load nearby listings.'
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

  // Re-fetch when filters change AND when navigating back to Home.
  useEffect(() => {
    if (!location || !radius) return;

    const controller = new AbortController();

    fetchListings(controller.signal);

    return () => {
      controller.abort();
    };
  }, [location, radius, fetchListings, routeLocation.key]);

  const resetFilters = () => {
    setActiveCategory('All');
    setRadius(3);
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
  };

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
          {locationLoading
            ? 'Getting your location...'
            : loading
              ? 'Finding nearby listings...'
              : `${listings.length} listings within ${radius} km`}
        </Typography>

        <TextField
          label="Radius (km)"
          type="number"
          size="small"
          value={radius}
          onChange={(e) => {
            const value = e.target.value;

            if (value === '') {
              setRadius('');
              return;
            }

            const number = Number(value);

            if (number >= 1 && number <= 50) {
              setRadius(number);
            }
          }}
          sx={{ width: 110 }}
          inputProps={{ min: 1, max: 50, step: 0.5 }}
        />

        <TextField
          label="Min ₹"
          type="number"
          size="small"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          sx={{ width: 100 }}
          inputProps={{ min: 0 }}
        />

        <TextField
          label="Max ₹"
          type="number"
          size="small"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
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

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => setActiveCategory(cat)}
            color={activeCategory === cat ? 'primary' : 'default'}
            variant={activeCategory === cat ? 'filled' : 'outlined'}
            sx={{
              borderColor: 'divider',
              fontWeight: 500,
              ...(activeCategory !== cat && {
                bgcolor: 'background.paper',
              }),
            }}
          />
        ))}
      </Box>

      {loading && (
        <Typography color="text.secondary">
          {locationLoading
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
          <Typography>
            No listings match your filters.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Try increasing your radius or resetting your filters.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
