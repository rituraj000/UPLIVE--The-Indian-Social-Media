import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  IconButton,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { messagesApi, usersApi } from '../services/api';
import { Conversation, User } from '../types';
import Chat from '../components/Chat';
import toast from 'react-hot-toast';

const Messages: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle direct navigation to specific user chat
  useEffect(() => {
    const handleDirectChat = async () => {
      if (username && currentUser && !loading) {
        console.log('Handling direct chat for username:', username);
        
        // First try to find existing conversation
        const existingConversation = conversations.find(
          conv => conv.user.username.toLowerCase() === username.toLowerCase()
        );
        
        if (existingConversation) {
          console.log('Found existing conversation');
          setSelectedUser(existingConversation.user);
          setShowChat(true);
          setShowChatView(true);
          setShowSearch(false);
        } else {
          // If no existing conversation, search for the user immediately
          console.log('No existing conversation, searching for user:', username);
          try {
            const response = await usersApi.searchUsers(username);
            const foundUser = response.data.find(
              (user: User) => user.username.toLowerCase() === username.toLowerCase()
            );
            
            if (foundUser) {
              console.log('Found user:', foundUser.username);
              setSelectedUser(foundUser);
              setShowChat(true);
              setShowChatView(true);
              setShowSearch(false);
            } else {
              console.log('User not found in search results');
              toast.error(`User @${username} not found`);
              navigate('/messages');
            }
          } catch (error) {
            console.error('Error finding user:', error);
            toast.error(`Could not find user @${username}`);
            navigate('/messages');
          }
        }
      }
    };

    // Only run this effect when we have the username and user is loaded
    // Don't wait for conversations to be loaded if we're looking for a specific user
    if (username && currentUser) {
      if (conversations.length > 0) {
        // If conversations are loaded, run immediately
        handleDirectChat();
      } else if (!loading) {
        // If no conversations but loading is done, also run (user might have no conversations)
        handleDirectChat();
      }
    }
  }, [username, currentUser, conversations, loading, navigate]);

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await messagesApi.getConversations();
      setConversations(response.data || []);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Search users for new conversation
  const handleSearchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await usersApi.searchUsers(query.trim());
      const filteredResults = response.data.filter((user: User) => user.id !== currentUser?.id);
      setSearchResults(filteredResults);
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedUser(conversation.user);
    setShowChat(true);
    setShowChatView(true);
    setShowSearch(false);
  };

  const handleNewChatClick = (user: User) => {
    setSelectedUser(user);
    setShowChat(true);
    setShowChatView(true);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleBackToList = () => {
    setShowChat(false);
    setShowChatView(false);
    setSelectedUser(null);
    navigate('/messages');
    // Refresh conversations when returning to list
    fetchConversations();
  };

  // Handle conversation deletion (refresh the list)
  const handleConversationDeleted = () => {
    fetchConversations();
    handleBackToList();
  };

  // Handle "Send Message" button click - activate search mode
  const handleStartNewMessage = () => {
    setShowSearch(true);
    setSearchQuery('');
    setSearchResults([]);
    // Focus search input after state update
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: { xs: 'calc(100vh - 160px)', md: 'calc(100vh - 80px)' }, // Account for bottom nav on mobile
      display: 'flex', 
      flexDirection: 'column', 
      p: { xs: 0, sm: 1 }
    }}>
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        maxWidth: '1200px',
        mx: 'auto',
        width: '100%',
        height: '100%',
        border: { xs: 0, sm: 1 },
        borderColor: 'divider',
        borderRadius: { xs: 0, sm: 2 },
        overflow: 'hidden'
      }}>
        {/* Left Panel - Conversations List */}
        <Paper 
          sx={{ 
            width: { xs: showChatView ? 0 : '100%', md: '350px' },
            display: { xs: showChatView ? 'none' : 'block', md: 'block' },
            borderRadius: 0,
            borderRight: 1,
            borderColor: 'divider'
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Messages
              </Typography>
              <IconButton size="small" onClick={handleStartNewMessage}>
                <AddIcon />
              </IconButton>
            </Box>
            
            {/* Search Input */}
            <TextField
              ref={searchInputRef}
              fullWidth
              placeholder={showSearch ? "Search users to message..." : "Search conversations..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3 }
              }}
            />
          </Box>

          {/* Search Results - Show when search mode is active */}
          {showSearch && (
            <Box>
              {searching && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              
              {!searching && searchResults.length > 0 && (
                <List sx={{ pt: 0 }}>
                  <ListItem>
                    <Typography variant="subtitle2" color="text.secondary">
                      Search Results
                    </Typography>
                  </ListItem>
                  {searchResults.map((user) => (
                    <ListItem key={user.id} disablePadding>
                      <ListItemButton onClick={() => handleNewChatClick(user)}>
                        <ListItemAvatar>
                          <Avatar src={user.profilePicture} alt={user.username}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.username}
                          secondary={user.fullName}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
              
              {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No users found
                  </Typography>
                </Box>
              )}
              
              {!searching && searchResults.length === 0 && searchQuery.length < 2 && showSearch && (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Type a username to search for users
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Regular Conversations List */}
          {!showSearch && (
            <>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : conversations.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No conversations yet
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Search for users to start messaging
                  </Typography>
                </Box>
              ) : (
                <List sx={{ pt: 0 }}>
                  {conversations.map((conversation) => (
                    <ListItem key={conversation.user.id} disablePadding>
                      <ListItemButton 
                        onClick={() => handleConversationClick(conversation)}
                        selected={selectedUser?.id === conversation.user.id}
                      >
                        <ListItemAvatar>
                          <Avatar src={conversation.user.profilePicture} alt={conversation.user.username}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={conversation.user.username}
                          secondary="Click to open chat"
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </Paper>

        {/* Right Panel - Chat Area */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {showChat && selectedUser ? (
            <Chat
              key={selectedUser.id}
              selectedUser={selectedUser}
              onBackToList={handleBackToList}
              onMessagesRead={fetchConversations}
              onConversationDeleted={handleConversationDeleted}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              flexDirection: 'column'
            }}>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                Your Messages
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Send private messages to friends
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleStartNewMessage}
              >
                Send Message
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Messages;
