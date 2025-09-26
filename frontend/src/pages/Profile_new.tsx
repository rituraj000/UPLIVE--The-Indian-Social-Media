import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Divider,
  CardMedia
} from '@mui/material';
import {
  PhotoCamera,
  Edit as EditIcon,
  Settings as SettingsIcon,
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
import { Post } from '../types';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    website: user?.website || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user posts function
  const fetchUserPosts = async () => {
    if (!user) return;
    
    setPostsLoading(true);
    try {
      // Try to get current user's profile first
      const userResponse = await usersApi.getProfile(user.username);
      console.log('User profile response:', userResponse.data);
      
      if (userResponse.data.posts && userResponse.data.posts.length > 0) {
        console.log('Posts from user profile:', userResponse.data.posts);
        setUserPosts(userResponse.data.posts);
      } else {
        // If no posts in profile, try direct posts API
        console.log('No posts in user profile, trying direct API...');
        const postsResponse = await usersApi.getUserPosts(user.id);
        console.log('Posts from direct API:', postsResponse.data);
        setUserPosts(postsResponse.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch user posts:', error);
      // Try the direct API as fallback
      try {
        const postsResponse = await usersApi.getUserPosts(user.id);
        setUserPosts(postsResponse.data);
      } catch (fallbackError: any) {
        console.error('Fallback API also failed:', fallbackError);
        toast.error('Failed to load posts');
      }
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch user posts on component mount
  useEffect(() => {
    fetchUserPosts();
  }, [user]);

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Image size should not exceed 100MB');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await usersApi.updateProfile(formData);
      updateUser(response.data);
      toast.success('Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Update profile picture error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updateData = new FormData();
      updateData.append('fullName', formData.fullName);
      updateData.append('bio', formData.bio);
      updateData.append('website', formData.website);

      const response = await usersApi.updateProfile(updateData);
      updateUser(response.data);
      toast.success('Profile updated successfully!');
      setEditOpen(false);
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = () => {
    setFormData({
      fullName: user?.fullName || '',
      bio: user?.bio || '',
      website: user?.website || '',
    });
    setEditOpen(true);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          {/* Profile Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 3 }}>
            {/* Profile Picture */}
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={user?.profilePicture}
                alt={user?.username}
                sx={{ width: 120, height: 120 }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                style={{ display: 'none' }}
              />
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : <PhotoCamera />}
              </IconButton>
            </Box>

            {/* Profile Info */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                <Typography variant="h4" component="h1">
                  {user?.username}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditOpen}
                >
                  Edit Profile
                </Button>
                <IconButton>
                  <SettingsIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
                <Typography variant="body1">
                  <strong>{user?.postCount || 0}</strong> posts
                </Typography>
                <Typography variant="body1">
                  <strong>{user?.followerCount || 0}</strong> followers
                </Typography>
                <Typography variant="body1">
                  <strong>{user?.followingCount || 0}</strong> following
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ mb: 1 }}>
                {user?.fullName}
              </Typography>
              {user?.bio && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {user.bio}
                </Typography>
              )}
              {user?.website && (
                <Typography 
                  variant="body2" 
                  component="a" 
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: 'primary.main', textDecoration: 'none' }}
                >
                  {user.website}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Posts Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhotoCamera /> Posts ({userPosts.length})
              </Typography>
              <IconButton onClick={fetchUserPosts} disabled={postsLoading}>
                <RefreshIcon />
              </IconButton>
            </Box>

            {postsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : userPosts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PhotoCamera sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No posts yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  When you share photos and videos, they will appear on your profile.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1
              }}>
                {userPosts.map((post) => (
                  <Box key={post.id}>
                    <Card 
                      sx={{ 
                        position: 'relative',
                        aspectRatio: '1/1',
                        cursor: 'pointer',
                        '&:hover': {
                          '& .overlay': {
                            opacity: 1
                          }
                        }
                      }}
                    >
                      <CardMedia
                        component={post.media[0]?.type === 'video' ? 'video' : 'img'}
                        image={post.media[0]?.url}
                        src={post.media[0]?.type === 'video' ? post.media[0]?.url : undefined}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      
                      {/* Hover Overlay */}
                      <Box
                        className="overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                          opacity: 0,
                          transition: 'opacity 0.2s ease'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'white' }}>
                          <FavoriteIcon />
                          <Typography variant="body2">{post.likeCount || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'white' }}>
                          <CommentIcon />
                          <Typography variant="body2">{post.commentCount || 0}</Typography>
                        </Box>
                      </Box>

                      {/* Video indicator */}
                      {post.media[0]?.type === 'video' && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: 'white',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 1,
                            p: 0.5
                          }}
                        >
                          <PlayArrowIcon sx={{ fontSize: 16 }} />
                        </Box>
                      )}

                      {/* Multiple media indicator */}
                      {post.media.length > 1 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            color: 'white',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 1,
                            p: 0.5,
                            fontSize: 12
                          }}
                        >
                          📷 {post.media.length}
                        </Box>
                      )}
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.fullName}
            onChange={handleFormChange('fullName')}
            margin="normal"
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Bio"
            value={formData.bio}
            onChange={handleFormChange('bio')}
            margin="normal"
            multiline
            rows={3}
            variant="outlined"
            inputProps={{ maxLength: 150 }}
            helperText={`${formData.bio.length}/150`}
          />
          <TextField
            fullWidth
            label="Website"
            value={formData.website}
            onChange={handleFormChange('website')}
            margin="normal"
            variant="outlined"
            placeholder="https://example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;