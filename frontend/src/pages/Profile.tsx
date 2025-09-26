import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CardMedia,
  useTheme,
  useMediaQuery,
  InputAdornment
} from '@mui/material';
import {
  PhotoCamera,
  Edit as EditIcon,
  Settings as SettingsIcon,
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Message as MessageIcon,
  Lock as LockIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { usersApi, followApi, storiesApi } from '../services/api';
import { Post, User, Story } from '../types';
import toast from 'react-hot-toast';
import PostDetailModal from '../components/PostDetailModal';
import FollowersModal from '../components/FollowersModal';

const Profile: React.FC = () => {
  const { user: currentUser, updateUser, refreshUser } = useAuth();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // State for the profile being viewed (could be current user or another user)
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postDetailOpen, setPostDetailOpen] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [canMessage, setCanMessage] = useState(false);
  const [checkingMutualFollow, setCheckingMutualFollow] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followRequestSent, setFollowRequestSent] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    website: '',
    username: '',
  });
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: '' });
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if both users follow each other (mutual follow) and current follow status
  const checkFollowStatus = async (otherUserId: string) => {
    if (!currentUser) return { isFollowing: false, canMessage: false };
    
    setCheckingMutualFollow(true);
    try {
      // Check if current user follows the other user
      const currentUserFollowsResponse = await followApi.isFollowing(otherUserId);
      const currentUserFollows = currentUserFollowsResponse.data.following;
      
      setIsFollowing(currentUserFollows);
      
      // Check if a follow request was sent
      if (!currentUserFollows) {
        try {
          const followRequestResponse = await usersApi.checkFollowRequestSent(otherUserId);
          setFollowRequestSent(followRequestResponse.data.requestSent);
        } catch (error) {
          console.error('Error checking follow request status:', error);
          setFollowRequestSent(false);
        }
        return { isFollowing: false, canMessage: false };
      }
      
      // Get the other user's following list to check if they follow current user
      const otherUserFollowingResponse = await followApi.getFollowing(otherUserId);
      const otherUserFollows = otherUserFollowingResponse.data.some((user: User) => user.id === currentUser.id);
      
      const mutualFollow = currentUserFollows && otherUserFollows;
      
      return { isFollowing: currentUserFollows, canMessage: mutualFollow };
    } catch (error) {
      console.error('Error checking follow status:', error);
      return { isFollowing: false, canMessage: false };
    } finally {
      setCheckingMutualFollow(false);
    }
  };

  // Fetch user profile based on username parameter
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      
      setProfileLoading(true);
      try {
        // Check if this is the current user's profile
        // If no username provided, or username matches current user
        const isOwn = !username || username === currentUser.username;
        setIsOwnProfile(isOwn);
        
        if (isOwn) {
          // Use current user data for own profile
          setProfileUser(currentUser);
          setFormData({
            fullName: currentUser.fullName || '',
            bio: currentUser.bio || '',
            website: currentUser.website || '',
            username: currentUser.username || '',
          });
          setCanMessage(false);
        } else {
          // Fetch other user's profile
          const response = await usersApi.getProfile(username!);
          const userData = response.data;
          setProfileUser(userData);
          
          // Use the new backend response fields
          if (userData.isFollowing !== undefined) {
            setIsFollowing(userData.isFollowing);
          }
          
          if (userData.hasRequestedToFollow !== undefined) {
            setFollowRequestSent(userData.hasRequestedToFollow);
          }
          
          // Check follow status and messaging possibility if not already provided
          if (userData.isFollowing === undefined) {
            const followStatus = await checkFollowStatus(userData.id);
            setCanMessage(followStatus.canMessage);
            setIsFollowing(followStatus.isFollowing);
          } else {
            // If following, check if mutual for messaging
            if (userData.isFollowing) {
              const followStatus = await checkFollowStatus(userData.id);
              setCanMessage(followStatus.canMessage);
            } else {
              setCanMessage(false);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Only show error if we're not updating username (which would cause a redirect)
        if (!isUpdatingUsername) {
          toast.error('User not found');
        }
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [username, currentUser]);

  // Fetch user posts function
  const fetchUserPosts = async () => {
    if (!profileUser) return;
    
    setPostsLoading(true);
    try {
      console.log('Fetching posts for user:', profileUser.username, 'ID:', profileUser.id);
      
      // Try to get user's profile first
      const userResponse = await usersApi.getProfile(profileUser.username);
      console.log('User profile response:', userResponse.data);
      
      if (userResponse.data.posts && userResponse.data.posts.length > 0) {
        console.log('Posts from user profile:', userResponse.data.posts);
        setUserPosts(userResponse.data.posts);
      } else {
        // If no posts in profile, try direct posts API
        console.log('No posts in user profile, trying direct API...');
        try {
          const postsResponse = await usersApi.getUserPosts(profileUser.id);
          console.log('Posts from direct API:', postsResponse.data);
          setUserPosts(postsResponse.data);
        } catch (directApiError: any) {
          // Handle private account access
          if (directApiError.response?.status === 403) {
            console.log('Private account - access denied');
            setUserPosts([]);
          } else {
            console.log('Direct API not available, user has no posts');
            setUserPosts([]);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch user posts:', error);
      // Handle private account access
      if (error.response?.status === 403) {
        console.log('Private account - posts not accessible');
        setUserPosts([]);
      } else {
        toast.error('Failed to load posts');
        setUserPosts([]);
      }
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch user stories function
  const fetchUserStories = async () => {
    if (!profileUser) return;
    
    setStoriesLoading(true);
    try {
      const response = await storiesApi.getUserStories(profileUser.id);
      setUserStories(response.data.stories);
    } catch (error: any) {
      console.error('Failed to fetch user stories:', error);
      if (error.response?.status === 403) {
        console.log('Cannot access this user\'s stories');
        setUserStories([]);
      } else {
        setUserStories([]);
      }
    } finally {
      setStoriesLoading(false);
    }
  };

  // Fetch user stories when profileUser changes
  useEffect(() => {
    fetchUserStories();
  }, [profileUser]);

  // Handle story click
  const handleStoryClick = () => {
    if (userStories.length > 0) {
      setCurrentStoryIndex(0);
      setStoryViewerOpen(true);
    }
  };

  // Fetch user posts when profileUser changes
  useEffect(() => {
    fetchUserPosts();
  }, [profileUser]);

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('profilePicture', file);

        const response = await usersApi.updateProfile(formData);
        updateUser(response.data);
        setProfileUser(response.data);
        toast.success('Profile picture updated!');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to update profile picture');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // If changing username, validate it
    if (field === 'username') {
      validateUsername(value);
    }
  };

  const validateUsername = async (username: string) => {
    if (!username || username === profileUser?.username) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }

    // Basic validation
    if (username.length < 3) {
      setUsernameStatus({ 
        checking: false, 
        available: false, 
        message: 'Username must be at least 3 characters' 
      });
      return;
    }

    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      setUsernameStatus({ 
        checking: false, 
        available: false, 
        message: 'Username can only contain letters, numbers, dots, and underscores' 
      });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: 'Checking availability...' });

    try {
      const response = await usersApi.checkUsername(username);
      setUsernameStatus({
        checking: false,
        available: response.data.available,
        message: response.data.message
      });
    } catch (error) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Error checking username availability'
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!isOwnProfile) return;

    // Check if username is valid (if changed)
    const isUsernameChanged = formData.username !== profileUser?.username;
    if (isUsernameChanged) {
      if (!usernameStatus.available) {
        toast.error('Please choose a valid and available username');
        return;
      }
      setIsUpdatingUsername(true);
    }
    
    setLoading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('fullName', formData.fullName);
      formDataObj.append('bio', formData.bio);
      formDataObj.append('website', formData.website);
      
      // Only include username if it's changed
      if (isUsernameChanged) {
        formDataObj.append('username', formData.username);
      }
      
      const updatedUser = await usersApi.updateProfile(formDataObj);
      updateUser(updatedUser.data);
      setProfileUser(updatedUser.data);
      toast.success('Profile updated successfully!');
      setEditOpen(false);
      
      // If username was changed, redirect to new profile URL
      if (isUsernameChanged) {
        navigate(`/${updatedUser.data.username}`, { replace: true });
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
      setIsUpdatingUsername(false);
    } finally {
      setLoading(false);
      if (!isUsernameChanged) {
        setIsUpdatingUsername(false);
      }
    }
  };

  const handleEdit = () => {
    if (!isOwnProfile || !profileUser) return;
    
    setFormData({
      fullName: profileUser.fullName || '',
      bio: profileUser.bio || '',
      website: profileUser.website || '',
      username: profileUser.username || '',
    });
    setUsernameStatus({ checking: false, available: null, message: '' });
    setEditOpen(true);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setPostDetailOpen(true);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setUserPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
    setSelectedPost(updatedPost);
  };

  const handlePostDeleted = (postId: string) => {
    setUserPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    setPostDetailOpen(false);
    setSelectedPost(null);
  };

  const handleMessageUser = () => {
    if (profileUser) {
      // Navigate to messages with the user
      navigate(`/messages/${profileUser.username}`);
    }
  };

  const handleFollowToggle = async () => {
    if (!profileUser || !currentUser || isOwnProfile || followLoading) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow user
        await followApi.unfollowUser(profileUser.id);
        setIsFollowing(false);
        setCanMessage(false);
        toast.success(`Unfollowed ${profileUser.username}`);
        
        setProfileUser(prev => prev ? { ...prev, followerCount: (prev.followerCount || 0) - 1 } : null);
      } else if (followRequestSent) {
        // Cancel follow request (for private accounts)
        await usersApi.cancelFollowRequest(profileUser.id);
        setFollowRequestSent(false);
        toast.success('Follow request cancelled');
      } else {
        // Follow user or send follow request
        const response = await usersApi.followUser(profileUser.id);
        
        if (response.data.requested || response.data.requestSent) {
          // Private account - request sent
          setFollowRequestSent(true);
          toast.success(`Follow request sent to ${profileUser.username}`);
        } else if (response.data.following) {
          // Public account - immediate follow
          setIsFollowing(true);
          toast.success(`Following ${profileUser.username}`);
          
          setProfileUser(prev => prev ? { ...prev, followerCount: (prev.followerCount || 0) + 1 } : null);
          
          // Check if we can message (need mutual follow)
          const followStatus = await checkFollowStatus(profileUser.id);
          setCanMessage(followStatus.canMessage);
        }
      }
    } catch (error: any) {
      console.error('Follow toggle error:', error);
      toast.error(error.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profileUser) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6">User not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: { xs: '100%', sm: 600, md: 800 }, 
      mx: 'auto', 
      mt: { xs: 2, sm: 3, md: 4 },
      px: { xs: 1, sm: 2, md: 0 }
    }}>
      <Card sx={{
        border: { xs: 'none', sm: '1px solid', md: 'none' },
        borderColor: { xs: 'transparent', sm: 'rgba(0, 0, 0, 0.12)', md: 'transparent' },
        borderRadius: { xs: 0, sm: 1, md: 0 },
        boxShadow: { xs: 'none', sm: 1, md: 'none' },
        bgcolor: 'background.paper'
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {/* Profile Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            flexDirection: { xs: 'column', sm: 'row' },
            mb: { xs: 3, sm: 4 }, 
            gap: { xs: 2, sm: 3 },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 1,
              alignSelf: { xs: 'center', sm: 'flex-start' }
            }}>
              {/* Story Ring */}
              {userStories.length > 0 && (
                <Box
                  onClick={handleStoryClick}
                  sx={{
                    width: { xs: 90, sm: 110, md: 130 },
                    height: { xs: 90, sm: 110, md: 130 },
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #fd5949, #d6249f, #285AEB)',
                    padding: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Avatar
                    src={profileUser.profilePicture}
                    alt={profileUser.username}
                    sx={{ width: { xs: 80, sm: 100, md: 120 }, height: { xs: 80, sm: 100, md: 120 } }}
                  />
                </Box>
              )}
              
              {/* Regular Avatar (no stories) */}
              {userStories.length === 0 && (
                <Avatar
                  src={profileUser.profilePicture}
                  alt={profileUser.username}
                  sx={{ 
                    width: { xs: 80, sm: 100, md: 120 }, 
                    height: { xs: 80, sm: 100, md: 120 }, 
                    cursor: isOwnProfile ? 'pointer' : 'default' 
                  }}
                  onClick={isOwnProfile ? () => fileInputRef.current?.click() : undefined}
                />
              )}
              
              {/* Story Count */}
              {userStories.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {userStories.length} stor{userStories.length === 1 ? 'y' : 'ies'}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 2, sm: 2 },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
                  {profileUser.username}
                </Typography>
                
                {isOwnProfile ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                      disabled={loading}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={() => navigate('/settings')}
                    >
                      Settings
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                      variant={isFollowing ? "outlined" : followRequestSent ? "outlined" : "contained"}
                      onClick={handleFollowToggle}
                      disabled={followLoading || checkingMutualFollow}
                      size="small"
                      color={followRequestSent ? "secondary" : "primary"}
                    >
                      {followLoading ? (
                        <CircularProgress size={16} />
                      ) : isFollowing ? (
                        'Following'
                      ) : followRequestSent ? (
                        'Requested'
                      ) : (
                        'Follow'
                      )}
                    </Button>
                    
                    {/* Message button logic for public/private accounts */}
                    {canMessage || (!profileUser.isPrivate && isFollowing) ? (
                      <Button
                        variant="outlined"
                        startIcon={<MessageIcon />}
                        onClick={handleMessageUser}
                        disabled={checkingMutualFollow}
                        size="small"
                      >
                        Message
                      </Button>
                    ) : (
                      !checkingMutualFollow && isFollowing && profileUser.isPrivate && (
                        <Typography variant="caption" color="text.secondary">
                          {profileUser.isPrivate 
                            ? "They need to follow you back to message" 
                            : "Follow to message"
                          }
                        </Typography>
                      )
                    )}
                    
                    {checkingMutualFollow && (
                      <Typography variant="caption" color="text.secondary">
                        <CircularProgress size={12} sx={{ mr: 0.5 }} />
                        Checking...
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: { xs: 'center', sm: 'flex-start' },
                gap: { xs: 2, sm: 4 }, 
                mb: 2,
                flexWrap: { xs: 'nowrap', sm: 'wrap' }
              }}>
                <Typography variant={isMobile ? "body2" : "body1"}>
                  <strong>{userPosts.length}</strong> posts
                </Typography>
                <Typography 
                  variant={isMobile ? "body2" : "body1"}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setFollowersModalOpen(true)}
                >
                  <strong>{profileUser.followerCount || 0}</strong> followers
                </Typography>
                <Typography 
                  variant={isMobile ? "body2" : "body1"}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setFollowingModalOpen(true)}
                >
                  <strong>{profileUser.followingCount || 0}</strong> following
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {profileUser.fullName}
                </Typography>
                {profileUser.bio && (
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                    {profileUser.bio}
                  </Typography>
                )}
                {profileUser.website && (
                  <Typography 
                    variant="body2" 
                    component="a" 
                    href={profileUser.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'primary.main', textDecoration: 'none', display: 'block', mt: 1 }}
                  >
                    {profileUser.website}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Hidden file input for profile picture */}
          {isOwnProfile && (
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePictureChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Posts Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhotoCamera /> Posts ({isOwnProfile || !profileUser.isPrivate || isFollowing ? userPosts.length : '•'})
              </Typography>
              {(isOwnProfile || !profileUser.isPrivate || isFollowing) && (
                <IconButton onClick={fetchUserPosts} disabled={postsLoading}>
                  <RefreshIcon />
                </IconButton>
              )}
            </Box>

            {/* Privacy gate for posts */}
            {!isOwnProfile && profileUser.isPrivate && !isFollowing ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LockIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  This Account is Private
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Follow {profileUser.username} to see their photos and videos
                </Typography>
              </Box>
            ) : (
              <>
                {postsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Loading posts...
                </Typography>
              </Box>
            ) : userPosts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PhotoCamera sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No posts yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isOwnProfile ? 'When you share photos and videos, they will appear on your profile.' : 'This user hasn\'t posted anything yet.'}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={fetchUserPosts}
                  sx={{ mt: 2 }}
                  startIcon={<RefreshIcon />}
                >
                  Refresh
                </Button>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: { xs: 0.5, sm: 1 }
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
                      onClick={() => handlePostClick(post)}
                    >
                      <CardMedia
                        component={post.media && post.media[0]?.type === 'video' ? 'video' : 'img'}
                        image={post.media && post.media[0]?.url}
                        src={post.media && post.media[0]?.type === 'video' ? post.media[0]?.url : undefined}
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
                      {post.media && post.media[0]?.type === 'video' && (
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
                      {post.media && post.media.length > 1 && (
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
              </>
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
            label="Username"
            value={formData.username}
            onChange={handleFormChange('username')}
            margin="normal"
            variant="outlined"
            helperText={usernameStatus.message}
            error={usernameStatus.available === false}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {usernameStatus.checking && <CircularProgress size={20} />}
                  {usernameStatus.available === true && <CheckIcon color="success" />}
                  {usernameStatus.available === false && <ErrorIcon color="error" />}
                </InputAdornment>
              ),
            }}
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
            disabled={loading || (formData.username !== profileUser?.username && !usernameStatus.available)}
          >
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        open={postDetailOpen}
        onClose={() => setPostDetailOpen(false)}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
        currentUserId={currentUser?.id}
      />

      {/* Followers Modal */}
      <FollowersModal
        open={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        userId={profileUser.id}
        type="followers"
        title={`Followers (${profileUser.followerCount || 0})`}
      />
      
      <FollowersModal
        open={followingModalOpen}
        onClose={() => setFollowingModalOpen(false)}
        userId={profileUser.id}
        type="following"
        title={`Following (${profileUser.followingCount || 0})`}
      />

      {/* Story Viewer Modal */}
      <Dialog
        open={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'black',
            color: 'white',
            borderRadius: 2
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {userStories[currentStoryIndex] && (
            <Box>
              {/* Story Header */}
              <Box sx={{ 
                position: 'absolute', 
                top: 10, 
                left: 10, 
                right: 10, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                zIndex: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={profileUser.profilePicture}
                    alt={profileUser.username}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography variant="subtitle2" color="white">
                    {profileUser.username}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.7)">
                    {new Date(userStories[currentStoryIndex].createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <IconButton onClick={() => setStoryViewerOpen(false)} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Story Progress Bar */}
              <Box sx={{ 
                position: 'absolute', 
                top: 50, 
                left: 10, 
                right: 10, 
                display: 'flex', 
                gap: 0.5,
                zIndex: 1
              }}>
                {userStories.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      flex: 1,
                      height: 2,
                      backgroundColor: index <= currentStoryIndex ? 'white' : 'rgba(255,255,255,0.3)',
                      borderRadius: 1
                    }}
                  />
                ))}
              </Box>

              {/* Story Media */}
              {userStories[currentStoryIndex].media && (
                <Box sx={{ position: 'relative', width: '100%', height: '80vh' }}>
                  {userStories[currentStoryIndex].media!.type === 'image' ? (
                    <img
                      src={userStories[currentStoryIndex].media!.url}
                      alt="Story"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <video
                      src={userStories[currentStoryIndex].media!.url}
                      controls
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                </Box>
              )}

              {/* Text Story */}
              {userStories[currentStoryIndex].text && !userStories[currentStoryIndex].media && (
                <Box sx={{ 
                  height: '80vh', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: userStories[currentStoryIndex].text!.backgroundColor,
                  color: userStories[currentStoryIndex].text!.color
                }}>
                  <Typography variant="h4" textAlign="center" sx={{ px: 3 }}>
                    {userStories[currentStoryIndex].text!.content}
                  </Typography>
                </Box>
              )}

              {/* Navigation */}
              <Box sx={{ 
                position: 'absolute', 
                bottom: 20, 
                left: '50%', 
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1
              }}>
                {currentStoryIndex > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setCurrentStoryIndex(currentStoryIndex - 1)}
                    sx={{ color: 'white', borderColor: 'white' }}
                  >
                    Previous
                  </Button>
                )}
                {currentStoryIndex < userStories.length - 1 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setCurrentStoryIndex(currentStoryIndex + 1)}
                    sx={{ color: 'white', borderColor: 'white' }}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Profile;