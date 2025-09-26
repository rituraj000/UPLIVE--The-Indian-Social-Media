import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import { Close as CloseIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { followApi, usersApi } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface FollowersModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  title: string;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  open,
  onClose,
  userId,
  type,
  title
}) => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [removingFollower, setRemovingFollower] = useState<Set<string>>(new Set());

  // Navigate to user profile
  const handleProfileClick = (username: string) => {
    navigate(`/${username}`);
    onClose(); // Close the modal when navigating
  };

  useEffect(() => {
    if (open && userId) {
      fetchUsers();
    }
  }, [open, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let response;
      if (type === 'followers') {
        response = await followApi.getFollowers(userId);
      } else {
        response = await followApi.getFollowing(userId);
      }
      
      console.log(`${type} response:`, response.data);
      setUsers(response.data || []);
      
      // Get current user's following list to determine follow status
      if (user) {
        try {
          const currentUserFollowing = await followApi.getFollowing(user.id);
          const followingSet = new Set<string>();
          
          // Create a set of user IDs that current user is following
          (currentUserFollowing.data || []).forEach((followedUser: User) => {
            followingSet.add(followedUser.id);
          });
          
          setFollowingUsers(followingSet);
          console.log('Current user following:', Array.from(followingSet));
        } catch (error) {
          console.error('Error fetching current user following:', error);
          setFollowingUsers(new Set());
        }
      }
    } catch (error: any) {
      console.error(`Failed to fetch ${type}:`, error);
      toast.error(`Failed to load ${type}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user || targetUserId === user.id) return;

    try {
      const isCurrentlyFollowing = followingUsers.has(targetUserId);
      
      if (isCurrentlyFollowing) {
        await followApi.unfollowUser(targetUserId);
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });
        toast.success('Unfollowed successfully');
      } else {
        await followApi.followUser(targetUserId);
        setFollowingUsers(prev => new Set(prev).add(targetUserId));
        toast.success('Followed successfully');
      }
      
      // Refresh user data to update counts
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error: any) {
      console.error('Follow toggle error:', error);
      toast.error(error.response?.data?.message || 'Failed to update follow status');
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!user || removingFollower.has(followerId)) return;

    setRemovingFollower(prev => new Set(prev).add(followerId));
    try {
      await usersApi.removeFollower(followerId);
      
      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== followerId));
      
      toast.success('Follower removed successfully');
      
      // Refresh user data to update counts
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error: any) {
      console.error('Remove follower error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove follower');
    } finally {
      setRemovingFollower(prev => {
        const newSet = new Set(prev);
        newSet.delete(followerId);
        return newSet;
      });
    }
  };

  const renderActionButton = (targetUser: User) => {
    // Don't show buttons for current user themselves
    if (!user || targetUser.id === user.id) return null;
    
    const isOwnFollowersList = user.id === userId && type === 'followers';
    const isFollowing = followingUsers.has(targetUser.id);
    const isRemoving = removingFollower.has(targetUser.id);
    
    console.log(`Rendering button for ${targetUser.username}:`, {
      isOwnFollowersList,
      isFollowing,
      followingUsers: Array.from(followingUsers),
      targetUserId: targetUser.id
    });
    
    if (isOwnFollowersList) {
      // For own followers list, show both Follow (if not following back) and Remove buttons
      return (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Follow Back Button - Show if not following this user back */}
          {!isFollowing && (
            <Button
              variant="contained"
              size="small"
              onClick={() => handleFollowToggle(targetUser.id)}
              startIcon={<PersonAddIcon />}
              sx={{ textTransform: 'none' }}
            >
              Follow
            </Button>
          )}
          
          {/* Remove Follower Button */}
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => handleRemoveFollower(targetUser.id)}
            disabled={isRemoving}
            sx={{ textTransform: 'none' }}
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </Button>
        </Box>
      );
    } else {
      // Show Follow/Following button for other cases
      return (
        <Button
          variant={isFollowing ? "outlined" : "contained"}
          size="small"
          onClick={() => handleFollowToggle(targetUser.id)}
          startIcon={!isFollowing ? <PersonAddIcon /> : undefined}
          sx={{ textTransform: 'none' }}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No {type} yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {users.map((targetUser, index) => (
              <React.Fragment key={targetUser.id}>
                <ListItem 
                  sx={{ 
                    py: 2,
                    px: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <ListItemAvatar>
                      <Avatar 
                        src={targetUser.profilePicture} 
                        alt={targetUser.username}
                        sx={{ 
                          width: 44, 
                          height: 44,
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.8 }
                        }}
                        onClick={() => handleProfileClick(targetUser.username)}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          '& .MuiTypography-root': { color: 'primary.main' }
                        }
                      }}
                      onClick={() => handleProfileClick(targetUser.username)}
                      primary={
                        <Typography variant="subtitle1" fontWeight="medium">
                          {targetUser.username}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {targetUser.fullName}
                          {targetUser.bio && ` • ${targetUser.bio.substring(0, 50)}${targetUser.bio.length > 50 ? '...' : ''}`}
                        </Typography>
                      }
                    />
                  </Box>
                  
                  <Box sx={{ ml: 2 }}>
                    {renderActionButton(targetUser)}
                  </Box>
                </ListItem>
                
                {index < users.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FollowersModal;