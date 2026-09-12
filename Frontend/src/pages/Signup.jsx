import { Box, Paper, TextField, Button, Typography, Link as MLink } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
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
      <Paper variant="outlined" sx={{ p: 5, width: 400, borderRadius: 3, borderColor: 'divider' }}>
        <Typography variant="h4" sx={{ color: 'primary.dark' }}>
          Join Aas-Paas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          We use your location only to show listings near you.
        </Typography>

        <Box component="form" onSubmit={(e) => { e.preventDefault(); navigate('/'); }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Full name" fullWidth />
          <TextField label="Phone number or email" fullWidth />
          <TextField label="Password" type="password" fullWidth />
          <TextField label="Neighborhood / area" placeholder="e.g. Kakadeo, Kanpur" fullWidth />
          <Button type="submit" variant="contained" size="large" sx={{ py: 1.2 }}>
            Create account
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }} color="text.secondary">
          Already have an account?{' '}
          <MLink component={Link} to="/login" sx={{ color: 'primary.dark', fontWeight: 600 }}>
            Log in
          </MLink>
        </Typography>
      </Paper>
    </Box>
  );
}
