import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Paper,
  Skeleton,
  Alert,
  Container,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

const SuggestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  // Helper function to check if user has a real profile picture
  const hasProfilePicture = (user: User): boolean => {
    return !!(
      user.profilePicture && 
      user.profilePicture !== '' && 
      !user.profilePicture.includes('default-avatar.png')
    );
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentUser) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        // Fetch ALL users instead of just suggestions
        const response = await usersApi.getAllUsers();
        
        // Filter out current user and sort users to prioritize users with profile pictures
        const filteredAndSortedUsers = response.data
          .filter((user: User) => user.id !== currentUser.id) // Extra safety check
          .sort((a: User, b: User) => {
            const aHasProfilePic = hasProfilePicture(a);
            const bHasProfilePic = hasProfilePicture(b);
            
            // First priority: Profile picture
            if (aHasProfilePic && !bHasProfilePic) return -1;
            if (!aHasProfilePic && bHasProfilePic) return 1;
            
            // Second priority: Follower count
            return (b.followerCount || 0) - (a.followerCount || 0);
          });
        
        setSuggestions(filteredAndSortedUsers);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch suggestions:', err);
        setError('Failed to load suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentUser, navigate]);

  const handleFollow = async (userId: string) => {
    try {
      await usersApi.followUser(userId);
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(userId);
        return newSet;
      });
      
      // Remove the user from suggestions after following
      setSuggestions(prev => prev.filter(user => user.id !== userId));
    } catch (err: any) {
      console.error('Failed to follow user:', err);
    }
  };

  const handleUserClick = (username: string) => {
    navigate(`/${username}`);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Discover People
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2 
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <Card key={item} sx={{ textAlign: 'center', p: 2 }}>
              <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
              <Skeleton variant="text" width="60%" sx={{ mx: 'auto' }} />
              <Skeleton variant="text" width="40%" sx={{ mx: 'auto' }} />
              <Skeleton variant="rectangular" width={100} height={35} sx={{ mx: 'auto', mt: 2 }} />
            </Card>
          ))}
        </Box>
      ) : error ? (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      ) : suggestions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Users Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No other users are available at the moment. Check back later!
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2 
        }}>
          {suggestions.map((user) => (
            <Card 
              key={user.id}
              sx={{ 
                textAlign: 'center', 
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
            >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Avatar
                    src={user.profilePicture}
                    alt={user.fullName}
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mx: 'auto', 
                      mb: 2,
                      cursor: 'pointer',
                      border: '3px solid',
                      borderColor: hasProfilePicture(user) ? 'primary.main' : 'grey.300',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 2
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onClick={() => handleUserClick(user.username)}
                  >
                    {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline'
                      },
                      mb: 1
                    }}
                    onClick={() => handleUserClick(user.username)}
                  >
                    {user.username}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {user.fullName}
                  </Typography>
                  
                  {user.followerCount > 0 && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {user.followerCount} {user.followerCount === 1 ? 'follower' : 'followers'}
                    </Typography>
                  )}
                  
                  <Box sx={{ mt: 'auto' }}>
                    <Button
                      variant={followingUsers.has(user.id) ? "outlined" : "contained"}
                      fullWidth
                      onClick={() => handleFollow(user.id)}
                      disabled={followingUsers.has(user.id)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2
                      }}
                    >
                      {followingUsers.has(user.id) ? 'Following' : 'Follow'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default SuggestionsPage;