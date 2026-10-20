
import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = getToken();

      if (!token) {
        setError('Please log in to view your notifications.');
        return;
      }

      const [notificationsResponse, countResponse] = await Promise.all([
        fetch(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!notificationsResponse.ok || !countResponse.ok) {
        throw new Error('Unable to load notifications. Please try again.');
      }

      const notificationData = await notificationsResponse.json();
      const countData = await countResponse.json();

      setNotifications(
        Array.isArray(notificationData) ? notificationData : []
      );
      setUnreadCount(Number(countData.count) || 0);
    } catch (err) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/${id}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Could not mark notification as read.');
      }

      await fetchNotifications();
    } catch (err) {
      setError(err.message || 'Could not update notification.');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/read-all`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Could not mark all notifications as read.');
      }

      await fetchNotifications();
    } catch (err) {
      setError(err.message || 'Could not update notifications.');
    }
  };

  const formatTime = (date) => {
    if (!date) return '';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return '';

    return parsedDate.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h4">Notifications</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {unreadCount} unread
          </Typography>
        </Box>

        <Button
          onClick={markAllAsRead}
          disabled={unreadCount === 0 || loading}
          variant="outlined"
          size="small"
        >
          Mark all as read
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchNotifications}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="body1" fontWeight={600}>
            No notifications yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Updates about your orders will appear here.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {notifications.map((notification) => (
            <Paper
              key={notification._id}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                bgcolor: notification.isRead
                  ? 'background.paper'
                  : '#F8F3E4',
              }}
            >
              {!notification.isRead && (
                <CircleIcon
                  sx={{
                    fontSize: 8,
                    color: 'secondary.main',
                    mt: 0.7,
                    flexShrink: 0,
                  }}
                />
              )}

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={notification.isRead ? 400 : 600}
                >
                  {notification.title}
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {notification.message}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1 }}
                >
                  {formatTime(notification.createdAt)}
                </Typography>

                {!notification.isRead && (
                  <Button
                    size="small"
                    sx={{ mt: 0.5, px: 0, minWidth: 0 }}
                    onClick={() => markAsRead(notification._id)}
                  >
                    Mark as read
                  </Button>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
