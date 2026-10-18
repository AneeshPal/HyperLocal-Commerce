
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const STATUS_STEPS = [
  'Paid',
  'Delivered',
  'Receipt confirmed',
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
      step: 2,
      color: 'success',
    };
  }

  if (transaction.fulfilmentStatus === 'delivered') {
    return { label: 'Delivered', step: 1, color: 'info' };
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
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [disputeTransaction, setDisputeTransaction] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const [currentUserId, setCurrentUserId] = useState(() => {
    try {
      const user = JSON.parse(
        localStorage.getItem('user') ||
          localStorage.getItem('currentUser') ||
          'null'
      );
      return getId(user);
    } catch {
      return '';
    }
  });

  async function loadTransactions(showSpinner = true) {
    if (showSpinner) setLoading(true);
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

      try {
        const user = JSON.parse(
          localStorage.getItem('user') ||
            localStorage.getItem('currentUser') ||
            'null'
        );
        setCurrentUserId(getId(user));
      } catch {
        setCurrentUserId('');
      }
    } catch (err) {
      setError(err.message || 'Unable to load your orders.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  async function performAction(transaction, endpoint, successMessage, body) {
    const id = getId(transaction);

    setBusyId(id);
    setActionError('');
    setNotice('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/transactions/${encodeURIComponent(id)}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || 'The action failed. Please try again.'
        );
      }

      setNotice(successMessage);
      setDisputeTransaction(null);
      setDisputeReason('');

      await loadTransactions(false);
    } catch (err) {
      setActionError(err.message || 'Unable to complete the action.');
    } finally {
      setBusyId('');
    }
  }

  function submitDispute() {
    const reason = disputeReason.trim();

    if (!reason) {
      setActionError('Please enter a reason for the dispute.');
      return;
    }

    if (reason.length > 1000) {
      setActionError('The reason must be 1000 characters or fewer.');
      return;
    }

    performAction(
      disputeTransaction,
      'dispute',
      'Your dispute has been submitted.',
      { reason }
    );
  }

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
              onClick={() => loadTransactions()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {notice && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setNotice('')}
        >
          {notice}
        </Alert>
      )}

      {actionError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setActionError('')}
        >
          {actionError}
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
          const id = getId(transaction);

          const isBuyer =
            Boolean(currentUserId) && buyerId === currentUserId;

          const isSeller =
            Boolean(currentUserId) && sellerId === currentUserId;

          const role = isBuyer
            ? 'Purchase'
            : isSeller
              ? 'Sale'
              : 'Transaction';

          const status = getStatus(transaction);
          const amount = Number(transaction.amountPaise) / 100;
          const paid = transaction.paymentStatus === 'paid';
          const delivered =
            transaction.fulfilmentStatus === 'delivered';
          const cancelled =
            transaction.fulfilmentStatus === 'cancelled';
          const resolution =
            transaction.resolutionStatus || 'none';
          const busy = busyId === id;

          const canMarkDelivered =
            isSeller &&
            paid &&
            !delivered &&
            !cancelled &&
            resolution === 'none';

          const canConfirmReceipt =
            isBuyer &&
            paid &&
            delivered &&
            resolution === 'none';

          const canDispute =
            isBuyer &&
            paid &&
            !cancelled &&
            ['none', 'release_eligible'].includes(resolution);

          return (
            <Paper
              key={id}
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
                    Transaction: {id}
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
                {' · '}
                Resolution: {resolution.replaceAll('_', ' ')}
              </Typography>

              {paid && status.step >= 0 && (
                <Stepper
                  activeStep={status.step}
                  alternativeLabel
                  sx={{
                    mb: 2,
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

              {cancelled && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This transaction has been cancelled.
                </Alert>
              )}

              {resolution === 'disputed' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  This transaction is disputed. Further actions are
                  disabled until it is reviewed.
                </Alert>
              )}

              {resolution === 'release_eligible' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Receipt confirmed. The transaction is eligible for
                  settlement, but settlement is not performed by this button.
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {canMarkDelivered && (
                  <Button
                    variant="contained"
                    disabled={busy}
                    onClick={() =>
                      performAction(
                        transaction,
                        'delivered',
                        'Order marked as delivered.'
                      )
                    }
                  >
                    {busy ? 'Updating...' : 'Mark as Delivered'}
                  </Button>
                )}

                {canConfirmReceipt && (
                  <Button
                    variant="contained"
                    color="success"
                    disabled={busy}
                    onClick={() =>
                      performAction(
                        transaction,
                        'confirm-receipt',
                        'Receipt confirmed successfully.'
                      )
                    }
                  >
                    {busy ? 'Updating...' : 'Confirm Receipt'}
                  </Button>
                )}

                {canDispute && (
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={busy}
                    onClick={() => {
                      setDisputeTransaction(transaction);
                      setDisputeReason('');
                      setActionError('');
                    }}
                  >
                    Raise a Dispute
                  </Button>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>

      <Dialog
        open={Boolean(disputeTransaction)}
        onClose={() => {
          if (!busyId) {
            setDisputeTransaction(null);
            setDisputeReason('');
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Raise a dispute</DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Explain the issue with this order. Submitting this will mark
            the transaction as disputed.
          </Typography>

          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            label="Reason for dispute"
            placeholder="For example, the item was not received..."
            value={disputeReason}
            onChange={(event) => setDisputeReason(event.target.value)}
            inputProps={{ maxLength: 1000 }}
            helperText={`${disputeReason.length}/1000 characters`}
            disabled={Boolean(busyId)}
          />
        </DialogContent>

        <DialogActions>
          <Button
            disabled={Boolean(busyId)}
            onClick={() => {
              setDisputeTransaction(null);
              setDisputeReason('');
            }}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            disabled={Boolean(busyId) || !disputeReason.trim()}
            onClick={submitDispute}
          >
            {busyId ? 'Submitting...' : 'Submit Dispute'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
