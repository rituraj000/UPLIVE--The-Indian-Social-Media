import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Typography,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  InputAdornment,
  Chip,
  Divider,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { usersApi } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Search: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);

  // Debounced search function
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await usersApi.searchUsers(query.trim());
      console.log('🔍 Search results:', response.data);
      const results = response.data?.filter((user: User) => user.id !== currentUser?.id) || [];
      setSearchResults(results);
      
      // Update URL with search query
      if (query.trim()) {
        setSearchParams({ q: query.trim() });
      } else {
        setSearchParams({});
      }
    } catch (error: any) {
      console.error('❌ Search error:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to search users');
      }
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, setSearchParams]);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    try {
      const response = await usersApi.getSuggestions();
      const filteredSuggestions = response.data?.filter((user: User) => user.id !== currentUser?.id) || [];
      setSuggestions(filteredSuggestions.slice(0, 10));
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }, [currentUser?.id]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  // Load suggestions on mount
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadSuggestions();
    }
  }, [searchQuery, loadSuggestions]);

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle user card click
  const handleUserClick = (user: User) => {
    navigate(`/${user.username}`);
  };

  // User Card Component
  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
      onClick={() => handleUserClick(user)}
    >
      <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
        <Avatar
          src={user.profilePicture}
          alt={user.username}
          sx={{ 
            width: { xs: 60, sm: 80 }, 
            height: { xs: 60, sm: 80 }, 
            mx: 'auto', 
            mb: { xs: 1.5, sm: 2 },
            border: 2,
            borderColor: 'primary.main'
          }}
        >
          <PersonIcon sx={{ fontSize: 40 }} />
        </Avatar>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {user.username}
          </Typography>
          {user.isVerified && (
            <VerifiedIcon color="primary" sx={{ fontSize: 20 }} />
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {user.fullName}
        </Typography>
        
        {user.bio && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {user.bio}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>{user.followerCount || 0}</strong> followers
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <strong>{user.postCount || 0}</strong> posts
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ 
      maxWidth: { xs: '100%', sm: 800, md: 1200 }, 
      mx: 'auto', 
      p: { xs: 1, sm: 2 }
    }}>
      {/* Header */}
      <Box sx={{ 
        mb: { xs: 3, sm: 4 }, 
        textAlign: 'center',
        px: { xs: 1, sm: 0 }
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" sx={{ mb: { xs: 1.5, sm: 2 } }}>
          Search
        </Typography>
        <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary" sx={{ mb: { xs: 2, sm: 3 } }}>
          Discover people and connect with friends
        </Typography>
        
        {/* Search Input */}
        <Paper sx={{ 
          maxWidth: { xs: '100%', sm: 500, md: 600 }, 
          mx: 'auto',
          borderRadius: { xs: 2, sm: 1 }
        }}>
          <TextField
            fullWidth
            placeholder="Search for users..."
            value={searchQuery}
            onChange={handleSearchChange}
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
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'grey.50'
              }
            }}
          />
        </Paper>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {/* Search Results */}
      {!loading && searchQuery.trim() && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Search Results for "{searchQuery}"
            {searchResults.length > 0 && (
              <Chip 
                label={`${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'}`}
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
          
          {searchResults.length > 0 ? (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: 3 
            }}>
              {searchResults.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <PersonIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try searching with a different keyword
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Suggestions */}
      {!loading && !searchQuery.trim() && suggestions.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Suggested for You
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 3 
          }}>
            {suggestions.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </Box>
        </Box>
      )}

      {/* Empty State */}
      {!loading && !searchQuery.trim() && suggestions.length === 0 && (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <SearchIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Start searching
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter a username or name to find users
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Search;