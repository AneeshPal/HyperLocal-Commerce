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

  // Listing form data
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Furniture');
  const [condition, setCondition] = useState('Good');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  // Selected images
  const [images, setImages] = useState([]);

  // UI states
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length > 6) {
      setError('You can select up to 6 images.');
      return;
    }

    setError('');
    setImages(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    setError('');
  
    const token = localStorage.getItem('token');
  
    if (!token) {
      setError('Please login before creating a listing.');
      return;
    }
  
    try {
      // -----------------------------
      // STEP 1: Create the listing
      // -----------------------------
  
      const response = await fetch(
        'http://localhost:8080/api/listings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            price: Number(price),
            category,
            condition,
            description,
            coordinates: [80.3319, 26.4499],
            neighborhood,
          }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.message || 'Failed to create listing');
        return;
      }
  
      console.log('Listing created:', data);
  
      const listingId = data.listing._id;
  
      // -----------------------------
      // STEP 2: Upload images
      // -----------------------------
  
      if (images.length > 0) {
        const formData = new FormData();
  
        images.forEach((image) => {
          formData.append('images', image);
        });
  
        const imageResponse = await fetch(
          `http://localhost:8080/api/listings/${listingId}/images`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );
  
        const imageData = await imageResponse.json();
  
        if (!imageResponse.ok) {
          console.error('Image upload failed:', imageData);
  
          setError(
            imageData.message ||
            'Listing created, but image upload failed.'
          );
  
          return;
        }
  
        console.log('Images uploaded:', imageData);
      }
  
      // -----------------------------
      // STEP 3: Success
      // -----------------------------
  
      setSubmitted(true);
  
      setTimeout(() => {
        navigate('/');
      }, 900);
  
    } catch (error) {
      console.error(error);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <Box sx={{ maxWidth: 640 }}>

      {/* Page heading */}
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        List something for sale
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Buyers near you will see this within your set radius.
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 3,
          borderColor: 'divider',
        }}
      >

        {/* Image Upload Area */}
        <Box
          component="label"
          sx={{
            border: '1.5px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            color: 'text.secondary',
            mb: 3,
            cursor: 'pointer',
            display: 'block',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <AddPhotoAlternateOutlinedIcon
            sx={{
              fontSize: 32,
              mb: 1,
            }}
          />

          <Typography variant="body2">
            Add photos (up to 6)
          </Typography>

          <Typography
            variant="caption"
            display="block"
            sx={{ mt: 0.5 }}
          >
            Click to select images
          </Typography>

          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleImageChange}
          />
        </Box>

        {/* Selected Images Count */}
        {images.length > 0 && (
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              fontWeight: 500,
            }}
          >
            {images.length} image
            {images.length > 1 ? 's' : ''} selected
          </Typography>
        )}

        {/* Listing Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >

          {/* Title */}
          <TextField
            label="Title"
            placeholder="e.g. Study table with chair"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Price + Category */}
          <Grid container spacing={2}>

            <Grid item xs={6}>
              <TextField
                label="Price (₹)"
                type="number"
                fullWidth
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Category"
                select
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
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

          {/* Condition */}
          <TextField
            label="Condition"
            select
            fullWidth
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            {['Like new', 'Good', 'Fair', 'Service'].map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          {/* Description */}
          <TextField
            label="Description"
            multiline
            rows={4}
            fullWidth
            placeholder="Describe what you're selling, why, and any details a buyer should know."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Pickup Location */}
          <TextField
            label="Pickup location"
            placeholder="e.g. Kakadeo, Kanpur"
            fullWidth
            required
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          />

          {/* Error */}
          {error && (
            <Typography color="error">
              {error}
            </Typography>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{
              py: 1.2,
              mt: 1,
            }}
          >
            {submitted
              ? 'Listing published'
              : 'Publish listing'}
          </Button>

        </Box>
      </Paper>
    </Box>
  );
}