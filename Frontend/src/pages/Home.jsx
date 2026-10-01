import { useState, useEffect } from 'react';
import { Box, Typography, Chip, Grid } from '@mui/material';
import ListingCard from '../components/ListingCard';
import { categories } from '../data/mockData';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All');

  const [listings, setListings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    // --------------------------------
    // STEP 1: GET USER LOCATION
    // --------------------------------

    if (!navigator.geolocation) {
      setError(
        'Geolocation is not supported by this browser.'
      );

      setLocationLoading(false);
      setLoading(false);

      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        console.log('User latitude:', latitude);
        console.log('User longitude:', longitude);

        setLocationLoading(false);

        // --------------------------------
        // STEP 2: FETCH NEARBY LISTINGS
        // --------------------------------

        try {
          const response = await fetch(
            `http://localhost:8080/api/listings?longitude=${longitude}&latitude=${latitude}&radius=3`
          );

          const data = await response.json();

          if (!response.ok) {
            setError(
              data.message ||
              'Failed to fetch listings'
            );

            return;
          }

          console.log(
            'Nearby listings:',
            data
          );

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
      },

      (error) => {
        console.error(
          'Geolocation error:',
          error
        );

        setLocationLoading(false);
        setLoading(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError(
              'Location permission was denied. Please allow location access to see nearby listings.'
            );
            break;

          case error.POSITION_UNAVAILABLE:
            setError(
              'Your location could not be determined.'
            );
            break;

          case error.TIMEOUT:
            setError(
              'Getting your location took too long. Please try again.'
            );
            break;

          default:
            setError(
              'Unable to get your location.'
            );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  // --------------------------------
  // CATEGORY FILTER
  // --------------------------------

  const filtered =
    activeCategory === 'All'
      ? listings
      : listings.filter(
          (listing) =>
            listing.category === activeCategory
        );

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <Box>

      {/* Heading */}
      <Typography
        variant="h4"
        sx={{ mb: 0.5 }}
      >
        What's nearby
      </Typography>

      {/* Location / listings count */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        {locationLoading
          ? 'Getting your location...'
          : loading
            ? 'Loading nearby listings...'
            : `${filtered.length} listings within 3 km of you`}
      </Typography>

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
                bgcolor: 'background.paper',
              }),
            }}
          />
        ))}
      </Box>

      {/* Loading */}
      {loading && (
        <Typography color="text.secondary">
          {locationLoading
            ? 'Requesting your location...'
            : 'Finding listings near you...'}
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
      {!loading && !error && (
        <Grid container spacing={2.5}>
          {filtered.map((listing) => (
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
          ))}
        </Grid>
      )}

      {/* Empty state */}
      {!loading &&
        !error &&
        filtered.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              color: 'text.secondary',
            }}
          >
            <Typography>
              No listings within 3 km of your
              current location.
            </Typography>
          </Box>
        )}

    </Box>
  );
}