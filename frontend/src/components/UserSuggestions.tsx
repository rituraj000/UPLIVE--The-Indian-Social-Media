import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Paper,
  Skeleton,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usersApi, followApi } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const UserSuggestions: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());

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
      console.log('🔍 Fetching suggestions for user:', currentUser.username);
      const response = await usersApi.getSuggestions();
      
      console.log('📡 Suggestions API Response:', {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        length: response.data?.length,
        data: response.data
      });
      
      if (!Array.isArray(response.data)) {
        console.error('❌ API returned non-array data:', response.data);
        setError('Invalid data format received');
        return;
      }
      
      console.log('Current user ID:', currentUser.id);
      console.log('Raw suggestions:', response.data);
      
      // Filter out current user and additional client-side sorting
      const filteredSuggestions = response.data
        .filter((user: User) => {
          console.log('Checking user:', { id: user.id, username: user.username, hasId: !!user.id });
          const isCurrentUser = user.id === currentUser.id;
          if (isCurrentUser) {
            console.log('Filtering out current user:', user.username);
          }
          return !isCurrentUser && !!user.id; // Also filter out users without IDs
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
      console.log('Final suggestions count:', filteredSuggestions.length);
      
      setSuggestions(filteredSuggestions.slice(0, 5)); // Show only 5 suggestions
      setError(null);
    } catch (err: any) {
      console.error('❌ Failed to fetch suggestions:', err);
      console.error('❌ Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        stack: err.stack
      });
      setError(err.response?.data?.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

    fetchSuggestions();
  }, [currentUser]);

  const handleFollow = async (userId: string, username: string) => {
    console.log('🔍 handleFollow called with:', { userId, username, userIdType: typeof userId });
    
    if (!userId) {
      console.error('❌ User ID is missing!');
      toast.error('Unable to follow user - missing user ID');
      return;
    }
    
    if (followLoading.has(userId)) {
      console.log('⏳ Already following this user...');
      return; // Prevent multiple requests
    }
    
    setFollowLoading(prev => new Set(prev).add(userId));
    
    try {
      console.log('🔔 Following user:', { userId, username });
      
      // Use followApi for consistency with other parts of the app
      const response = await followApi.followUser(userId);
      
      console.log('✅ Follow response:', response.data);
      
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(userId);
        return newSet;
      });
      
      // Remove the user from suggestions after following
      setSuggestions(prev => prev.filter(user => user.id !== userId));
      
      // Refresh current user data to update following count
      await refreshUser();
      
      toast.success(`Now following ${username}!`);
      
    } catch (err: any) {
      console.error('❌ Failed to follow user:', err);
      console.error('❌ Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      toast.error(err.response?.data?.message || 'Failed to follow user');
    } finally {
      setFollowLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
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
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          bgcolor: '#1F1F35',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3, 
            fontWeight: 700, 
            color: '#FFFFFF',
            fontSize: '1.2rem'
          }}
        >
          Suggestions for You
        </Typography>
        {[1, 2, 3].map((item) => (
          <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Skeleton 
              variant="circular" 
              width={48} 
              height={48} 
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
            />
            <Box sx={{ ml: 2, flex: 1 }}>
              <Skeleton 
                variant="text" 
                width="60%" 
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
              />
              <Skeleton 
                variant="text" 
                width="40%" 
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
              />
            </Box>
            <Skeleton 
              variant="rectangular" 
              width={68} 
              height={32} 
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2
              }}
            />
          </Box>
        ))}
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          bgcolor: '#1F1F35',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3, 
            fontWeight: 700, 
            color: '#FFFFFF',
            fontSize: '1.2rem'
          }}
        >
          Suggestions for You
        </Typography>
        <Alert 
          severity="info" 
          variant="outlined"
          sx={{
            bgcolor: 'rgba(168, 85, 247, 0.1)',
            borderColor: 'rgba(168, 85, 247, 0.3)',
            color: '#FFFFFF',
            '& .MuiAlert-icon': {
              color: '#A855F7'
            }
          }}
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          bgcolor: '#1F1F35',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3, 
            fontWeight: 700, 
            color: '#FFFFFF',
            fontSize: '1.2rem'
          }}
        >
          Suggestions for You
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          No new suggestions at the moment. Check back later!
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        bgcolor: '#1F1F35',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700, 
            color: '#FFFFFF',
            fontSize: '1.2rem'
          }}
        >
          Suggestions for You
        </Typography>
        <Button 
          size="small" 
          onClick={handleSeeAll}
          sx={{ 
            textTransform: 'none', 
            fontWeight: 600,
            color: '#A855F7',
            fontSize: '0.9rem',
            '&:hover': {
              bgcolor: 'rgba(168, 85, 247, 0.1)',
              color: '#EC4899'
            }
          }}
        >
          See All
        </Button>
      </Box>
      
      {suggestions.map((user) => {
        console.log('🧑 Rendering user:', { 
          user: user, 
          userId: user.id, 
          userIdField: user.id,
          alternativeIds: { _id: (user as any)._id, userId: (user as any).userId }
        });
        
        return (
        <Box 
          key={user.id || (user as any)._id} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
            '&:last-child': { mb: 0 },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 2
            },
            transition: 'background-color 0.2s ease-in-out',
            p: 1,
            mx: -1
          }}
        >
          <Box
            sx={{
              position: 'relative',
              cursor: 'pointer',
              '&:hover .avatar': {
                transform: 'scale(1.05)'
              }
            }}
            onClick={() => handleUserClick(user.username)}
          >
            <Avatar
              src={user.profilePicture}
              alt={user.fullName}
              className="avatar"
              sx={{ 
                width: 48, 
                height: 48,
                background: hasProfilePicture(user) 
                  ? 'none' 
                  : 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1.1rem',
                transition: 'transform 0.2s ease-in-out',
                border: hasProfilePicture(user) 
                  ? '2px solid transparent'
                  : 'none',
                backgroundImage: hasProfilePicture(user) 
                  ? 'linear-gradient(#1F1F35, #1F1F35), linear-gradient(135deg, #A855F7 0%, #EC4899 100%)'
                  : 'none',
                backgroundOrigin: 'border-box',
                backgroundClip: 'content-box, border-box'
              }}
            >
              {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
            </Avatar>
          </Box>
          
          <Box sx={{ ml: 2, flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                '&:hover': {
                  color: '#A855F7'
                },
                transition: 'color 0.2s ease-in-out'
              }}
              onClick={() => handleUserClick(user.username)}
            >
              {user.username}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.85rem'
              }}
            >
              {user.fullName}
            </Typography>
            {user.followerCount > 0 && (
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.75rem'
                }}
              >
                {user.followerCount} {user.followerCount === 1 ? 'follower' : 'followers'}
              </Typography>
            )}
          </Box>
          
          <Button
            variant="text"
            size="small"
            onClick={() => handleFollow(user.id || (user as any)._id, user.username)}
            disabled={followingUsers.has(user.id || (user as any)._id) || followLoading.has(user.id || (user as any)._id)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: followingUsers.has(user.id || (user as any)._id) ? 'rgba(255, 255, 255, 0.5)' : '#FFFFFF',
              minWidth: 'auto',
              px: 2,
              py: 0.5,
              fontSize: '0.85rem',
              background: followingUsers.has(user.id || (user as any)._id) 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
              borderRadius: 2,
              '&:hover': {
                background: followingUsers.has(user.id || (user as any)._id)
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'linear-gradient(135deg, #9333EA 0%, #DB2777 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
              },
              '&:disabled': {
                color: 'rgba(255, 255, 255, 0.5)',
                background: 'rgba(255, 255, 255, 0.1)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {followLoading.has(user.id || (user as any)._id) ? (
              <CircularProgress size={16} sx={{ color: 'white' }} />
            ) : followingUsers.has(user.id || (user as any)._id) ? (
              'Following' 
            ) : (
              'Follow'
            )}
          </Button>
        </Box>
        );
      })}
    </Paper>
  );
};

export default UserSuggestions;