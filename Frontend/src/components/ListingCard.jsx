import {
  Card,
  CardActionArea,
  CardMedia,
  Box,
  Typography,
  Chip,
} from '@mui/material';

import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import { useNavigate } from 'react-router-dom';

export default function ListingCard({ listing }) {
  const navigate = useNavigate();

  // Get the first image from Cloudinary
  const image =
    listing.images && listing.images.length > 0
      ? listing.images[0]
      : '';

  // Format the listing creation date
  const postedDate = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString('en-IN')
    : '';

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/listing/${listing._id}`)}
      >

        {/* Listing Image */}
        <CardMedia
          component="img"
          height="150"
          image={image}
          alt={listing.title}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          sx={{
            objectFit: 'cover',
            backgroundColor: '#f5f5f5',
          }}
        />

        <Box sx={{ p: 1.75 }}>

          {/* Title */}
          <Typography
            variant="subtitle1"
            fontWeight={600}
            noWrap
          >
            {listing.title}
          </Typography>

          {/* Price */}
          <Typography
            variant="h6"
            sx={{
              color: 'primary.dark',
              fontFamily: 'inherit',
              fontWeight: 700,
            }}
          >
            ₹{Number(listing.price).toLocaleString('en-IN')}
          </Typography>

          {/* Location */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 0.5,
              color: 'text.secondary',
            }}
          >
            <RoomOutlinedIcon sx={{ fontSize: 16 }} />

            <Typography variant="caption">
              {listing.neighborhood || 'Nearby'}
            </Typography>
          </Box>

          {/* Condition + Date */}
          <Box
            sx={{
              display: 'flex',
              gap: 0.75,
              mt: 1,
            }}
          >
            <Chip
              label={listing.condition || 'Good'}
              size="small"
              sx={{
                bgcolor: '#F2EFE6',
              }}
            />

            {postedDate && (
              <Chip
                label={postedDate}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: 'divider',
                }}
              />
            )}
          </Box>

        </Box>
      </CardActionArea>
    </Card>
  );
}