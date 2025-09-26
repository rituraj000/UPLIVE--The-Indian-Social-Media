import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { usersApi } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<User[]>([]);

  // Debounced search function
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await usersApi.searchUsers(query.trim());
      setSearchResults(response.data || []);
    } catch (error: any) {
      console.error('Search error:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to search users');
      }
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed.slice(0, 5));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save to recent searches
  const addToRecentSearches = (user: User) => {
    const updated = [
      user,
      ...recentSearches.filter(u => u.id !== user.id)
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Handle user selection
  const handleUserSelect = (user: User) => {
    addToRecentSearches(user);
    navigate(`/${user.username}`);
    onClose();
    setSearchQuery('');
  };

  // Handle dialog close
  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  // Filter out current user from results
  const filteredResults = searchResults.filter(user => user.id !== currentUser?.id);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: 600,
          position: 'relative'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Typography variant="h6" component="div">
          Search
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Search Input */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                backgroundColor: 'grey.50'
              }
            }}
            autoFocus
          />
        </Box>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Search Results */}
        {!loading && searchQuery.trim() && filteredResults.length > 0 && (
          <List sx={{ pt: 0 }}>
            {filteredResults.map((user, index) => (
              <React.Fragment key={user.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleUserSelect(user)}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={user.profilePicture}
                        alt={user.username}
                        sx={{ width: 50, height: 50 }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {user.username}
                          </Typography>
                          {user.isVerified && (
                            <Chip
                              label="✓"
                              size="small"
                              sx={{
                                backgroundColor: 'primary.main',
                                color: 'white',
                                height: 20,
                                minWidth: 20,
                                '& .MuiChip-label': { px: 0.5 }
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {user.fullName}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < filteredResults.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* No Results */}
        {!loading && searchQuery.trim() && filteredResults.length === 0 && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <PersonIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No users found for "{searchQuery}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try searching for a different username
            </Typography>
          </Box>
        )}

        {/* Recent Searches */}
        {!loading && !searchQuery.trim() && recentSearches.length > 0 && (
          <Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              p: 2,
              borderBottom: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Recent
              </Typography>
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer' }}
                onClick={clearRecentSearches}
              >
                Clear all
              </Typography>
            </Box>
            <List sx={{ pt: 0 }}>
              {recentSearches.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleUserSelect(user)}
                      sx={{
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: 'grey.50'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={user.profilePicture}
                          alt={user.username}
                          sx={{ width: 50, height: 50 }}
                        >
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {user.username}
                            </Typography>
                            {user.isVerified && (
                              <Chip
                                label="✓"
                                size="small"
                                sx={{
                                  backgroundColor: 'primary.main',
                                  color: 'white',
                                  height: 20,
                                  minWidth: 20,
                                  '& .MuiChip-label': { px: 0.5 }
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {user.fullName}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < recentSearches.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {/* Empty State */}
        {!loading && !searchQuery.trim() && recentSearches.length === 0 && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <SearchIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Search for users
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Start typing to find users by username or full name
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;