
import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  InputBase,
  Badge,
  Avatar,
  Chip,
  IconButton,
  Button,
} from '@mui/material';

import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';

import { API_URL } from '../config';

const DRAWER_WIDTH = 232;

const BLUE = '#0284C7';
const DARK_BLUE = '#0369A1';
const LIGHT_BLUE = '#E0F2FE';
const PAGE_BG = '#F8FAFC';

const navItems = [
  {
    label: 'Nearby',
    icon: <StorefrontOutlinedIcon />,
    path: '/',
  },
  {
    label: 'Sell something',
    icon: <span style={{ fontSize: 22, lineHeight: 1 }}>＋</span>,
    path: '/create-listing',
  },
  {
    label: 'Messages',
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>💬</span>,
    path: '/chat',
  },
  {
    label: 'Orders',
    icon: <ReceiptLongOutlinedIcon />,
    path: '/orders',
  },
  {
    label: 'Profile',
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>👤</span>,
    path: '/profile',
  },
];

function getLoggedInUser() {
  let savedUser = {};

  for (const key of ['user', 'currentUser']) {
    try {
      const value = localStorage.getItem(key);

      if (value) {
        const parsed = JSON.parse(value);

        if (parsed && typeof parsed === 'object') {
          savedUser = parsed;
          break;
        }
      }
    } catch {
      // Ignore invalid stored user data.
    }
  }

  let tokenUser = {};

  try {
    const token = localStorage.getItem('token');

    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      tokenUser = payload.user || payload;
    }
  } catch {
    // Saved user data can still be used.
  }

  return {
    ...tokenUser,
    ...savedUser,
    name: savedUser.name || tokenUser.name || tokenUser.fullName || '',
    email: savedUser.email || tokenUser.email || '',
    neighborhood:
      savedUser.neighborhood || tokenUser.neighborhood || '',
    avatar:
      savedUser.avatar ||
      savedUser.profileImage ||
      tokenUser.avatar ||
      '',
  };
}

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [user, setUser] = useState(getLoggedInUser);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUser(getLoggedInUser());
  }, [location.pathname]);

  // Refresh unread notifications.
  useEffect(() => {
    let active = true;

    const fetchUnreadCount = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        if (active) setUnreadCount(0);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/notifications/unread-count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        if (active) {
          setUnreadCount(Math.max(0, Number(data.count) || 0));
        }
      } catch (error) {
        console.error('Failed to fetch unread notifications:', error);
      }
    };

    fetchUnreadCount();

    const intervalId = window.setInterval(fetchUnreadCount, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    const handleNotificationsUpdated = () => {
      fetchUnreadCount();
    };

    window.addEventListener(
      'notificationsUpdated',
      handleNotificationsUpdated
    );

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      active = false;
      window.clearInterval(intervalId);

      window.removeEventListener(
        'notificationsUpdated',
        handleNotificationsUpdated
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, [location.pathname]);

  // Refresh user information after account changes.
  useEffect(() => {
    const refreshUser = () => setUser(getLoggedInUser());

    window.addEventListener('storage', refreshUser);
    window.addEventListener('userUpdated', refreshUser);

    return () => {
      window.removeEventListener('storage', refreshUser);
      window.removeEventListener('userUpdated', refreshUser);
    };
  }, []);

  const displayName = user.name || 'My Account';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: PAGE_BG,
      }}
    >
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ px: 3, py: 3 }}>
          <Typography
            variant="h5"
            sx={{
              color: BLUE,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            Aas-Paas
          </Typography>

          <Typography variant="caption" sx={{ color: '#64748B' }}>
            buy &amp; sell nearby
          </Typography>
        </Box>

        <List sx={{ px: 1.5, pt: 0 }}>
          {navItems.map((item) => {
            const selected =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: '#334155',
                  '& .MuiListItemIcon-root': {
                    color: selected ? BLUE : '#64748B',
                  },
                  '&.Mui-selected': {
                    bgcolor: LIGHT_BLUE,
                    color: DARK_BLUE,
                    '& .MuiListItemIcon-root': {
                      color: DARK_BLUE,
                    },
                    '&:hover': {
                      bgcolor: '#BAE6FD',
                    },
                  },
                  '&:hover': {
                    bgcolor: '#F0F9FF',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: selected ? 600 : 400,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        {/* User profile */}
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => navigate('/profile')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') navigate('/profile');
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: LIGHT_BLUE,
              cursor: 'pointer',
              minWidth: 0,
              '&:hover': {
                bgcolor: '#BAE6FD',
              },
            }}
          >
            <Avatar
              src={user.avatar || undefined}
              sx={{
                width: 38,
                height: 38,
                bgcolor: BLUE,
                color: '#FFFFFF',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {!user.avatar && initials}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                sx={{ color: '#0C4A6E' }}
              >
                {displayName}
              </Typography>

              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: '#0369A1',
                  display: 'block',
                }}
              >
                {user.neighborhood || user.email || 'My Profile'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#FFFFFF',
            color: '#0F172A',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Chip
              icon={<RoomOutlinedIcon sx={{ fontSize: 18 }} />}
              label={`${user.neighborhood || 'Your area'} · nearby`}
              variant="outlined"
              sx={{
                borderColor: '#BAE6FD',
                color: DARK_BLUE,
                '& .MuiChip-icon': {
                  color: BLUE,
                },
              }}
            />

            {/* Marketplace search */}
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#F0F9FF',
                border: '1px solid #E0F2FE',
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
                maxWidth: 420,
                '&:focus-within': {
                  borderColor: BLUE,
                },
              }}
            >
              <SearchIcon
                sx={{ color: BLUE, mr: 1 }}
                fontSize="small"
              />

              <InputBase
                placeholder="Search nearby listings"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                fullWidth
                sx={{ fontSize: 14 }}
              />
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Grocery */}
            <Button
              variant="outlined"
              startIcon={<ShoppingBasketOutlinedIcon />}
              onClick={() => navigate('/grocery')}
              sx={{
                color: DARK_BLUE,
                borderColor: '#BAE6FD',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: LIGHT_BLUE,
                  borderColor: BLUE,
                },
              }}
            >
              Grocery
            </Button>

            {/* Notifications */}
            <IconButton
              aria-label={`Notifications, ${unreadCount} unread`}
              onClick={() => navigate('/notifications')}
              sx={{
                color: BLUE,
                '&:hover': {
                  bgcolor: LIGHT_BLUE,
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="primary"
                invisible={unreadCount === 0}
                max={99}
              >
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 4 },
            bgcolor: PAGE_BG,
          }}
        >
          <Outlet context={{ search, setSearch }} />
        </Box>
      </Box>
    </Box>
  );
}
