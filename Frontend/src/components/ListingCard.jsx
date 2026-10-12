import {
  Card,
  CardActionArea,
  CardMedia,
  Box,
  Typography,
  Chip
} from '@mui/material';

import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);

  const imageValue = Array.isArray(listing.images)
    ? listing.images[0]
    : '';

  const image = typeof imageValue === 'string'
    ? imageValue
    : imageValue?.url || imageValue?.secure_url || '';

  const showImage = Boolean(image) && !imageFailed;

  const postedDate = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString('en-IN')
    : '';

  const handleClick = () => {
    const listingId = listing._id || listing.id;

    if (!listingId) {
      console.error('Listing ID is missing:', listing);
      return;
    }

    navigate(`/listing/${listingId}`);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        height: '100%'
      }}
    >
      <CardActionArea onClick={handleClick} sx={{ height: '100%' }}>
        {showImage ? (
          <CardMedia
            component="img"
            height="150"
            image={image}
            alt={listing.title || 'Listing image'}
            onError={() => setImageFailed(true)}
            sx={{
              objectFit: 'cover',
              backgroundColor: '#F1F5F9'
            }}
          />
        ) : (
          <Box
            sx={{
              height: 150,
              bgcolor: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No image available
            </Typography>
          </Box>
        )}

        <Box sx={{ p: 1.75 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            noWrap
          >
            {listing.title || 'Untitled listing'}
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: 'primary.dark',
              fontFamily: 'inherit',
              fontWeight: 700
            }}
          >
            ₹{Number(listing.price || 0).toLocaleString('en-IN')}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 0.5,
              color: 'text.secondary'
            }}
          >
            <RoomOutlinedIcon sx={{ fontSize: 16 }} />

            <Typography variant="caption">
              {typeof listing.distance === 'number'
                ? listing.distance === 0
                  ? 'At your location'
                  : `${listing.distance} km away`
                : listing.neighborhood || 'Distance unavailable'}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 0.75,
              mt: 1,
              flexWrap: 'wrap'
            }}
          >
            <Chip
              label={listing.condition || 'Good'}
              size="small"
              sx={{ bgcolor: '#E0F2FE' }}
            />

            {postedDate && (
              <Chip
                label={postedDate}
                size="small"
                variant="outlined"
                sx={{ borderColor: 'divider' }}
              />
            )}
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}