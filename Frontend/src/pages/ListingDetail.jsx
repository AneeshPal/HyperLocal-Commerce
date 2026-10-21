
import { useEffect, useState } from 'react';

import {
  useParams,
  useNavigate,
} from 'react-router-dom';

import {
  Box,
  Grid,
  Typography,
  Chip,
  Button,
  Paper,
  Avatar,
  Divider,
} from '@mui/material';

import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { API_URL } from '../config';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  // Fetch listing.
  useEffect(() => {
    let cancelled = false;

    const fetchListing = async () => {
      if (!id || id === 'undefined') {
        setError('Invalid listing ID.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_URL}/listings/${encodeURIComponent(id)}`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load listing.');
        }

        if (!cancelled) {
          setListing(data);
          setSelectedImage(0);
        }
      } catch (err) {
        console.error('Listing fetch error:', err);

        if (!cancelled) {
          setError(err.message || 'Unable to load listing.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchListing();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Loading.
  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography>Loading listing...</Typography>
      </Box>
    );
  }

  // Error.
  if (error || !listing) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>
          {error || 'Listing not found'}
        </Typography>

        <Button variant="outlined" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Box>
    );
  }

  // Token and owner.
  const token = localStorage.getItem('token');

  let currentUserId = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.id || payload.userId || payload.sub || null;
    } catch (err) {
      console.error('JWT decode error:', err);
    }
  }

  // Images.
  const images = Array.isArray(listing.images) ? listing.images : [];

  const safeSelectedImage =
    images.length > 0
      ? Math.min(selectedImage, images.length - 1)
      : 0;

  const currentImage =
    images.length > 0 ? images[safeSelectedImage] : null;

  // Seller.
  const seller =
    listing.seller && typeof listing.seller === 'object'
      ? listing.seller
      : null;

  const sellerName = seller?.name || 'Unknown seller';
  const sellerEmail = seller?.email || '';
  const sellerId = seller?._id || null;

  const sellerInitial = sellerName.charAt(0).toUpperCase();

  const isOwner =
    currentUserId &&
    sellerId &&
    String(currentUserId) === String(sellerId);

  // Delete listing.
  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this listing?'
    );

    if (!confirmed) return;

    if (!token) {
      setError('Please login first.');
      return;
    }

    try {
      setDeleting(true);
      setError('');

      const response = await fetch(
        `${API_URL}/listings/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete listing.');
      }

      navigate('/');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Unable to delete listing.');
    } finally {
      setDeleting(false);
    }
  };

  // Message seller.
  const handleMessageSeller = async () => {
    const currentToken = localStorage.getItem('token');

    if (!currentToken) {
      navigate('/login');
      return;
    }

    if (isOwner) return;

    try {
      setError('');

      const response = await fetch(`${API_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          listingId: listing._id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to start conversation.'
        );
      }

      const conversationId = data._id || data.conversation?._id;

      if (!conversationId) {
        throw new Error(
          'The server did not return a conversation ID.'
        );
      }

      navigate(`/chat/${conversationId}`);
    } catch (err) {
      console.error('Conversation error:', err);
      setError(err.message || 'Unable to start conversation.');
    }
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{
          mb: 2,
          color: 'text.secondary',
        }}
      >
        Back
      </Button>

      <Grid container spacing={4}>
        {/* Image gallery */}
        <Grid item xs={12} md={7}>
          {images.length > 0 ? (
            <>
              <Box
                component="img"
                src={currentImage}
                alt={listing.title}
                sx={{
                  width: '100%',
                  height: 380,
                  objectFit: 'cover',
                  borderRadius: 3,
                  display: 'block',
                  backgroundColor: '#f5f5f5',
                }}
              />

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  textAlign: 'right',
                }}
              >
                {safeSelectedImage + 1} / {images.length}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  mt: 1.5,
                  overflowX: 'auto',
                  pb: 1,
                }}
              >
                {images.map((image, index) => (
                  <Box
                    key={`${image}-${index}`}
                    component="img"
                    src={image}
                    alt={`${listing.title} ${index + 1}`}
                    onClick={() => setSelectedImage(index)}
                    sx={{
                      width: 80,
                      height: 65,
                      objectFit: 'cover',
                      borderRadius: 2,
                      cursor: 'pointer',
                      flexShrink: 0,
                      border:
                        safeSelectedImage === index
                          ? '3px solid'
                          : '1px solid',
                      borderColor:
                        safeSelectedImage === index
                          ? 'primary.main'
                          : 'divider',
                      opacity: safeSelectedImage === index ? 1 : 0.75,
                    }}
                  />
                ))}
              </Box>
            </>
          ) : (
            <Box
              sx={{
                height: 380,
                borderRadius: 3,
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="text.secondary">
                No image available
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Listing information */}
        <Grid item xs={12} md={5}>
          <Chip
            label={listing.category || 'Other'}
            size="small"
            sx={{
              bgcolor: '#F2EFE6',
              mb: 1.5,
            }}
          />

          <Typography variant="h4">
            {listing.title}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: 'primary.dark',
              fontWeight: 700,
              mt: 1,
            }}
          >
            ₹
            {Number(listing.price || 0).toLocaleString('en-IN')}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 1.5,
              color: 'text.secondary',
            }}
          >
            <RoomOutlinedIcon fontSize="small" />

            <Typography variant="body2">
              {listing.neighborhood || 'Nearby'}
            </Typography>

            <Typography sx={{ mx: 1 }}>·</Typography>

            <Typography variant="body2">
              {listing.condition || 'Good'}
            </Typography>
          </Box>

          {typeof listing.distance === 'number' && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {listing.distance === 0
                ? 'At your location'
                : `${listing.distance} km away`}
            </Typography>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography
            variant="subtitle2"
            color="text.secondary"
            gutterBottom
          >
            Description
          </Typography>

          <Typography variant="body2" sx={{ mb: 3 }}>
            {listing.description || 'No description provided.'}
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Seller */}
          <Typography
            variant="subtitle2"
            color="text.secondary"
            gutterBottom
          >
            Seller
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 3,
            }}
          >
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {sellerInitial}
            </Avatar>

            <Box>
              <Typography fontWeight={600}>
                {sellerName}
              </Typography>

              {sellerEmail && (
                <Typography variant="caption" color="text.secondary">
                  {sellerEmail}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Owner or buyer actions */}
          {isOwner ? (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                fullWidth
                onClick={() => navigate(`/edit-listing/${listing._id}`)}
              >
                Edit listing
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                fullWidth
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<ChatBubbleOutlineIcon />}
                fullWidth
                onClick={handleMessageSeller}
              >
                Message seller
              </Button>

              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate(`/checkout/${listing._id}`)}
              >
                Buy now
              </Button>
            </Box>
          )}

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              borderColor: 'divider',
              bgcolor: '#F2EFE6',
            }}
          >
            <Typography variant="body2">
              Payment is held safely until you confirm the item was delivered
              as described.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
