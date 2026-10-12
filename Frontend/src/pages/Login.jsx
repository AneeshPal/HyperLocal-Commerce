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

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(
        'http://localhost:8080/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      if (!data.token || !data.user) {
        setError('The server did not return the required login details.');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      window.dispatchEvent(new Event('userUpdated'));

      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
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
          Aas-Paas
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Buy and sell with people in your own neighborhood.
        </Typography>

        <Box
          component="form"
          onSubmit={handleLogin}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
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
            autoComplete="current-password"
            required
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
            {submitting ? 'Logging in...' : 'Log in'}
          </Button>
        </Box>

        <Typography
          variant="body2"
          sx={{ mt: 3, textAlign: 'center' }}
          color="text.secondary"
        >
          New here?{' '}
          <MLink
            component={Link}
            to="/signup"
            sx={{ color: 'primary.dark', fontWeight: 600 }}
          >
            Create an account
          </MLink>
        </Typography>
      </Paper>
    </Box>
  );
}