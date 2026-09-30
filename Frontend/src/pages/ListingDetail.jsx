import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Currently selected image in gallery
  const [selectedImage, setSelectedImage] = useState(0);

  // -----------------------------
  // FETCH LISTING
  // -----------------------------

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/listings/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Listing not found');
          return;
        }

        console.log('Listing details:', data);

        setListing(data);
        setSelectedImage(0);
      } catch (error) {
        console.error('Listing detail error:', error);
        setError('Unable to load listing.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  // -----------------------------
  // JWT / CURRENT USER
  // -----------------------------

  const token = localStorage.getItem('token');

  let currentUserId = null;

  if (token) {
    try {
      const payload = JSON.parse(
        atob(token.split('.')[1])
      );

      // Your JWT uses "id"
      currentUserId = payload.id;
    } catch (error) {
      console.error('Could not decode JWT:', error);
    }
  }

  // -----------------------------
  // DELETE LISTING
  // -----------------------------

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this listing?'
    );

    if (!confirmed) {
      return;
    }

    if (!token) {
      setError('Please login first.');
      return;
    }

    try {
      setDeleting(true);
      setError('');

      const response = await fetch(
        `http://localhost:8080/api/listings/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || 'Failed to delete listing'
        );
        setDeleting(false);
        return;
      }

      console.log('Listing deleted:', data);

      navigate('/');
    } catch (error) {
      console.error('Delete listing error:', error);

      setError(
        'Something went wrong while deleting.'
      );

      setDeleting(false);
    }
  };

  // -----------------------------
  // LOADING
  // -----------------------------

  if (loading) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: 'center',
        }}
      >
        <Typography color="text.secondary">
          Loading listing...
        </Typography>
      </Box>
    );
  }

  // -----------------------------
  // ERROR
  // -----------------------------

  if (error || !listing) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: 'center',
        }}
      >
        <Typography
          color="error"
          sx={{ mb: 2 }}
        >
          {error || 'Listing not found'}
        </Typography>

        <Button
          variant="outlined"
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </Box>
    );
  }

  // -----------------------------
  // IMAGES
  // -----------------------------

  const images =
    listing.images && listing.images.length > 0
      ? listing.images
      : [];

  const currentImage =
    images.length > 0
      ? images[selectedImage]
      : '';

  // -----------------------------
  // SELLER
  // -----------------------------

  const sellerName =
    listing.seller?.name || 'Unknown seller';

  const sellerEmail =
    listing.seller?.email || '';

  const sellerInitial =
    sellerName.charAt(0).toUpperCase();

  // -----------------------------
  // OWNER CHECK
  // -----------------------------

  const sellerId =
    listing.seller?._id;

  const isOwner =
    currentUserId &&
    sellerId &&
    String(currentUserId) === String(sellerId);

  console.log('OWNER CHECK:', {
    currentUserId,
    sellerId,
    isOwner,
  });

  return (
    <Box>

      {/* ========================= */}
      {/* BACK BUTTON */}
      {/* ========================= */}

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

        {/* ========================= */}
        {/* IMAGE GALLERY */}
        {/* ========================= */}

        <Grid item xs={12} md={7}>

          {images.length > 0 ? (
            <>

              {/* Main Image */}
              <Box
                component="img"
                src={currentImage}
                alt={listing.title}
                onError={(e) => {
                  e.currentTarget.style.display =
                    'none';
                }}
                sx={{
                  width: '100%',
                  height: 380,
                  objectFit: 'cover',
                  borderRadius: 3,
                  backgroundColor: '#f5f5f5',
                  display: 'block',
                }}
              />

              {/* Image Counter */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  textAlign: 'right',
                }}
              >
                {selectedImage + 1} / {images.length}
              </Typography>

              {/* Thumbnails */}
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
                    onClick={() =>
                      setSelectedImage(index)
                    }
                    sx={{
                      width: 80,
                      height: 65,
                      objectFit: 'cover',
                      borderRadius: 2,
                      cursor: 'pointer',
                      flexShrink: 0,

                      border:
                        selectedImage === index
                          ? '3px solid'
                          : '1px solid',

                      borderColor:
                        selectedImage === index
                          ? 'primary.main'
                          : 'divider',

                      opacity:
                        selectedImage === index
                          ? 1
                          : 0.75,

                      '&:hover': {
                        opacity: 1,
                      },
                    }}
                  />
                ))}
              </Box>

            </>
          ) : (

            /* No images */
            <Box
              sx={{
                width: '100%',
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

        {/* ========================= */}
        {/* DETAILS */}
        {/* ========================= */}

        <Grid item xs={12} md={5}>

          {/* Category */}
          <Chip
            label={listing.category}
            size="small"
            sx={{
              bgcolor: '#F2EFE6',
              mb: 1.5,
            }}
          />

          {/* Title */}
          <Typography variant="h4">
            {listing.title}
          </Typography>

          {/* Price */}
          <Typography
            variant="h4"
            sx={{
              color: 'primary.dark',
              fontWeight: 700,
              mt: 1,
            }}
          >
            ₹
            {Number(
              listing.price
            ).toLocaleString('en-IN')}
          </Typography>

          {/* Location + Condition */}
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
              {listing.neighborhood ||
                'Nearby'}
            </Typography>

            <Typography
              variant="body2"
              sx={{ mx: 1 }}
            >
              ·
            </Typography>

            <Typography variant="body2">
              {listing.condition}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Description */}
          <Typography
            variant="subtitle2"
            color="text.secondary"
            gutterBottom
          >
            Description
          </Typography>

          <Typography
            variant="body2"
            sx={{ mb: 3 }}
          >
            {listing.description ||
              'No description provided.'}
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
            <Avatar
              sx={{
                bgcolor: 'primary.main',
              }}
            >
              {sellerInitial}
            </Avatar>

            <Box>
              <Typography fontWeight={600}>
                {sellerName}
              </Typography>

              {sellerEmail && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {sellerEmail}
                </Typography>
              )}
            </Box>
          </Box>

          {/* ========================= */}
          {/* OWNER ACTIONS */}
          {/* ========================= */}

          {isOwner ? (
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                mb: 2,
              }}
            >

              <Button
                variant="outlined"
                startIcon={
                  <EditOutlinedIcon />
                }
                fullWidth
                onClick={() =>
                  navigate(
                    `/edit-listing/${listing._id}`
                  )
                }
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
                {deleting
                  ? 'Deleting...'
                  : 'Delete'}
              </Button>

            </Box>
          ) : (

            /* ========================= */
            /* BUYER ACTIONS */
            /* ========================= */

            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
              }}
            >

              <Button
                variant="outlined"
                startIcon={
                  <ChatBubbleOutlineIcon />
                }
                fullWidth
                onClick={() =>
                  navigate('/chat/c1')
                }
              >
                Message seller
              </Button>

              <Button
                variant="contained"
                fullWidth
                onClick={() =>
                  navigate(
                    `/checkout/${listing._id}`
                  )
                }
              >
                Buy now
              </Button>

            </Box>

          )}

          {/* Payment information */}
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
              Payment is held safely until you
              confirm the item was delivered as
              described.
            </Typography>
          </Paper>

        </Grid>
      </Grid>
    </Box>
  );
}