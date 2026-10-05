import { useState, useEffect } from 'react';

import {
  Box,
  Typography,
  Chip,
  Grid,
  TextField,
  Button,
} from '@mui/material';

import { useOutletContext } from 'react-router-dom';

import ListingCard from '../components/ListingCard';
import { categories } from '../data/mockData';

export default function Home() {
  const {
    search,
    setSearch,
  } = useOutletContext();

  const [activeCategory, setActiveCategory] =
    useState('All');

  const [radius, setRadius] =
    useState(3);

  const [minPrice, setMinPrice] =
    useState('');

  const [maxPrice, setMaxPrice] =
    useState('');

  const [location, setLocation] =
    useState(null);

  const [listings, setListings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [locationLoading, setLocationLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  // =================================
  // LOCATION
  // =================================

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(
        'Geolocation is not supported by this browser.'
      );

      setLocationLoading(false);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude,
        });

        setLocationLoading(false);
      },

      (error) => {
        console.error(
          'Location error:',
          error
        );

        setError(
          'Location permission is required to find nearby listings.'
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
  }, []);

  // =================================
  // FETCH LISTINGS
  // =================================

  useEffect(() => {
    if (!location || !radius) {
      return;
    }

    const fetchListings = async () => {
      setLoading(true);
      setError('');

      try {
        // Validate prices
        if (
          minPrice &&
          maxPrice &&
          Number(minPrice) >
            Number(maxPrice)
        ) {
          setError(
            'Minimum price cannot be greater than maximum price.'
          );

          setLoading(false);
          return;
        }

        const categoryQuery =
          activeCategory === 'All'
            ? ''
            : `&category=${encodeURIComponent(
                activeCategory
              )}`;

        const priceQuery =
          `${minPrice ? `&minPrice=${minPrice}` : ''}` +
          `${maxPrice ? `&maxPrice=${maxPrice}` : ''}`;

        const searchQuery =
          search.trim()
            ? `&search=${encodeURIComponent(
                search.trim()
              )}`
            : '';

        const response = await fetch(
          `http://localhost:8080/api/listings?longitude=${location.longitude}&latitude=${location.latitude}&radius=${radius}${categoryQuery}${priceQuery}${searchQuery}`
        );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              'Failed to fetch listings'
          );
          return;
        }

        setListings(data);

      } catch (error) {
        console.error(
          'Listings API error:',
          error
        );

        setError(
          'Unable to load nearby listings.'
        );

      } finally {
        setLoading(false);
      }
    };

    fetchListings();

  }, [
    location,
    radius,
    activeCategory,
    minPrice,
    maxPrice,
    search,
  ]);

  // =================================
  // RESET FILTERS
  // =================================

  const resetFilters = () => {
    setActiveCategory('All');
    setRadius(3);
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
  };

  return (
    <Box>

      {/* Heading */}
      <Typography
        variant="h4"
        sx={{ mb: 0.5 }}
      >
        What's nearby
      </Typography>

      {/* Filters */}
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

        {/* Radius */}
        <TextField
          label="Radius (km)"
          type="number"
          size="small"
          value={radius}
          onChange={(e) => {
            const value =
              e.target.value;

            if (value === '') {
              setRadius('');
              return;
            }

            const number =
              Number(value);

            if (
              number >= 1 &&
              number <= 50
            ) {
              setRadius(number);
            }
          }}
          sx={{
            width: 110,
          }}
          inputProps={{
            min: 1,
            max: 50,
            step: 0.5,
          }}
        />

        {/* Min Price */}
        <TextField
          label="Min ₹"
          type="number"
          size="small"
          value={minPrice}
          onChange={(e) =>
            setMinPrice(
              e.target.value
            )
          }
          sx={{
            width: 100,
          }}
          inputProps={{
            min: 0,
          }}
        />

        {/* Max Price */}
        <TextField
          label="Max ₹"
          type="number"
          size="small"
          value={maxPrice}
          onChange={(e) =>
            setMaxPrice(
              e.target.value
            )
          }
          sx={{
            width: 100,
          }}
          inputProps={{
            min: 0,
          }}
        />

        {/* Reset */}
        <Button
          variant="outlined"
          size="small"
          onClick={resetFilters}
        >
          Reset
        </Button>

      </Box>

      {/* Categories */}
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
            onClick={() =>
              setActiveCategory(cat)
            }
            color={
              activeCategory === cat
                ? 'primary'
                : 'default'
            }
            variant={
              activeCategory === cat
                ? 'filled'
                : 'outlined'
            }
            sx={{
              borderColor: 'divider',
              fontWeight: 500,

              ...(activeCategory !== cat && {
                bgcolor:
                  'background.paper',
              }),
            }}
          />
        ))}
      </Box>

      {/* Loading */}
      {loading && (
        <Typography
          color="text.secondary"
        >
          {locationLoading
            ? 'Requesting your location...'
            : 'Finding listings...'}
        </Typography>
      )}

      {/* Error */}
      {error && (
        <Typography
          color="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Typography>
      )}

      {/* Listings */}
      {!loading &&
        !error && (
          <Grid
            container
            spacing={2.5}
          >
            {listings.map(
              (listing) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={listing._id}
                >
                  <ListingCard
                    listing={listing}
                  />
                </Grid>
              )
            )}
          </Grid>
        )}

      {/* Empty */}
      {!loading &&
        !error &&
        listings.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              color:
                'text.secondary',
            }}
          >
            <Typography>
              No listings match your
              filters.
            </Typography>
          </Box>
        )}

    </Box>
  );
}