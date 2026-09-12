import { Box, Typography, Paper, Badge } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { notifications } from '../data/mockData';

export default function Notifications() {
  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Notifications
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {notifications.map((n) => (
          <Paper
            key={n.id}
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              bgcolor: n.read ? 'background.paper' : '#F8F3E4',
            }}
          >
            {!n.read && <CircleIcon sx={{ fontSize: 8, color: 'secondary.main', mt: 0.7 }} />}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" fontWeight={n.read ? 400 : 600}>
                {n.text}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {n.time}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
