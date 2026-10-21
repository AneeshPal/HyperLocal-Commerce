
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
import { API_URL } from '../config';

export default function CreateListing() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Furniture');
  const [condition, setCondition] = useState('Good');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  const [images, setImages] = useState([]);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length > 6) {
      setError('You can select up to 6 images.');
      event.target.value = '';
      return;
    }

    setError('');
    setImages(selectedFiles);
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error('Geolocation is not supported by this browser.')
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    const token = localStorage.getItem('token');

    if (!token) {
      setError('Please login before creating a listing.');
      return;
    }

    setLocationLoading(true);

    try {
      // Step 1: Get the user's location.
      const location = await getCurrentLocation();

      // Step 2: Create the listing.
      const response = await fetch(`${API_URL}/listings`, {
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
          // GeoJSON coordinates use [longitude, latitude].
          coordinates: [location.longitude, location.latitude],
          neighborhood,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create listing.');
      }

      const listingId = data.listing?._id || data._id;

      if (!listingId) {
        throw new Error(
          'The listing may have been created, but the server did not return its ID.'
        );
      }

      // Step 3: Upload images, if selected.
      if (images.length > 0) {
        const formData = new FormData();

        images.forEach((image) => {
          formData.append('images', image);
        });

        const imageResponse = await fetch(
          `${API_URL}/listings/${encodeURIComponent(listingId)}/images`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const imageData = await imageResponse.json().catch(() => ({}));

        if (!imageResponse.ok) {
          throw new Error(
            imageData.message ||
              'Listing created, but image upload failed. You can edit the listing to try uploading images again.'
          );
        }
      }

      // Step 4: Finish.
      setSubmitted(true);
      navigate('/');
    } catch (error) {
      console.error('Create listing error:', error);

      if (error.code === 1) {
        setError(
          'Location permission was denied. Please allow location access to create a listing.'
        );
      } else if (error.code === 2) {
        setError('Your location could not be determined.');
      } else if (error.code === 3) {
        setError('Getting your location took too long. Please try again.');
      } else {
        setError(error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640 }}>
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

        {images.length > 0 && (
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              fontWeight: 500,
            }}
          >
            {images.length} image{images.length > 1 ? 's' : ''} selected
          </Typography>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          <TextField
            label="Title"
            placeholder="e.g. Study table with chair"
            fullWidth
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Price (₹)"
                type="number"
                fullWidth
                required
                inputProps={{ min: 0, step: 'any' }}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Category"
                select
                fullWidth
                required
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories
                  .filter((item) => item !== 'All')
                  .map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
          </Grid>

          <TextField
            label="Condition"
            select
            fullWidth
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
          >
            {['Like new', 'Good', 'Fair', 'Service'].map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Description"
            multiline
            rows={4}
            fullWidth
            placeholder="Describe what you're selling, why, and any details a buyer should know."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <TextField
            label="Pickup location"
            placeholder="e.g. Kakadeo, Kanpur"
            fullWidth
            required
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
          />

          {error && (
            <Typography color="error" role="alert">
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={locationLoading || submitted}
            sx={{
              py: 1.2,
              mt: 1,
            }}
          >
            {locationLoading
              ? 'Getting your location...'
              : submitted
                ? 'Listing published'
                : 'Publish listing'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
