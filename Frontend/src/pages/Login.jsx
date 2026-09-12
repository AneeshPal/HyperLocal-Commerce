import { Box, Paper, TextField, Button, Typography, Link as MLink } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
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
          Aas-Paas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Buy and sell with people in your own neighborhood.
        </Typography>

        <Box component="form" onSubmit={(e) => { e.preventDefault(); navigate('/'); }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Phone number or email" fullWidth />
          <TextField label="Password" type="password" fullWidth />
          <Button type="submit" variant="contained" size="large" sx={{ py: 1.2 }}>
            Log in
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }} color="text.secondary">
          New here?{' '}
          <MLink component={Link} to="/signup" sx={{ color: 'primary.dark', fontWeight: 600 }}>
            Create an account
          </MLink>
        </Typography>
      </Paper>
    </Box>
  );
}
