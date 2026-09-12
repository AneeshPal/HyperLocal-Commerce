import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, Typography, Chip, Button, Paper, Avatar, Divider, Rating } from '@mui/material';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { listings } from '../data/mockData';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const listing = listings.find((l) => l.id === id) || listings[0];

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2, color: 'text.secondary' }}>
        Back
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Box
            component="img"
            src={listing.image}
            alt={listing.title}
            sx={{ width: '100%', height: 380, objectFit: 'cover', borderRadius: 3 }}
          />
        </Grid>

        <Grid item xs={12} md={5}>
          <Chip label={listing.category} size="small" sx={{ bgcolor: '#F2EFE6', mb: 1.5 }} />
          <Typography variant="h4">{listing.title}</Typography>
          <Typography variant="h4" sx={{ color: 'primary.dark', fontWeight: 700, mt: 1 }}>
            &#8377;{listing.price.toLocaleString('en-IN')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5, color: 'text.secondary' }}>
            <RoomOutlinedIcon fontSize="small" />
            <Typography variant="body2">{listing.distance}</Typography>
            <Typography variant="body2" sx={{ mx: 1 }}>
              &middot;
            </Typography>
            <Typography variant="body2">{listing.condition}</Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Seller
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>{listing.seller[0]}</Avatar>
            <Box>
              <Typography fontWeight={600}>{listing.seller}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Rating value={listing.sellerRating} precision={0.1} size="small" readOnly />
                <Typography variant="caption" color="text.secondary">
                  {listing.sellerRating}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<ChatBubbleOutlineIcon />}
              fullWidth
              onClick={() => navigate('/chat/c1')}
            >
              Message seller
            </Button>
            <Button variant="contained" fullWidth onClick={() => navigate(`/checkout/${listing.id}`)}>
              Buy now
            </Button>
          </Box>

          <Paper variant="outlined" sx={{ mt: 3, p: 2, borderRadius: 2, borderColor: 'divider', bgcolor: '#F2EFE6' }}>
            <Typography variant="body2">
              Payment is held safely until you confirm the item was delivered as described.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
