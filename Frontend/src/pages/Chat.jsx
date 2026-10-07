import {
  useEffect,
  useState,
} from 'react';

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
} from '@mui/material';

import SendIcon from '@mui/icons-material/Send';

import socket from '../socket';


export default function Chat() {

  const { id } = useParams();

  const navigate = useNavigate();

  const conversationId = id;


  // ========================================
  // STATE
  // ========================================

  const [draft, setDraft] =
    useState('');

  const [localMessages, setLocalMessages] =
    useState([]);

  const [conversations, setConversations] =
    useState([]);

  const [conversation, setConversation] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  // ========================================
  // CURRENT USER
  // ========================================

  const token =
    localStorage.getItem('token');

  let currentUserId = null;


  if (token) {

    try {

      const payload =
        JSON.parse(
          atob(
            token.split('.')[1]
          )
        );

      currentUserId =
        payload.id;

    } catch (error) {

      console.error(
        'JWT decode error:',
        error
      );

    }

  }


  // ========================================
  // LOAD CONVERSATIONS + CURRENT CHAT
  // ========================================

  useEffect(() => {

    if (!token) {

      navigate('/login');

      return;

    }


    const loadChat =
      async () => {

        try {

          setLoading(true);

          setError('');


          // --------------------------------
          // GET ALL MY CONVERSATIONS
          // --------------------------------

          const conversationsResponse =
            await fetch(
              'http://localhost:8080/api/conversations',
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );


          const conversationsData =
            await conversationsResponse.json();


          if (
            !conversationsResponse.ok
          ) {

            setError(
              conversationsData.message ||
              'Failed to load conversations'
            );

            return;

          }


          setConversations(
            conversationsData
          );


          // --------------------------------
          // IF NO CONVERSATION SELECTED
          // --------------------------------

          if (!conversationId) {

            if (
              conversationsData.length > 0
            ) {

              navigate(
                `/chat/${conversationsData[0]._id}`
              );

            }

            return;

          }


          // --------------------------------
          // GET CURRENT CONVERSATION
          // --------------------------------

          const conversationResponse =
            await fetch(
              `http://localhost:8080/api/conversations/${conversationId}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );


          const conversationData =
            await conversationResponse.json();


          if (
            !conversationResponse.ok
          ) {

            setError(
              conversationData.message ||
              'Failed to load conversation'
            );

            return;

          }


          setConversation(
            conversationData
          );


          // --------------------------------
          // GET MESSAGES
          // --------------------------------

          const messagesResponse =
            await fetch(
              `http://localhost:8080/api/messages/${conversationId}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );


          const messagesData =
            await messagesResponse.json();


          if (
            !messagesResponse.ok
          ) {

            setError(
              messagesData.message ||
              'Failed to load messages'
            );

            return;

          }


          setLocalMessages(
            messagesData
          );


        } catch (error) {

          console.error(
            'Chat loading error:',
            error
          );

          setError(
            'Unable to load chat.'
          );

        } finally {

          setLoading(false);

        }

      };


    loadChat();

  }, [
    conversationId,
    token,
    navigate,
  ]);


  // ========================================
  // SOCKET.IO
  // ========================================

  useEffect(() => {

    if (!conversationId) {

      return;

    }


    socket.connect();


    socket.emit(
      'joinConversation',
      conversationId
    );


    const handleReceiveMessage =
      (message) => {

        setLocalMessages(
          (previousMessages) => {

            const alreadyExists =
              previousMessages.some(
                (existingMessage) =>
                  existingMessage._id ===
                  message._id
              );


            if (alreadyExists) {

              return previousMessages;

            }


            return [
              ...previousMessages,
              message,
            ];

          }
        );

      };


    socket.on(
      'receiveMessage',
      handleReceiveMessage
    );


    return () => {

      socket.off(
        'receiveMessage',
        handleReceiveMessage
      );

      socket.disconnect();

    };

  }, [
    conversationId,
  ]);


  // ========================================
  // SEND MESSAGE
  // ========================================

  const handleSend =
    () => {

      if (!draft.trim()) {

        return;

      }


      if (!conversationId) {

        return;

      }


      if (!currentUserId) {

        setError(
          'Please login first.'
        );

        return;

      }


      socket.emit(
        'sendMessage',
        {
          conversationId:
            conversationId,

          sender:
            currentUserId,

          text:
            draft.trim(),
        }
      );


      setDraft('');

    };


  // ========================================
  // FIND OTHER USER
  // ========================================

  const otherParticipant =
    conversation?.participants?.find(
      (participant) =>
        participant._id !==
        currentUserId
    );


  // ========================================
  // LOADING
  // ========================================

  if (loading) {

    return (
      <Box
        sx={{
          py: 8,
          textAlign: 'center',
        }}
      >

        <Typography
          color="text.secondary"
        >
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

      {/* ================================= */}
      {/* CONVERSATION SIDEBAR */}
      {/* ================================= */}

      <Box
        sx={{
          width: 320,
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >

        <Typography
          variant="h6"
          sx={{ p: 2 }}
        >
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

            conversations.map(
              (item) => {

                const otherUser =
                  item.participants?.find(
                    (participant) =>
                      participant._id !==
                      currentUserId
                  );


                return (

                  <ListItemButton
                    key={item._id}
                    selected={
                      item._id ===
                      conversationId
                    }
                    onClick={() =>
                      navigate(
                        `/chat/${item._id}`
                      )
                    }
                    sx={{
                      py: 1.5,

                      '&.Mui-selected': {
                        bgcolor:
                          '#F2EFE6',
                      },
                    }}
                  >

                    <ListItemAvatar>

                      <Avatar>
                        {otherUser?.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          '?'}
                      </Avatar>

                    </ListItemAvatar>


                    <ListItemText
                      primary={
                        otherUser?.name ||
                        'Unknown user'
                      }
                      secondary={
                        item.listing?.title ||
                        'Listing'
                      }
                    />

                  </ListItemButton>

                );

              }
            )

          )}

        </List>

      </Box>


      {/* ================================= */}
      {/* CHAT AREA */}
      {/* ================================= */}

      <Box
        sx={{
          flexGrow: 1,
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

          <Typography
            fontWeight={600}
          >
            {otherParticipant?.name ||
              'Conversation'}
          </Typography>


          <Typography
            variant="caption"
            color="text.secondary"
          >
            About:{' '}
            {conversation?.listing?.title ||
              'Listing'}
          </Typography>

        </Box>


        {/* ERROR */}

        {error && (

          <Box
            sx={{
              px: 2,
              pt: 2,
            }}
          >

            <Typography
              color="error"
              variant="body2"
            >
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

          {localMessages.length === 0 ? (

            <Typography
              color="text.secondary"
              sx={{
                textAlign: 'center',
                mt: 5,
              }}
            >
              No messages yet.
            </Typography>

          ) : (

            localMessages.map(
              (message) => {

                const isMine =
                  message.sender?._id ===
                  currentUserId ||
                  message.sender ===
                  currentUserId;


                return (

                  <Box
                    key={
                      message._id
                    }
                    sx={{
                      display: 'flex',
                      justifyContent:
                        isMine
                          ? 'flex-end'
                          : 'flex-start',
                    }}
                  >

                    <Paper
                      sx={{
                        px: 2,
                        py: 1,
                        maxWidth: '60%',

                        bgcolor:
                          isMine
                            ? 'primary.main'
                            : 'background.paper',

                        color:
                          isMine
                            ? 'primary.contrastText'
                            : 'text.primary',

                        border:
                          isMine
                            ? 'none'
                            : '1px solid',

                        borderColor:
                          'divider',

                        borderRadius: 2.5,
                      }}
                    >

                      <Typography
                        variant="body2"
                      >
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
                            ).toLocaleTimeString(
                              [],
                              {
                                hour:
                                  '2-digit',

                                minute:
                                  '2-digit',
                              }
                            )
                          : 'Now'}
                      </Typography>

                    </Paper>

                  </Box>

                );

              }
            )

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
            onChange={(e) =>
              setDraft(e.target.value)
            }
            onKeyDown={(e) => {

              if (
                e.key === 'Enter'
              ) {

                handleSend();

              }

            }}
          />


          <IconButton
            color="primary"
            onClick={handleSend}
          >
            <SendIcon />
          </IconButton>

        </Box>

      </Box>

    </Box>

  );

}