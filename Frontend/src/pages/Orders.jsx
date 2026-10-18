
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const STATUS_STEPS = [
  'Paid',
  'Receipt confirmed',
  'Delivered',
  'Settlement',
];

function getId(value) {
  if (!value) return '';
  return String(value._id || value.id || value);
}

function getStatus(transaction) {
  if (transaction.paymentStatus !== 'paid') {
    return {
      label: transaction.paymentStatus || 'Unknown',
      step: -1,
      color: 'warning',
    };
  }

  if (transaction.resolutionStatus === 'disputed') {
    return { label: 'Disputed', step: -1, color: 'error' };
  }

  if (transaction.resolutionStatus === 'settled') {
    return { label: 'Settled', step: 3, color: 'success' };
  }

  if (transaction.resolutionStatus === 'release_eligible') {
    return {
      label: 'Receipt confirmed',
      step: 1,
      color: 'success',
    };
  }

  if (transaction.fulfilmentStatus === 'delivered') {
    return { label: 'Delivered', step: 2, color: 'info' };
  }

  if (transaction.fulfilmentStatus === 'in_progress') {
    return { label: 'In progress', step: 0, color: 'info' };
  }

  return { label: 'Paid', step: 0, color: 'success' };
}

function formatDate(date) {
  if (!date) return 'Date unavailable';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return 'Date unavailable';
  }

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function Orders() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTransactions() {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Please log in again to view your orders.');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/transactions/mine`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || 'Failed to load your transactions.'
        );
      }

      if (!Array.isArray(data)) {
        throw new Error('Unexpected response from the server.');
      }

      setTransactions(data);
    } catch (err) {
      setError(err.message || 'Unable to load your orders.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const storedUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem('user') ||
        localStorage.getItem('currentUser') ||
        'null'
      );
    } catch {
      return null;
    }
  })();

  const currentUserId = getId(storedUser);

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Loading your orders...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Your orders
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track your purchases, sales, payments, and delivery status.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={loadTransactions}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!error && transactions.length === 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}
        >
          <Typography fontWeight={600}>No transactions yet</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Your purchases and sales will appear here.
          </Typography>
        </Paper>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {transactions.map((transaction) => {
          const listing =
            transaction.listing &&
            typeof transaction.listing === 'object'
              ? transaction.listing
              : null;

          const buyerId = getId(transaction.buyer);
          const sellerId = getId(transaction.seller);

          const isBuyer =
            Boolean(currentUserId) &&
            buyerId === currentUserId;

          const isSeller =
            Boolean(currentUserId) &&
            sellerId === currentUserId;

          const role = isBuyer
            ? 'Purchase'
            : isSeller
              ? 'Sale'
              : 'Transaction';

          const status = getStatus(transaction);
          const amount = Number(transaction.amountPaise) / 100;

          return (
            <Paper
              key={transaction._id}
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Chip
                    label={role}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />

                  <Typography fontWeight={600}>
                    {listing?.title || 'Listing unavailable'}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, overflowWrap: 'anywhere' }}
                  >
                    Transaction: {transaction._id}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Placed {formatDate(transaction.createdAt)}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography fontWeight={700}>
                    {Number.isFinite(amount)
                      ? amount.toLocaleString('en-IN', {
                          style: 'currency',
                          currency: transaction.currency || 'INR',
                        })
                      : 'Amount unavailable'}
                  </Typography>

                  <Chip
                    label={status.label}
                    color={status.color}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Payment: {transaction.paymentStatus || 'Unknown'}
                {' · '}
                Delivery: {transaction.fulfilmentStatus || 'Unknown'}
              </Typography>

              {transaction.paymentStatus === 'paid' &&
                status.step >= 0 && (
                  <Stepper
                    activeStep={status.step}
                    alternativeLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      },
                    }}
                  >
                    {STATUS_STEPS.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
