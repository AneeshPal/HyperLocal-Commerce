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

  const handleSignup = async (e) => {
    e.preventDefault();

    setError('');

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

      console.log('Signup successful:', data);

      navigate('/login');

    } catch (error) {
      console.error(error);
      setError('Unable to connect to server');
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
        px: 2,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 5,
          width: 400,
          borderRadius: 3,
          borderColor: 'divider'
        }}
      >
        <Typography variant="h4" sx={{ color: 'primary.dark' }}>
          Join Aas-Paas
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
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
            onChange={(e) => setName(e.target.value)}
            required
          />

          <TextField
            label="Phone number or email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <TextField
            label="Neighborhood / area"
            placeholder="e.g. Kakadeo, Kanpur"
            fullWidth
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
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
            sx={{ py: 1.2 }}
          >
            Create account
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
            sx={{
              color: 'primary.dark',
              fontWeight: 600
            }}
          >
            Log in
          </MLink>
        </Typography>
      </Paper>
    </Box>
  );
}