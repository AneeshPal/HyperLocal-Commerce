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

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  // -----------------------------
  // LISTING FIELDS
  // -----------------------------

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Furniture');
  const [condition, setCondition] = useState('Good');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  // -----------------------------
  // EXISTING IMAGES
  // -----------------------------

  const [existingImages, setExistingImages] =
    useState([]);

  const [existingPublicIds, setExistingPublicIds] =
    useState([]);

  // Store indexes of images user wants to remove
  const [removedImageIndexes, setRemovedImageIndexes] =
    useState([]);

  // -----------------------------
  // NEW IMAGES
  // -----------------------------

  const [newImages, setNewImages] =
    useState([]);

  // -----------------------------
  // UI STATES
  // -----------------------------

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // -----------------------------
  // FETCH EXISTING LISTING
  // -----------------------------

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/listings/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message ||
            'Failed to load listing'
          );
          return;
        }

        console.log(
          'Listing for edit:',
          data
        );

        // Form fields
        setTitle(data.title || '');
        setPrice(data.price || '');
        setCategory(
          data.category || 'Furniture'
        );
        setCondition(
          data.condition || 'Good'
        );
        setDescription(
          data.description || ''
        );
        setNeighborhood(
          data.neighborhood || ''
        );

        // Existing images
        setExistingImages(
          data.images || []
        );

        setExistingPublicIds(
          data.imagePublicIds || []
        );

      } catch (error) {
        console.error(
          'Fetch listing error:',
          error
        );

        setError(
          'Unable to load listing.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  // -----------------------------
  // SELECT NEW IMAGES
  // -----------------------------

  const handleNewImageChange = (e) => {
    const selectedFiles =
      Array.from(e.target.files);

    // Count images that will remain
    const remainingExistingImages =
      existingImages.length -
      removedImageIndexes.length;

    const totalImages =
      remainingExistingImages +
      newImages.length +
      selectedFiles.length;

    if (totalImages > 6) {
      setError(
        'A listing can have a maximum of 6 images.'
      );
      return;
    }

    setError('');

    setNewImages([
      ...newImages,
      ...selectedFiles,
    ]);
  };

  // -----------------------------
  // REMOVE EXISTING IMAGE LOCALLY
  // -----------------------------

  const handleRemoveExistingImage = (index) => {
    setError('');

    if (
      !removedImageIndexes.includes(index)
    ) {
      setRemovedImageIndexes([
        ...removedImageIndexes,
        index,
      ]);
    }
  };

  // -----------------------------
  // REMOVE NEW IMAGE
  // -----------------------------

  const handleRemoveNewImage = (index) => {
    setNewImages(
      newImages.filter(
        (_, i) => i !== index
      )
    );
  };

  // -----------------------------
  // SAVE CHANGES
  // -----------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    const token =
      localStorage.getItem('token');

    if (!token) {
      setError(
        'Please login before editing a listing.'
      );
      return;
    }

    try {
      setSaving(true);

      // =========================================
      // STEP 1: UPDATE TEXT / LISTING DETAILS
      // =========================================

      const updateResponse =
        await fetch(
          `http://localhost:8080/api/listings/${id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              title,
              price: Number(price),
              category,
              condition,
              description,
              neighborhood,
            }),
          }
        );

      const updateData =
        await updateResponse.json();

      if (!updateResponse.ok) {
        setError(
          updateData.message ||
          'Failed to update listing'
        );

        return;
      }

      console.log(
        'Listing details updated:',
        updateData
      );

      // =========================================
      // STEP 2: DELETE REMOVED EXISTING IMAGES
      // =========================================

      // Delete from highest index to lowest.
      // This prevents index shifting.
      const sortedIndexes =
        [...removedImageIndexes].sort(
          (a, b) => b - a
        );

      for (const imageIndex of sortedIndexes) {
        const deleteResponse =
          await fetch(
            `http://localhost:8080/api/listings/${id}/images/${imageIndex}`,
            {
              method: 'DELETE',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const deleteData =
          await deleteResponse.json();

        if (!deleteResponse.ok) {
          setError(
            deleteData.message ||
            'Failed to remove an image'
          );

          return;
        }

        console.log(
          'Image removed:',
          deleteData
        );
      }

      // =========================================
      // STEP 3: UPLOAD NEW IMAGES
      // =========================================

      if (newImages.length > 0) {
        const formData =
          new FormData();

        newImages.forEach((file) => {
          formData.append(
            'images',
            file
          );
        });

        const uploadResponse =
          await fetch(
            `http://localhost:8080/api/listings/${id}/images`,
            {
              method: 'POST',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body: formData,
            }
          );

        const uploadData =
          await uploadResponse.json();

        if (!uploadResponse.ok) {
          setError(
            uploadData.message ||
            'Failed to upload new images'
          );

          return;
        }

        console.log(
          'New images uploaded:',
          uploadData
        );
      }

      // =========================================
      // STEP 4: DONE
      // =========================================

      navigate(`/listing/${id}`);

    } catch (error) {
      console.error(
        'Edit listing error:',
        error
      );

      setError(
        'Something went wrong while updating the listing.'
      );

    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // LOADING
  // -----------------------------

  if (loading) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: 'center',
        }}
      >
        <Typography color="text.secondary">
          Loading listing...
        </Typography>
      </Box>
    );
  }

  // -----------------------------
  // PAGE
  // -----------------------------

  return (
    <Box sx={{ maxWidth: 640 }}>

      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{
          mb: 2,
          color: 'text.secondary',
        }}
      >
        Back
      </Button>

      {/* Heading */}
      <Typography
        variant="h4"
        sx={{ mb: 0.5 }}
      >
        Edit listing
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Update your listing details
        and manage its images.
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 3,
          borderColor: 'divider',
        }}
      >

        {/* ========================= */}
        {/* EXISTING IMAGES */}
        {/* ========================= */}

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
                gridTemplateColumns:
                  'repeat(3, 1fr)',
                gap: 1.5,
                mb: 3,
              }}
            >
              {existingImages.map(
                (image, index) => {

                  const removed =
                    removedImageIndexes.includes(
                      index
                    );

                  return (
                    <Box
                      key={`${image}-${index}`}
                      sx={{
                        position:
                          'relative',
                        opacity:
                          removed
                            ? 0.3
                            : 1,
                      }}
                    >
                      <Box
                        component="img"
                        src={image}
                        alt={`Listing ${index + 1}`}
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
                          onClick={() =>
                            handleRemoveExistingImage(
                              index
                            )
                          }
                          sx={{
                            position:
                              'absolute',
                            top: 6,
                            right: 6,
                            backgroundColor:
                              'white',
                            '&:hover': {
                              backgroundColor:
                                'white',
                            },
                          }}
                        >
                          <DeleteIcon
                            fontSize="small"
                          />
                        </IconButton>
                      )}

                      {removed && (
                        <Typography
                          variant="caption"
                          sx={{
                            position:
                              'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            textAlign:
                              'center',
                            backgroundColor:
                              'rgba(0,0,0,0.7)',
                            color: 'white',
                            py: 0.5,
                          }}
                        >
                          Will be removed
                        </Typography>
                      )}
                    </Box>
                  );
                }
              )}
            </Box>
          </>
        )}

        {/* ========================= */}
        {/* ADD NEW IMAGES */}
        {/* ========================= */}

        <Button
          component="label"
          variant="outlined"
          sx={{ mb: 3 }}
        >
          Add new photos
          <input
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={
              handleNewImageChange
            }
          />
        </Button>

        {/* New images selected */}
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
                gridTemplateColumns:
                  'repeat(3, 1fr)',
                gap: 1.5,
                mb: 3,
              }}
            >
              {newImages.map(
                (file, index) => {

                  const previewUrl =
                    URL.createObjectURL(
                      file
                    );

                  return (
                    <Box
                      key={`${file.name}-${index}`}
                      sx={{
                        position:
                          'relative',
                      }}
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
                        onClick={() =>
                          handleRemoveNewImage(
                            index
                          )
                        }
                        sx={{
                          position:
                            'absolute',
                          top: 6,
                          right: 6,
                          backgroundColor:
                            'white',
                          '&:hover': {
                            backgroundColor:
                              'white',
                          },
                        }}
                      >
                        <DeleteIcon
                          fontSize="small"
                        />
                      </IconButton>
                    </Box>
                  );
                }
              )}
            </Box>
          </>
        )}

        {/* ========================= */}
        {/* FORM */}
        {/* ========================= */}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection:
              'column',
            gap: 2.5,
          }}
        >

          {/* Title */}
          <TextField
            label="Title"
            fullWidth
            required
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />

          {/* Price + Category */}
          <Grid
            container
            spacing={2}
          >

            <Grid
              item
              xs={6}
            >
              <TextField
                label="Price (₹)"
                type="number"
                fullWidth
                required
                value={price}
                onChange={(e) =>
                  setPrice(
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid
              item
              xs={6}
            >
              <TextField
                label="Category"
                select
                fullWidth
                required
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
              >
                {categories
                  .filter(
                    (c) => c !== 'All'
                  )
                  .map((c) => (
                    <MenuItem
                      key={c}
                      value={c}
                    >
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
            onChange={(e) =>
              setCondition(
                e.target.value
              )
            }
          >
            {[
              'Like new',
              'Good',
              'Fair',
              'Service',
            ].map((c) => (
              <MenuItem
                key={c}
                value={c}
              >
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
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
          />

          {/* Pickup */}
          <TextField
            label="Pickup location"
            fullWidth
            required
            value={neighborhood}
            onChange={(e) =>
              setNeighborhood(
                e.target.value
              )
            }
          />

          {/* Error */}
          {error && (
            <Typography color="error">
              {error}
            </Typography>
          )}

          {/* Save */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saving}
            sx={{
              py: 1.2,
              mt: 1,
            }}
          >
            {saving
              ? 'Saving changes...'
              : 'Save changes'}
          </Button>

        </Box>
      </Paper>
    </Box>
  );
}