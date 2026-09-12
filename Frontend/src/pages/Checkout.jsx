import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { listings } from '../data/mockData';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const listing = listings.find((l) => l.id === id) || listings[0];
  const [placed, setPlaced] = useState(false);

  const platformFee = Math.round(listing.price * 0.02);
  const total = listing.price + platformFee;

  if (placed) {
    return (
      <Box sx={{ maxWidth: 480, textAlign: 'center', py: 8 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Payment secured
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          &#8377;{total.toLocaleString('en-IN')} is held in escrow. It will be released to {listing.seller} once you
          confirm the item was delivered as described.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/orders')}>
          View my orders
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 520 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Checkout
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: 'divider', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box component="img" src={listing.image} alt={listing.title} sx={{ width: 72, height: 72, borderRadius: 2, objectFit: 'cover' }} />
          <Box>
            <Typography fontWeight={600}>{listing.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              Sold by {listing.seller}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Item price
          </Typography>
          <Typography variant="body2">&#8377;{listing.price.toLocaleString('en-IN')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Platform escrow fee (2%)
          </Typography>
          <Typography variant="body2">&#8377;{platformFee.toLocaleString('en-IN')}</Typography>
        </Box>
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography fontWeight={700}>Total</Typography>
          <Typography fontWeight={700}>&#8377;{total.toLocaleString('en-IN')}</Typography>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: 'divider', mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Pay with
        </Typography>
        <RadioGroup defaultValue="upi">
          <FormControlLabel value="upi" control={<Radio />} label="UPI" />
          <FormControlLabel value="card" control={<Radio />} label="Credit / Debit card" />
          <FormControlLabel value="netbanking" control={<Radio />} label="Net banking" />
        </RadioGroup>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
        <LockOutlinedIcon fontSize="small" />
        <Typography variant="caption">
          Funds stay in escrow until you confirm delivery. Powered by Razorpay.
        </Typography>
      </Box>

      <Button variant="contained" size="large" fullWidth sx={{ py: 1.3 }} onClick={() => setPlaced(true)}>
        Pay &#8377;{total.toLocaleString('en-IN')} securely
      </Button>
    </Box>
  );
}
