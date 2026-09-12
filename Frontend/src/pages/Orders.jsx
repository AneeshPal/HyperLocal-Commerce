import { Box, Typography, Paper, Stepper, Step, StepLabel, Chip } from '@mui/material';
import { orders } from '../data/mockData';

const STATUS_STEPS = ['Paid', 'Escrow held', 'Delivered', 'Released to seller'];

const statusToStep = {
  paid: 0,
  escrow_held: 1,
  delivered: 2,
  released: 3,
};

const statusLabel = {
  paid: 'Paid',
  escrow_held: 'In escrow',
  delivered: 'Delivered',
  released: 'Completed',
};

export default function Orders() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Your orders
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track payments and delivery status.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {orders.map((order) => (
          <Paper key={order.id} variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography fontWeight={600}>{order.listingTitle}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Seller: {order.seller} &middot; Placed {order.placedOn}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography fontWeight={700}>&#8377;{order.price.toLocaleString('en-IN')}</Typography>
                <Chip
                  label={statusLabel[order.status]}
                  size="small"
                  sx={{
                    mt: 0.5,
                    bgcolor: order.status === 'delivered' ? '#E7F0EC' : '#FCF1D8',
                    color: order.status === 'delivered' ? 'primary.dark' : 'secondary.dark',
                  }}
                />
              </Box>
            </Box>
            <Stepper activeStep={statusToStep[order.status]} alternativeLabel>
              {STATUS_STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
