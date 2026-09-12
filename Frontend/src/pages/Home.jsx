import { useState } from 'react';
import { Box, Typography, Chip, Grid } from '@mui/material';
import ListingCard from '../components/ListingCard';
import { listings, categories } from '../data/mockData';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered =
    activeCategory === 'All' ? listings : listings.filter((l) => l.category === activeCategory);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        What's nearby
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {filtered.length} listings within 3 km of you
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => setActiveCategory(cat)}
            color={activeCategory === cat ? 'primary' : 'default'}
            variant={activeCategory === cat ? 'filled' : 'outlined'}
            sx={{
              borderColor: 'divider',
              fontWeight: 500,
              ...(activeCategory !== cat && { bgcolor: 'background.paper' }),
            }}
          />
        ))}
      </Box>

      <Grid container spacing={2.5}>
        {filtered.map((listing) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={listing.id}>
            <ListingCard listing={listing} />
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography>No listings in this category near you yet.</Typography>
        </Box>
      )}
    </Box>
  );
}
