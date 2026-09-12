import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  Grid,
} from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { useNavigate } from 'react-router-dom';
import { categories } from '../data/mockData';

export default function CreateListing() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => navigate('/'), 900);
  };

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        List something for sale
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Buyers near you will see this within your set radius.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: 'divider' }}>
        <Box
          sx={{
            border: '1.5px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            color: 'text.secondary',
            mb: 3,
            cursor: 'pointer',
          }}
        >
          <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="body2">Add photos (up to 6)</Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField label="Title" placeholder="e.g. Study table with chair" fullWidth required />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Price (&#8377;)" type="number" fullWidth required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Category" select fullWidth defaultValue="Furniture" required>
                {categories
                  .filter((c) => c !== 'All')
                  .map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
          </Grid>
          <TextField label="Condition" select fullWidth defaultValue="Good">
            {['Like new', 'Good', 'Fair', 'Service'].map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Description" multiline rows={4} fullWidth placeholder="Describe what you're selling, why, and any details a buyer should know." />
          <TextField label="Pickup location" placeholder="e.g. Kakadeo, Kanpur" fullWidth required />

          <Button type="submit" variant="contained" size="large" sx={{ py: 1.2, mt: 1 }}>
            {submitted ? 'Listing published' : 'Publish listing'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
