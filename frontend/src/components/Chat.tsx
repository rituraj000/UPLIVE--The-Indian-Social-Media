import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Button,
  InputAdornment,
  Badge,
  Menu,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  PhotoCamera as PhotoIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { messagesApi, usersApi } from '../services/api';
import { Message, User, Conversation, Post } from '../types';
import toast from 'react-hot-toast';
import PostDetailModal from './PostDetailModal';

interface ChatProps {
  selectedUser?: User;
  onBackToList?: () => void;
  onMessagesRead?: () => void;
  onConversationDeleted?: () => void;
}

const Chat: React.FC<ChatProps> = ({ selectedUser, onBackToList, onMessagesRead, onConversationDeleted }) => {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [chatUser, setChatUser] = useState<User | null>(selectedUser || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [postDetailModalOpen, setPostDetailModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [showSeen, setShowSeen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef(0);

  // Update chatUser when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setChatUser(selectedUser);
      // Reset message count ref when switching conversations
      lastMessageCountRef.current = 0;
    }
  }, [selectedUser]);

  // Simple scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
    // Also ensure the messages container stays scrolled to bottom
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll logic - only scroll when:
  // 1. Initial load (messages just loaded)
  // 2. User sends a message (new message count increases and last message is from current user)
  useEffect(() => {
    if (messages.length === 0) return;
    
    // Check if this is initial load or user sent a new message
    const isInitialLoad = lastMessageCountRef.current === 0;
    const isNewMessage = messages.length > lastMessageCountRef.current;
    const lastMessage = messages[messages.length - 1];
    const userSentMessage = lastMessage?.sender?.id === currentUser?.id;
    
    // Update message count reference
    lastMessageCountRef.current = messages.length;
    
    // Auto-scroll only on initial load or when current user sends message
    if (isInitialLoad || (isNewMessage && userSentMessage)) {
      // Use multiple timeouts to ensure scroll works even with slow rendering
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
    }
  }, [messages, currentUser?.id]);

  // Fetch chat user and messages
  useEffect(() => {
    const fetchChatData = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        let targetUser = chatUser;

        // If username provided in URL and no selectedUser prop, fetch user
        if (!targetUser && username) {
          const userResponse = await usersApi.getProfile(username);
          targetUser = userResponse.data;
          setChatUser(targetUser);
        }

        // Fetch messages if we have a target user
        if (targetUser?.id) {
          console.log('Fetching messages for user:', targetUser.id);
          
          // Reset message count for new conversation to ensure initial scroll
          lastMessageCountRef.current = 0;
          
          const messagesResponse = await messagesApi.getMessages(targetUser.id);
          setMessages(messagesResponse.data || []);
          
          // Fetch conversation status for "seen" indicator
          try {
            const statusResponse = await messagesApi.getConversationStatus(targetUser.id);
            const { lastSeenAt, hasUnreadMessages } = statusResponse.data;
            
            setLastSeenAt(lastSeenAt);
            // Show "Seen" if last message was sent by current user and has been read
            const messages = messagesResponse.data || [];
            const lastMessage = messages[messages.length - 1];
            setShowSeen(Boolean(
              lastMessage && 
              lastMessage.sender.id === currentUser?.id && 
              !hasUnreadMessages &&
              lastSeenAt
            ));
          } catch (error) {
            console.error('Error fetching conversation status:', error);
          }
          
          // Notify parent that messages were read (to update conversation list and unread counts)
          if (onMessagesRead && messagesResponse.data?.length > 0) {
            onMessagesRead();
          }
        } else {
          console.log('No target user available:', { targetUser, chatUser, selectedUser: selectedUser });
        }
      } catch (error: any) {
        console.error('Error fetching chat data:', error);
        if (error.response?.status === 404) {
          toast.error('User not found');
          navigate('/messages');
        } else {
          toast.error('Failed to load chat');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [username, chatUser?.id, currentUser?.id, navigate, onMessagesRead]);

  // Periodic refresh for seen status
  useEffect(() => {
    if (!chatUser?.id || !currentUser?.id) return;
    
    const refreshSeenStatus = async () => {
      try {
        const statusResponse = await messagesApi.getConversationStatus(chatUser.id);
        const { lastSeenAt, hasUnreadMessages } = statusResponse.data;
        
        setLastSeenAt(lastSeenAt);
        // Show "Seen" if last message was sent by current user and has been read
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          setShowSeen(Boolean(
            lastMessage && 
            lastMessage.sender.id === currentUser?.id && 
            !hasUnreadMessages &&
            lastSeenAt
          ));
        }
      } catch (error) {
        // Silently handle errors for background updates
        console.error('Error refreshing seen status:', error);
      }
    };

    // Refresh seen status every 10 seconds
    const interval = setInterval(refreshSeenStatus, 10000);
    
    return () => clearInterval(interval);
  }, [chatUser?.id, currentUser?.id, messages]);

  // Send text message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatUser || sending) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('text', messageText.trim());

      const response = await messagesApi.sendMessage(chatUser.id, formData);
      
      setMessages(prev => [...prev, response.data]);
      setMessageText('');
      
      // Hide "Seen" indicator after sending new message (until other user reads it)
      setShowSeen(false);
      
      // Force scroll to bottom when current user sends a message
      setTimeout(scrollToBottom, 100);
      
      toast.success('Message sent');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Send media message
  const handleSendMedia = async (file: File) => {
    if (!chatUser || sending) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('media', file);

      const response = await messagesApi.sendMessage(chatUser.id, formData);
      
      setMessages(prev => [...prev, response.data]);
      
      // Hide "Seen" indicator after sending new message
      setShowSeen(false);
      
      // Force scroll to bottom when current user sends media
      setTimeout(scrollToBottom, 100);
      
      toast.success('Media sent');
    } catch (error: any) {
      console.error('Error sending media:', error);
      toast.error('Failed to send media');
    } finally {
      setSending(false);
    }
  };

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleSendMedia(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Delete conversation handler
  const handleDeleteConversation = async () => {
    if (!chatUser || deletingConversation) return;

    setDeletingConversation(true);
    try {
      await messagesApi.deleteConversation(chatUser.id);
      toast.success('Conversation deleted');
      
      // Call the deletion callback if provided
      if (onConversationDeleted) {
        onConversationDeleted();
      } else {
        // Fallback: Navigate back to messages list
        if (onBackToList) {
          onBackToList();
        } else {
          navigate('/messages');
        }
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    } finally {
      setDeletingConversation(false);
      setDeleteDialogOpen(false);
      setAnchorEl(null);
    }
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!chatUser) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Select a conversation to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden'
    }}>
      {/* Chat Header - Sticky */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          borderRadius: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {onBackToList && (
              <IconButton onClick={onBackToList}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                cursor: 'pointer',
                borderRadius: 2,
                p: 1,
                '&:hover': {
                  backgroundColor: 'grey.100'
                }
              }}
              onClick={() => navigate(`/${chatUser.username}`)}
            >
              <Avatar src={chatUser.profilePicture} alt={chatUser.username} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {chatUser.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {chatUser.fullName}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton>
              <PhoneIcon />
            </IconButton>
            <IconButton>
              <VideoCallIcon />
            </IconButton>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages List */}
      <Box 
        ref={messagesContainerRef}
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 1,
          backgroundColor: 'grey.50',
          minHeight: 0,
          maxHeight: 'none',  // Remove height restriction
          paddingBottom: 2  // Add bottom padding for better spacing
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start a conversation!
            </Typography>
          </Box>
        ) : (
          <Box>
            {messages.map((message, index) => {
              const isOwn = message.sender.id === currentUser?.id;
              const showTime = index === 0 || 
                new Date(messages[index - 1].createdAt).getTime() - new Date(message.createdAt).getTime() > 300000; // 5 minutes

              return (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Card
                    sx={{
                      maxWidth: '70%',
                      backgroundColor: isOwn ? 'primary.main' : 'white',
                      color: isOwn ? 'white' : 'text.primary'
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      {/* Text Message */}
                      {message.content.text && (
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {message.content.text}
                        </Typography>
                      )}
                      
                      {/* Media Message */}
                      {message.content.media && (
                        <Box sx={{ mt: message.content.text ? 1 : 0 }}>
                          {message.content.media.type === 'image' ? (
                            <img
                              src={message.content.media.url}
                              alt="Shared image"
                              style={{
                                maxWidth: '100%',
                                borderRadius: '8px',
                                display: 'block'
                              }}
                            />
                          ) : (
                            <video
                              src={message.content.media.url}
                              controls
                              style={{
                                maxWidth: '100%',
                                borderRadius: '8px',
                                display: 'block'
                              }}
                            />
                          )}
                        </Box>
                      )}
                      
                      {/* Post Share */}
                      {message.content.post && (
                        <Box sx={{ mt: message.content.text ? 1 : 0 }}>
                          <Card 
                            sx={{ 
                              maxWidth: 300, 
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:hover': {
                                boxShadow: 2,
                                borderColor: 'primary.main'
                              }
                            }}
                            onClick={() => {
                              // Open post detail modal
                              if (message.content.post) {
                                setSelectedPost(message.content.post);
                                setPostDetailModalOpen(true);
                              }
                            }}
                          >
                            {/* Post Media */}
                            {message.content.post.media && message.content.post.media.length > 0 && (
                              <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                                {message.content.post.media[0].type === 'image' ? (
                                  <img
                                    src={message.content.post.media[0].url}
                                    alt="Shared post"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                  />
                                ) : (
                                  <video
                                    src={message.content.post.media[0].url}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                    muted
                                  />
                                )}
                                
                                {/* Multiple media indicator */}
                                {message.content.post.media.length > 1 && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 8,
                                      right: 8,
                                      backgroundColor: 'rgba(0,0,0,0.7)',
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: 1,
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    +{message.content.post.media.length - 1}
                                  </Box>
                                )}
                              </Box>
                            )}
                            
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              {/* Post Author */}
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Avatar
                                  src={message.content.post.user.profilePicture}
                                  alt={message.content.post.user.username}
                                  sx={{ width: 24, height: 24, mr: 1 }}
                                />
                                <Typography variant="body2" fontWeight="bold">
                                  {message.content.post.user.username}
                                </Typography>
                              </Box>
                              
                              {/* Post Caption */}
                              {message.content.post.caption && (
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: 1.2,
                                    mb: 0.5
                                  }}
                                >
                                  {message.content.post.caption}
                                </Typography>
                              )}
                              
                              {/* Post Stats */}
                              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {message.content.post.likeCount} {message.content.post.likeCount === 1 ? 'like' : 'likes'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {message.content.post.commentCount} {message.content.post.commentCount === 1 ? 'comment' : 'comments'}
                                </Typography>
                              </Box>
                              
                              {/* Shared indicator */}
                              <Typography 
                                variant="caption" 
                                color="primary" 
                                sx={{ 
                                  display: 'block', 
                                  mt: 1,
                                  fontStyle: 'italic'
                                }}
                              >
                                📤 Shared Post
                              </Typography>
                            </CardContent>
                          </Card>
                        </Box>
                      )}
                      
                      {/* Timestamp */}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mt: 0.5, 
                          opacity: 0.7,
                          fontSize: '0.75rem'
                        }}
                      >
                        {formatMessageTime(message.createdAt)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
            
            {/* Seen Indicator */}
            {showSeen && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                mt: 1, 
                mr: 2 
              }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: '0.75rem',
                    fontStyle: 'italic'
                  }}
                >
                  Seen {lastSeenAt && new Date(lastSeenAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Typography>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Message Input - Fixed at bottom with padding */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          borderRadius: 0,
          flexShrink: 0,
          borderTop: '1px solid #e0e0e0',
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'white',
          zIndex: 10,
          mb: 1  // Add margin bottom for better spacing
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => fileInputRef.current?.click()}>
            <PhotoIcon />
          </IconButton>
          
          <TextField
            fullWidth
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={4}
            variant="outlined"
            size="small"
            InputProps={{
              sx: { 
                borderRadius: 3,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#bdbdbd',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E4405F',
                }
              }
            }}
          />
          
          <IconButton 
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            color="primary"
          >
            {sending ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Paper>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        style={{ display: 'none' }}
      />

      {/* Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => navigate(`/${chatUser.username}`)}>
          View Profile
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          Block User
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setDeleteDialogOpen(true);
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          Delete Chat
        </MenuItem>
      </Menu>

      {/* Delete Conversation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Conversation?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this conversation with {chatUser.fullName || chatUser.username}? 
            This action cannot be undone and all messages will be permanently removed from your chat history.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deletingConversation}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConversation}
            color="error"
            variant="contained"
            disabled={deletingConversation}
            startIcon={deletingConversation ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deletingConversation ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        open={postDetailModalOpen}
        onClose={() => {
          setPostDetailModalOpen(false);
          setSelectedPost(null);
        }}
        currentUserId={currentUser?.id}
        isSharedPost={true} // This is always a shared post in chat
      />
    </Box>
  );
};

export default Chat;