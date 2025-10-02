import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Paper,
  Skeleton,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

const UserSuggestions: React.FC = () => {
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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await usersApi.getSuggestions();
      
      console.log('Current user ID:', currentUser.id);
      console.log('Raw suggestions:', response.data.map((u: User) => ({ id: u.id, username: u.username })));
      
      // Filter out current user and additional client-side sorting
      const filteredSuggestions = response.data
        .filter((user: User) => {
          const isCurrentUser = user.id === currentUser.id;
          if (isCurrentUser) {
            console.log('Filtering out current user:', user.username);
          }
          return !isCurrentUser;
        })
        .sort((a: User, b: User) => {
          const aHasProfilePic = hasProfilePicture(a);
          const bHasProfilePic = hasProfilePicture(b);
          
          // First priority: Profile picture
          if (aHasProfilePic && !bHasProfilePic) return -1;
          if (!aHasProfilePic && bHasProfilePic) return 1;
          
          // Second priority: Follower count
          return (b.followerCount || 0) - (a.followerCount || 0);
        });
      
      console.log('Filtered suggestions:', filteredSuggestions.map((u: User) => ({ id: u.id, username: u.username })));
      setSuggestions(filteredSuggestions.slice(0, 5)); // Show only 5 suggestions
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch suggestions:', err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

    fetchSuggestions();
  }, [currentUser]);

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

  const handleSeeAll = () => {
    navigate('/suggestions');
  };

  // Don't show suggestions if user is not logged in
  if (!currentUser) {
    return null;
  }

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
          Suggestions for You
        </Typography>
        {[1, 2, 3].map((item) => (
          <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ ml: 2, flex: 1 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
            <Skeleton variant="rectangular" width={60} height={30} />
          </Box>
        ))}
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
          Suggestions for You
        </Typography>
        <Alert severity="info" variant="outlined">{error}</Alert>
      </Paper>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
          Suggestions for You
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No new suggestions at the moment. Check back later!
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Suggestions for You
        </Typography>
        <Button 
          size="small" 
          onClick={handleSeeAll}
          sx={{ 
            textTransform: 'none', 
            fontWeight: 600,
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'transparent'
            }
          }}
        >
          See All
        </Button>
      </Box>
      
      {suggestions.map((user) => (
        <Box 
          key={user.id} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            '&:last-child': { mb: 0 }
          }}
        >
          <Avatar
            src={user.profilePicture}
            alt={user.fullName}
            sx={{ 
              width: 40, 
              height: 40,
              cursor: 'pointer',
              border: hasProfilePicture(user) ? '2px solid #1976d2' : 'none',
              '&:hover': {
                opacity: 0.8,
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
            onClick={() => handleUserClick(user.username)}
          >
            {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
          </Avatar>
          
          <Box sx={{ ml: 2, flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
              onClick={() => handleUserClick(user.username)}
            >
              {user.username}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {user.fullName}
            </Typography>
            {user.followerCount > 0 && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                {user.followerCount} {user.followerCount === 1 ? 'follower' : 'followers'}
              </Typography>
            )}
          </Box>
          
          <Button
            variant="text"
            size="small"
            onClick={() => handleFollow(user.id)}
            disabled={followingUsers.has(user.id)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: followingUsers.has(user.id) ? 'text.secondary' : 'primary.main',
              minWidth: 'auto',
              px: 1,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            {followingUsers.has(user.id) ? 'Following' : 'Follow'}
          </Button>
        </Box>
      ))}
    </Paper>
  );
};

export default UserSuggestions;