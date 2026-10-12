
import { useEffect, useState } from 'react';

import {
  useParams,
  useNavigate,
} from 'react-router-dom';

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
} from '@mui/material';

import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';

import socket from '../socket';


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

  const token = localStorage.getItem('token');

  let currentUserId = null;

  if (token) {
    try {
      const payload = JSON.parse(
        atob(token.split('.')[1])
      );

      currentUserId = payload.id;
    } catch (decodeError) {
      console.error('JWT decode error:', decodeError);
    }
  }


  // ========================================
  // LOAD CONVERSATIONS AND CHAT HISTORY
  // ========================================

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
          'http://localhost:8080/api/conversations',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const conversationsData =
          await conversationsResponse.json();

        if (!conversationsResponse.ok) {
          throw new Error(
            conversationsData.message ||
            'Failed to load conversations'
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

        const selectedConversation =
          conversationsData.find(
            (item) => item._id === conversationId
          );

        if (!selectedConversation) {
          setConversation(null);
          setLocalMessages([]);

          setError(
            'This conversation is not in your conversation list.'
          );

          return;
        }

        const conversationResponse = await fetch(
          `http://localhost:8080/api/conversations/${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const conversationData =
          await conversationResponse.json();

        if (!conversationResponse.ok) {
          throw new Error(
            conversationData.message ||
            'Failed to load conversation'
          );
        }

        if (cancelled) return;

        setConversation(conversationData);

        const messagesResponse = await fetch(
          `http://localhost:8080/api/messages/${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const messagesData = await messagesResponse.json();

        if (!messagesResponse.ok) {
          throw new Error(
            messagesData.message ||
            'Failed to load messages'
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
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadChat();

    return () => {
      cancelled = true;
    };
  }, [conversationId, token, navigate]);


  // ========================================
  // SOCKET.IO
  // ========================================

  useEffect(() => {
    if (!conversationId) return;

    const handleConnect = () => {
      socket.emit('joinConversation', conversationId);
    };

    const handleReceiveMessage = (message) => {
      if (
        String(message.conversation) !==
        String(conversationId)
      ) {
        return;
      }

      setLocalMessages((previousMessages) => {
        const alreadyExists = previousMessages.some(
          (existingMessage) =>
            existingMessage._id === message._id
        );

        if (alreadyExists) {
          return previousMessages;
        }

        return [...previousMessages, message];
      });
    };

    socket.on('connect', handleConnect);
    socket.on('receiveMessage', handleReceiveMessage);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.disconnect();
    };
  }, [conversationId]);


  // ========================================
  // SEND MESSAGE
  // ========================================

  const handleSend = () => {
    const text = draft.trim();

    if (!text || !conversationId) return;

    if (!currentUserId) {
      setError('Please login first.');
      return;
    }

    setError('');

    socket.emit('sendMessage', {
      conversationId,
      sender: currentUserId,
      text,
    });

    setDraft('');
  };


  // ========================================
  // DELETE CONVERSATION
  // ========================================

  const handleDeleteConversation = async (
    event,
    item
  ) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      'Delete this conversation and all its messages? This affects both participants.'
    );

    if (!confirmed) return;

    try {
      setError('');

      const response = await fetch(
        `http://localhost:8080/api/conversations/${item._id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to delete conversation'
        );
      }

      const remainingConversations =
        conversations.filter(
          (existing) => existing._id !== item._id
        );

      setConversations(remainingConversations);

      if (conversationId === item._id) {
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


  // ========================================
  // FIND OTHER PARTICIPANT
  // ========================================

  const otherParticipant =
    conversation?.participants?.find(
      (participant) =>
        String(participant._id) !== String(currentUserId)
    );


  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Loading chat...
        </Typography>
      </Box>
    );
  }


  // ========================================
  // UI
  // ========================================

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 160px)',
        gap: 0,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >

      {/* CONVERSATION SIDEBAR */}

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
            <Typography
              sx={{
                p: 2,
                color: 'text.secondary',
              }}
            >
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
                  selected={item._id === conversationId}
                  onClick={() => navigate(`/chat/${item._id}`)}
                  sx={{
                    py: 1.5,
                    '&.Mui-selected': {
                      bgcolor: '#F2EFE6',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      {otherUser?.name
                        ?.charAt(0)
                        ?.toUpperCase() || '?'}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={otherUser?.name || 'Unknown user'}
                    secondary={item.listing?.title || 'Listing'}
                    primaryTypographyProps={{
                      noWrap: true,
                    }}
                    secondaryTypographyProps={{
                      noWrap: true,
                    }}
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


      {/* CHAT AREA */}

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#FBFAF6',
        }}
      >
        {/* HEADER */}

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

          <Typography
            variant="caption"
            color="text.secondary"
          >
            About: {conversation?.listing?.title || 'Listing'}
          </Typography>
        </Box>


        {/* ERROR */}

        {error && (
          <Box sx={{ px: 2, pt: 2 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}


        {/* MESSAGES */}

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
              const senderId =
                message.sender?._id ?? message.sender;

              const isMine =
                String(senderId) === String(currentUserId);

              return (
                <Box
                  key={message._id}
                  sx={{
                    display: 'flex',
                    justifyContent: isMine
                      ? 'flex-end'
                      : 'flex-start',
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
                        ? new Date(
                            message.createdAt
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Now'}
                    </Typography>
                  </Paper>
                </Box>
              );
            })
          )}
        </Box>


        {/* MESSAGE INPUT */}

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
    </Box>
  );
}
