
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  Tabs,
  Tab,
  Button,
  CircularProgress,
} from '@mui/material';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { API_URL } from '../config';

export default function Profile() {
  const navigate = useNavigate();

  const [tab, setTab] = useState(0);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Please log in to view your profile.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError('');

        const [userResponse, listingsResponse] = await Promise.all([
          fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/listings/mine`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const userData = await userResponse.json().catch(() => null);
        const listingsData = await listingsResponse.json().catch(() => null);

        if (!userResponse.ok) {
          throw new Error(
            userData?.message || 'Unable to load your profile.'
          );
        }

        if (!listingsResponse.ok) {
          throw new Error(
            listingsData?.message || 'Unable to load your listings.'
          );
        }

        const actualUser = userData?.user || userData;

        if (!actualUser || typeof actualUser !== 'object') {
          throw new Error('The server returned invalid profile data.');
        }

        if (!cancelled) {
          setUser(actualUser);
          setListings(Array.isArray(listingsData) ? listingsData : []);

          localStorage.setItem('user', JSON.stringify(actualUser));
          localStorage.setItem('currentUser', JSON.stringify(actualUser));

          window.dispatchEvent(new Event('userUpdated'));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load profile.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const name = user.name || 'My Account';

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const memberSince = user.createdAt
    ? new Date(user.createdAt).getFullYear()
    : null;

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          borderColor: 'divider',
          mb: 4,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            flexWrap: 'wrap',
          }}
        >
          <Avatar
            sx={{
              width: 84,
              height: 84,
              bgcolor: '#0284C7',
              color: '#FFFFFF',
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {initials}
          </Avatar>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={700}>
              {name}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {user.neighborhood || 'Neighborhood not added'}
              {memberSince ? ` · Member since ${memberSince}` : ''}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {user.email || ''}
            </Typography>
          </Box>

          <Button variant="outlined" onClick={() => navigate('/')}>
            Back to listings
          </Button>
        </Box>
      </Paper>

      <Tabs
        value={tab}
        onChange={(event, value) => setTab(value)}
        sx={{ mb: 3 }}
      >
        <Tab label={`My listings (${listings.length})`} />
      </Tabs>

      {tab === 0 && (
        <>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                py: 6,
              }}
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Typography color="error">{error}</Typography>

              {error.toLowerCase().includes('log in') && (
                <Button
                  sx={{ mt: 2 }}
                  variant="contained"
                  onClick={() => navigate('/login')}
                >
                  Log in
                </Button>
              )}
            </Paper>
          ) : listings.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6">No listings yet</Typography>

              <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                Items you list for sale will appear here.
              </Typography>

              <Button
                variant="contained"
                onClick={() => navigate('/create-listing')}
                sx={{ bgcolor: '#0284C7' }}
              >
                Create a listing
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2.5}>
              {listings.map((listing) => (
                <Grid item xs={12} sm={6} md={4} key={listing._id}>
                  <ListingCard listing={listing} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}
