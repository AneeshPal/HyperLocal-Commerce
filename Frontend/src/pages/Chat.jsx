import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Badge,
  Paper,
  TextField,
  IconButton,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { conversations } from '../data/mockData';

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const activeId = id || conversations[0].id;
  const active = conversations.find((c) => c.id === activeId) || conversations[0];
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState(active.messages);

  const handleSend = () => {
    if (!draft.trim()) return;
    setLocalMessages([...localMessages, { from: 'me', text: draft, time: 'Now' }]);
    setDraft('');
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 160px)', gap: 0, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ width: 320, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Messages
        </Typography>
        <Divider />
        <List sx={{ p: 0 }}>
          {conversations.map((c) => (
            <ListItemButton
              key={c.id}
              selected={c.id === activeId}
              onClick={() => navigate(`/chat/${c.id}`)}
              sx={{
                py: 1.5,
                '&.Mui-selected': { bgcolor: '#F2EFE6' },
              }}
            >
              <ListItemAvatar>
                <Avatar src={c.avatar} />
              </ListItemAvatar>
              <ListItemText
                primary={c.withUser}
                secondary={
                  <>
                    <Typography component="span" variant="caption" display="block" noWrap sx={{ color: 'text.secondary' }}>
                      {c.listingTitle}
                    </Typography>
                    <Typography component="span" variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                      {c.lastMessage}
                    </Typography>
                  </>
                }
              />
              {c.unread > 0 && <Badge color="secondary" badgeContent={c.unread} />}
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#FBFAF6' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography fontWeight={600}>{active.withUser}</Typography>
          <Typography variant="caption" color="text.secondary">
            About: {active.listingTitle}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto' }}>
          {localMessages.map((m, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start' }}>
              <Paper
                sx={{
                  px: 2,
                  py: 1,
                  maxWidth: '60%',
                  bgcolor: m.from === 'me' ? 'primary.main' : 'background.paper',
                  color: m.from === 'me' ? 'primary.contrastText' : 'text.primary',
                  border: m.from === 'me' ? 'none' : '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2.5,
                }}
              >
                <Typography variant="body2">{m.text}</Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.7, display: 'block', mt: 0.3 }}
                >
                  {m.time}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, bgcolor: 'background.paper' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <IconButton color="primary" onClick={handleSend}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
