import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link as MLink
} from '@mui/material';

import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(
        'http://localhost:8080/api/auth/signup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            password,
            neighborhood
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Signup failed');
        return;
      }

      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      setError('Unable to connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 5,
          width: 400,
          maxWidth: '100%',
          borderRadius: 3,
          borderColor: 'divider'
        }}
      >
        <Typography variant="h4" sx={{ color: 'primary.dark' }}>
          Join Aas-Paas
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          We use your location only to show listings near you.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSignup}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <TextField
            label="Full name"
            fullWidth
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />

          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />

          <TextField
            label="Neighborhood / area"
            placeholder="e.g. Kakadeo, Kanpur"
            fullWidth
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
          />

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
            sx={{ py: 1.2 }}
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </Button>
        </Box>

        <Typography
          variant="body2"
          sx={{ mt: 3, textAlign: 'center' }}
          color="text.secondary"
        >
          Already have an account?{' '}
          <MLink
            component={Link}
            to="/login"
            sx={{ color: 'primary.dark', fontWeight: 600 }}
          >
            Log in
          </MLink>
        </Typography>
      </Paper>
    </Box>
  );
}