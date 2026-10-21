
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  Grid,
  IconButton,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';

import { categories } from '../data/mockData';
import { API_URL } from '../config';

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Listing fields
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Furniture');
  const [condition, setCondition] = useState('Good');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  // Existing images
  const [existingImages, setExistingImages] = useState([]);
  const [existingPublicIds, setExistingPublicIds] = useState([]);
  const [removedImageIndexes, setRemovedImageIndexes] = useState([]);

  // New images
  const [newImages, setNewImages] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch existing listing
  useEffect(() => {
    let cancelled = false;

    const fetchListing = async () => {
      try {
        setLoading(true);
        setError('');

        if (!id || id === 'undefined') {
          throw new Error('Invalid listing ID.');
        }

        const response = await fetch(
          `${API_URL}/listings/${encodeURIComponent(id)}`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load listing.');
        }

        if (cancelled) return;

        setTitle(data.title || '');
        setPrice(data.price ?? '');
        setCategory(data.category || 'Furniture');
        setCondition(data.condition || 'Good');
        setDescription(data.description || '');
        setNeighborhood(data.neighborhood || '');

        setExistingImages(Array.isArray(data.images) ? data.images : []);
        setExistingPublicIds(
          Array.isArray(data.imagePublicIds) ? data.imagePublicIds : []
        );
        setRemovedImageIndexes([]);
        setNewImages([]);
      } catch (err) {
        console.error('Fetch listing error:', err);

        if (!cancelled) {
          setError(err.message || 'Unable to load listing.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchListing();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Select new images
  const handleNewImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    // Allow selecting files incrementally, but enforce six total images.
    const remainingExistingImages =
      existingImages.length - removedImageIndexes.length;

    const totalImages =
      remainingExistingImages + newImages.length + selectedFiles.length;

    if (totalImages > 6) {
      setError('A listing can have a maximum of 6 images.');
      event.target.value = '';
      return;
    }

    setError('');
    setNewImages((previousImages) => [
      ...previousImages,
      ...selectedFiles,
    ]);

    // Allow selecting the same file again after removing it.
    event.target.value = '';
  };

  // Mark an existing image for removal
  const handleRemoveExistingImage = (index) => {
    setError('');

    setRemovedImageIndexes((previousIndexes) =>
      previousIndexes.includes(index)
        ? previousIndexes
        : [...previousIndexes, index]
    );
  };

  // Remove a newly selected image
  const handleRemoveNewImage = (index) => {
    setNewImages((previousImages) =>
      previousImages.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  // Save changes
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const token = localStorage.getItem('token');

    if (!token) {
      setError('Please login before editing a listing.');
      return;
    }

    if (!id || id === 'undefined') {
      setError('Invalid listing ID.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a listing title.');
      return;
    }

    const parsedPrice = Number(price);

    if (price === '' || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid price.');
      return;
    }

    try {
      setSaving(true);

      const listingUrl =
        `${API_URL}/listings/${encodeURIComponent(id)}`;

      // Step 1: Update listing details
      const updateResponse = await fetch(listingUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          price: parsedPrice,
          category,
          condition,
          description,
          neighborhood: neighborhood.trim(),
        }),
      });

      const updateData = await updateResponse.json().catch(() => ({}));

      if (!updateResponse.ok) {
        throw new Error(updateData.message || 'Failed to update listing.');
      }

      // Step 2: Delete marked images from highest index to lowest
      const sortedIndexes = [...removedImageIndexes].sort((a, b) => b - a);

      for (const imageIndex of sortedIndexes) {
        const deleteResponse = await fetch(
          `${listingUrl}/images/${imageIndex}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const deleteData = await deleteResponse.json().catch(() => ({}));

        if (!deleteResponse.ok) {
          throw new Error(
            deleteData.message || 'Failed to remove an image.'
          );
        }
      }

      // Step 3: Upload newly selected images
      if (newImages.length > 0) {
        const formData = new FormData();

        newImages.forEach((file) => {
          formData.append('images', file);
        });

        const uploadResponse = await fetch(`${listingUrl}/images`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json().catch(() => ({}));

        if (!uploadResponse.ok) {
          throw new Error(
            uploadData.message || 'Failed to upload new images.'
          );
        }
      }

      // Step 4: Return to the updated listing
      navigate(`/listing/${encodeURIComponent(id)}`);
    } catch (err) {
      console.error('Edit listing error:', err);
      setError(err.message || 'Something went wrong while updating the listing.');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Loading listing...
        </Typography>
      </Box>
    );
  }

  // Page
  return (
    <Box sx={{ maxWidth: 640 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        Back
      </Button>

      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Edit listing
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Update your listing details and manage its images.
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 3,
          borderColor: 'divider',
        }}
      >
        {/* Existing images */}
        {existingImages.length > 0 && (
          <>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ mb: 1.5 }}
            >
              Current images
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1.5,
                mb: 3,
              }}
            >
              {existingImages.map((image, index) => {
                const removed = removedImageIndexes.includes(index);

                return (
                  <Box
                    key={`${image}-${index}`}
                    sx={{
                      position: 'relative',
                      opacity: removed ? 0.3 : 1,
                    }}
                  >
                    <Box
                      component="img"
                      src={image}
                      alt={`Listing image ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 2,
                        display: 'block',
                      }}
                    />

                    {!removed && (
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Remove image ${index + 1}`}
                        onClick={() => handleRemoveExistingImage(index)}
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          backgroundColor: 'white',
                          '&:hover': {
                            backgroundColor: 'white',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}

                    {removed && (
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          textAlign: 'center',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          py: 0.5,
                        }}
                      >
                        Will be removed
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        {/* Add new images */}
        <Button component="label" variant="outlined" sx={{ mb: 3 }}>
          Add new photos
          <input
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={handleNewImageChange}
          />
        </Button>

        {/* Preview new images */}
        {newImages.length > 0 && (
          <>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ mb: 1.5 }}
            >
              New images
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1.5,
                mb: 3,
              }}
            >
              {newImages.map((file, index) => {
                const previewUrl = URL.createObjectURL(file);

                return (
                  <Box
                    key={`${file.name}-${file.lastModified}-${index}`}
                    sx={{ position: 'relative' }}
                  >
                    <Box
                      component="img"
                      src={previewUrl}
                      alt={file.name}
                      sx={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 2,
                        display: 'block',
                      }}
                    />

                    <IconButton
                      size="small"
                      color="error"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => handleRemoveNewImage(index)}
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        backgroundColor: 'white',
                        '&:hover': {
                          backgroundColor: 'white',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        {/* Listing form */}
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
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <TextField
            label="Pickup location"
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
            disabled={saving}
            sx={{ py: 1.2, mt: 1 }}
          >
            {saving ? 'Saving changes...' : 'Save changes'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
