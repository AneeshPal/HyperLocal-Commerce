import { Box, Typography, Paper, Avatar, Rating, Grid, Tabs, Tab, Button } from '@mui/material';
import { useState } from 'react';
import { currentUser, listings } from '../data/mockData';
import ListingCard from '../components/ListingCard';

export default function Profile() {
  const [tab, setTab] = useState(0);
  const myListings = listings.slice(0, 3);

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: 'divider', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Avatar src={currentUser.avatar} sx={{ width: 84, height: 84 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5">{currentUser.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {currentUser.neighborhood} &middot; Member since {currentUser.memberSince}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Rating value={currentUser.rating} precision={0.1} size="small" readOnly />
              <Typography variant="body2" color="text.secondary">
                {currentUser.rating} ({currentUser.reviewCount} reviews)
              </Typography>
            </Box>
          </Box>
          <Button variant="outlined">Edit profile</Button>
        </Box>
      </Paper>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="My listings" />
        <Tab label="Reviews" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2.5}>
          {myListings.map((listing) => (
            <Grid item xs={12} sm={6} md={4} key={listing.id}>
              <ListingCard listing={listing} />
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { name: 'Priya T.', text: 'Item was exactly as described, quick handover.', rating: 5 },
            { name: 'Dev M.', text: 'Responsive and easy to coordinate with.', rating: 4.5 },
          ].map((r, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight={600}>{r.name}</Typography>
                <Rating value={r.rating} precision={0.5} size="small" readOnly />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {r.text}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
