
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Paper,
  TextField,
  IconButton,
  Divider,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';

import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';

import socket from '../socket';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const conversationId = id;

  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageNotice, setMessageNotice] = useState('');

  const token = localStorage.getItem('token');

  let currentUserId = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.id;
    } catch (decodeError) {
      console.error('JWT decode error:', decodeError);
    }
  }

  // Load conversations and chat history
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    let cancelled = false;

    const loadChat = async () => {
      try {
        setLoading(true);
        setError('');

        const conversationsResponse = await fetch(
          `${API_BASE}/api/conversations`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const conversationsData = await conversationsResponse.json();

        if (!conversationsResponse.ok) {
          throw new Error(
            conversationsData.message || 'Failed to load conversations'
          );
        }

        if (cancelled) return;

        setConversations(conversationsData);

        if (!conversationId) {
          setConversation(null);
          setLocalMessages([]);

          if (conversationsData.length > 0) {
            navigate(`/chat/${conversationsData[0]._id}`);
          }
          return;
        }

        const selectedConversation = conversationsData.find(
          (item) => String(item._id) === String(conversationId)
        );

        if (!selectedConversation) {
          setConversation(null);
          setLocalMessages([]);
          setError('This conversation is not in your conversation list.');
          return;
        }

        const conversationResponse = await fetch(
          `${API_BASE}/api/conversations/${conversationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const conversationData = await conversationResponse.json();

        if (!conversationResponse.ok) {
          throw new Error(
            conversationData.message || 'Failed to load conversation'
          );
        }

        if (cancelled) return;
        setConversation(conversationData);

        const messagesResponse = await fetch(
          `${API_BASE}/api/messages/${conversationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const messagesData = await messagesResponse.json();

        if (!messagesResponse.ok) {
          throw new Error(
            messagesData.message || 'Failed to load messages'
          );
        }

        if (cancelled) return;
        setLocalMessages(messagesData);
      } catch (loadError) {
        if (!cancelled) {
          console.error('Chat loading error:', loadError);
          setError(loadError.message || 'Unable to load chat.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadChat();

    return () => {
      cancelled = true;
    };
  }, [conversationId, token, navigate]);

  // Socket connection and real-time events
  useEffect(() => {
    if (!token || !conversationId) return;

    const handleConnect = () => {
      setError('');
      socket.emit('joinConversation', conversationId);
    };

    const handleReceiveMessage = (message) => {
      const receivedConversationId =
        message.conversation?._id ?? message.conversation;

      if (
        String(receivedConversationId) !== String(conversationId)
      ) {
        return;
      }

      setLocalMessages((previousMessages) => {
        const messageId = message._id
          ? String(message._id)
          : null;

        if (
          messageId &&
          previousMessages.some(
            (existing) => String(existing._id) === messageId
          )
        ) {
          return previousMessages;
        }

        return [...previousMessages, message];
      });
    };

    const handleNewNotification = (notification) => {
      if (
        notification?.type === 'general' ||
        notification?.title === 'New message received'
      ) {
        setMessageNotice(
          notification.message || 'You received a new message.'
        );

        window.dispatchEvent(new Event('notificationsUpdated'));
      }
    };

    const handleConnectError = (connectError) => {
      console.error('Socket connection error:', connectError.message);
      setError(
        'Live chat connection failed. Check your login and backend connection.'
      );
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('newNotification', handleNewNotification);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('newNotification', handleNewNotification);

      socket.disconnect();
    };
  }, [conversationId, token]);

  // Send a message
  const handleSend = () => {
    const text = draft.trim();

    if (!text || !conversationId) return;

    if (!currentUserId) {
      setError('Please log in again.');
      return;
    }

    if (!socket.connected) {
      setError('Live chat is not connected. Please try again.');
      return;
    }

    setError('');

    socket.emit(
      'sendMessage',
      {
        conversationId,
        text,
      },
      (result) => {
        if (!result?.ok) {
          setError(
            result?.message ||
              'Message could not be sent. Please try again.'
          );
          return;
        }

        setError('');
      }
    );

    setDraft('');
  };

  // Delete a conversation
  const handleDeleteConversation = async (event, item) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      'Delete this conversation and all its messages? This affects both participants.'
    );

    if (!confirmed) return;

    try {
      setError('');

      const response = await fetch(
        `${API_BASE}/api/conversations/${item._id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to delete conversation'
        );
      }

      const remainingConversations = conversations.filter(
        (existing) => String(existing._id) !== String(item._id)
      );

      setConversations(remainingConversations);

      if (String(conversationId) === String(item._id)) {
        setConversation(null);
        setLocalMessages([]);

        if (remainingConversations.length > 0) {
          navigate(`/chat/${remainingConversations[0]._id}`);
        } else {
          navigate('/chat');
        }
      }
    } catch (deleteError) {
      console.error('Delete conversation error:', deleteError);
      setError(
        deleteError.message || 'Unable to delete conversation.'
      );
    }
  };

  const otherParticipant = conversation?.participants?.find(
    (participant) =>
      String(participant._id) !== String(currentUserId)
  );

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Loading chat...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 160px)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Conversation sidebar */}
      <Box
        sx={{
          width: 320,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflowY: 'auto',
        }}
      >
        <Typography variant="h6" sx={{ p: 2 }}>
          Messages
        </Typography>

        <Divider />

        <List sx={{ p: 0 }}>
          {conversations.length === 0 ? (
            <Typography sx={{ p: 2, color: 'text.secondary' }}>
              No conversations yet.
            </Typography>
          ) : (
            conversations.map((item) => {
              const otherUser = item.participants?.find(
                (participant) =>
                  String(participant._id) !== String(currentUserId)
              );

              return (
                <ListItemButton
                  key={item._id}
                  selected={String(item._id) === String(conversationId)}
                  onClick={() => navigate(`/chat/${item._id}`)}
                  sx={{
                    py: 1.5,
                    '&.Mui-selected': { bgcolor: '#F2EFE6' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={otherUser?.name || 'Unknown user'}
                    secondary={item.listing?.title || 'Listing'}
                    primaryTypographyProps={{ noWrap: true }}
                    secondaryTypographyProps={{ noWrap: true }}
                  />

                  <Tooltip title="Delete conversation">
                    <IconButton
                      edge="end"
                      color="error"
                      aria-label="Delete conversation"
                      size="small"
                      onClick={(event) =>
                        handleDeleteConversation(event, item)
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemButton>
              );
            })
          )}
        </List>
      </Box>

      {/* Chat area */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#FBFAF6',
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography fontWeight={600}>
            {otherParticipant?.name || 'Conversation'}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            About: {conversation?.listing?.title || 'Listing'}
          </Typography>
        </Box>

        {error && (
          <Box sx={{ px: 2, pt: 2 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        {/* Messages */}
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            overflowY: 'auto',
          }}
        >
          {!conversationId ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: 'center', mt: 5 }}
            >
              Select a conversation to view messages.
            </Typography>
          ) : localMessages.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: 'center', mt: 5 }}
            >
              No messages yet.
            </Typography>
          ) : (
            localMessages.map((message) => {
              const senderId = message.sender?._id ?? message.sender;
              const isMine =
                String(senderId) === String(currentUserId);

              return (
                <Box
                  key={message._id}
                  sx={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Paper
                    sx={{
                      px: 2,
                      py: 1,
                      maxWidth: '60%',
                      bgcolor: isMine
                        ? 'primary.main'
                        : 'background.paper',
                      color: isMine
                        ? 'primary.contrastText'
                        : 'text.primary',
                      border: isMine ? 'none' : '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2.5,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    <Typography variant="body2">
                      {message.text}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                        display: 'block',
                        mt: 0.3,
                      }}
                    >
                      {message.createdAt
                        ? new Date(message.createdAt).toLocaleTimeString(
                            [],
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )
                        : 'Now'}
                    </Typography>
                  </Paper>
                </Box>
              );
            })
          )}
        </Box>

        {/* Message input */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            bgcolor: 'background.paper',
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            disabled={!conversationId}
          />

          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!conversationId || !draft.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>

      {/* New message notification popup */}
      <Snackbar
        open={Boolean(messageNotice)}
        autoHideDuration={4500}
        onClose={() => setMessageNotice('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setMessageNotice('')}
          severity="info"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {messageNotice}
        </Alert>
      </Snackbar>
    </Box>
  );
}
