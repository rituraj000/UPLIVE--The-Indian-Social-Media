import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Card,
  Typography,
  IconButton,
  Avatar,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { usersApi, messagesApi } from '../services/api';
import { Post, User } from '../types';
import toast from 'react-hot-toast';

interface ShareModalProps {
  post: Post | null;
  open: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ post, open, onClose }) => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [following, setFollowing] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch following list when modal opens
  useEffect(() => {
    if (open && currentUser) {
      fetchFollowing();
    } else {
      // Reset state when modal closes
      setSearchQuery('');
      setSelectedUsers(new Set());
      setFollowing([]);
      setFilteredUsers([]);
    }
  }, [open, currentUser]);

  // Filter users based on search query with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        // Search all users when there's a query
        searchUsers(searchQuery.trim());
      } else {
        // Show following users by default
        setFilteredUsers(following);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, following]);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setFilteredUsers(following);
      return;
    }

    setSearching(true);
    try {
      // Use the search endpoint to find all users
      const response = await fetch(`/api/users/search/${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data || []);
        setFilteredUsers(data || []);
      } else {
        // Fallback to filtering following users
        const filtered = following.filter(user =>
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.fullName?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredUsers(filtered);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      // Fallback to filtering following users
      const filtered = following.filter(user =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    } finally {
      setSearching(false);
    }
  };

  const fetchFollowing = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await usersApi.getProfile(currentUser.username);
      setFollowing(response.data.following || []);
    } catch (error) {
      console.error('Error fetching following list:', error);
      toast.error('Failed to load following list');
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSharePost = async () => {
    if (!post || !currentUser || selectedUsers.size === 0) return;

    setSending(true);
    try {
      // Check if post owner has private account and validate recipients
      const postOwner = post.user;
      const selectedUsersList = Array.from(selectedUsers);
      
      if (postOwner.isPrivate) {
        // For private accounts, check if all selected users are followers of the post owner
        const invalidUsers: string[] = [];
        
        for (const userId of selectedUsersList) {
          const user = following.find(u => u.id === userId);
          if (user && !postOwner.followers?.some(follower => follower.id === userId)) {
            invalidUsers.push(user.username);
          }
        }
        
        if (invalidUsers.length > 0) {
          toast.error(
            `Cannot share private post with: ${invalidUsers.join(', ')}. They must follow @${postOwner.username} first.`
          );
          setSending(false);
          return;
        }
      }

      // Send post to selected users
      const sharePromises = selectedUsersList.map(async (userId) => {
        try {
          // Create a message with the shared post
          const formData = new FormData();
          formData.append('postId', post.id);
          formData.append('text', `Shared a post from @${post.user.username}`);
          
          await messagesApi.sendMessage(userId, formData);
        } catch (error) {
          console.error(`Failed to send post to user ${userId}:`, error);
          throw error;
        }
      });

      await Promise.all(sharePromises);
      
      const userCount = selectedUsers.size;
      toast.success(`Post shared with ${userCount} ${userCount === 1 ? 'person' : 'people'}!`);
      onClose();
      
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Failed to share post');
    } finally {
      setSending(false);
    }
  };

  if (!post) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 500,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Share Post
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Post Preview */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar
              src={post.user.profilePicture}
              sx={{ width: 32, height: 32 }}
            >
              {post.user.username[0].toUpperCase()}
            </Avatar>
            <Typography variant="subtitle2" fontWeight="bold">
              @{post.user.username}
            </Typography>
            {post.user.isPrivate && (
              <Chip 
                label="Private" 
                size="small" 
                variant="outlined" 
                color="warning"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>
          {post.caption && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {post.caption.length > 60 ? `${post.caption.substring(0, 60)}...` : post.caption}
            </Typography>
          )}
        </Box>

        {/* Search Bar */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <TextField
            fullWidth
            placeholder="Search all users to share with..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            helperText={searchQuery.trim() ? "Searching all users..." : "Showing people you follow"}
            InputProps={{
              startAdornment: searching ? (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              ) : (
                <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            }}
          />
        </Box>

        {/* Selected Users */}
        {selectedUsers.size > 0 && (
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Selected ({selectedUsers.size}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Array.from(selectedUsers).map(userId => {
                const user = following.find(u => u.id === userId);
                return user ? (
                  <Chip
                    key={userId}
                    label={user.username}
                    size="small"
                    onDelete={() => handleUserToggle(userId)}
                    avatar={<Avatar src={user.profilePicture} sx={{ width: 20, height: 20 }} />}
                  />
                ) : null;
              })}
            </Box>
          </Box>
        )}

        {/* Users List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 200, maxHeight: 300 }}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200,
              }}
            >
              <CircularProgress />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? 'No users found' : 'You are not following anyone yet'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {filteredUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                    />
                    <ListItemAvatar>
                      <Avatar src={user.profilePicture} sx={{ width: 40, height: 40 }}>
                        {user.username[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.username}
                      secondary={user.fullName}
                    />
                  </ListItem>
                  {index < filteredUsers.length - 1 && <Divider variant="inset" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Send Button */}
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={handleSharePost}
            disabled={selectedUsers.size === 0 || sending}
            sx={{ py: 1.5 }}
          >
            {sending 
              ? 'Sharing...' 
              : `Share with ${selectedUsers.size} ${selectedUsers.size === 1 ? 'person' : 'people'}`
            }
          </Button>
        </Box>
      </Card>
    </Modal>
  );
};

export default ShareModal;