import { useState } from 'react';
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
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import { currentUser, notifications } from '../data/mockData';

const DRAWER_WIDTH = 232;

const navItems = [
  { label: 'Nearby', icon: <StorefrontOutlinedIcon />, path: '/' },
  { label: 'Sell something', icon: <AddCircleOutlineIcon />, path: '/create-listing' },
  { label: 'Messages', icon: <ChatBubbleOutlineIcon />, path: '/chat' },
  { label: 'Orders', icon: <ReceiptLongOutlinedIcon />, path: '/orders' },
  { label: 'Profile', icon: <PersonOutlineIcon />, path: '/profile' },
];

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          },
        }}
      >
        <Box sx={{ px: 3, py: 3 }}>
          <Typography variant="h5" sx={{ color: 'primary.dark', letterSpacing: '-0.02em' }}>
            Aas-Paas
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            buy & sell nearby
          </Typography>
        </Box>
        <List sx={{ px: 1.5 }}>
          {navItems.map((item) => {
            const selected =
              item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            return (
              <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ mt: 'auto', p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#F2EFE6',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/profile')}
          >
            <Avatar src={currentUser.avatar} sx={{ width: 36, height: 36 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {currentUser.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {currentUser.neighborhood}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" color="transparent" sx={{ bgcolor: 'background.paper' }}>
          <Toolbar sx={{ gap: 2 }}>
            <Chip
              icon={<RoomOutlinedIcon sx={{ fontSize: 18 }} />}
              label={currentUser.neighborhood + ' · within 3 km'}
              variant="outlined"
              sx={{ borderColor: 'divider', fontWeight: 500 }}
            />
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#F2EFE6',
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
                maxWidth: 420,
              }}
            >
              <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />
              <InputBase placeholder="Search nearby listings" fullWidth sx={{ fontSize: 14 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={() => navigate('/notifications')}>
              <Badge badgeContent={unreadCount} color="secondary">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, p: 4 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
