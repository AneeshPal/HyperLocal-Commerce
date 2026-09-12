import { Card, CardActionArea, CardMedia, Box, Typography, Chip } from '@mui/material';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import { useNavigate } from 'react-router-dom';

export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  return (
    <Card
      variant="outlined"
      sx={{ borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}
    >
      <CardActionArea onClick={() => navigate(`/listing/${listing.id}`)}>
        <CardMedia component="img" height="150" image={listing.image} alt={listing.title} />
        <Box sx={{ p: 1.75 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {listing.title}
          </Typography>
          <Typography variant="h6" sx={{ color: 'primary.dark', fontFamily: 'inherit', fontWeight: 700 }}>
            &#8377;{listing.price.toLocaleString('en-IN')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary' }}>
            <RoomOutlinedIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption">{listing.distance}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, mt: 1 }}>
            <Chip label={listing.condition} size="small" sx={{ bgcolor: '#F2EFE6' }} />
            <Chip label={listing.postedAgo} size="small" variant="outlined" sx={{ borderColor: 'divider' }} />
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}
