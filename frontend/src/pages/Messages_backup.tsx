import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Avatar,
  IconButton,
  Button,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { postsApi, usersApi, followApi } from '../services/api';
import { Post, User } from '../types';
import toast from 'react-hot-toast';

const Feed: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());

  // Fetch all posts from all users
  const fetchAllPosts = useCallback(async () => {
    try {
      console.log('🔍 Feed: Starting to fetch all posts...');
      console.log('👤 Current user:', currentUser);
      setLoading(true);
      
      const response = await postsApi.getAllPosts();
      console.log('📡 API Response:', {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        postCount: Array.isArray(response.data) ? response.data.length : 'Not array',
        firstPost: response.data?.[0] ? {
          id: response.data[0].id,
          user: response.data[0].user?.username,
          caption: response.data[0].caption?.substring(0, 50)
        } : 'No posts'
      });
      
      setPosts(response.data);
      
      // Get current user's following list
      if (currentUser) {
        console.log('🔍 Getting user following list for:', currentUser.username);
        const userResponse = await usersApi.getProfile(currentUser.username);
        console.log('👥 Following data:', userResponse.data.following);
        const following = new Set(userResponse.data.following.map((u: User) => u.id));
        setFollowingUsers(following);
        console.log('✅ Following set created with', following.size, 'users');
      }
      
      console.log('✅ Feed loading complete');
    } catch (error: any) {
      console.error('❌ Error fetching posts:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAllPosts();
  }, [fetchAllPosts]);

  // Handle follow/unfollow
  const handleFollowToggle = async (userId: string) => {
    if (!currentUser || followLoading.has(userId)) return;
    
    console.log('🔍 Follow toggle:', { userId, currentUserId: currentUser.id, isCurrentlyFollowing: followingUsers.has(userId) });

    setFollowLoading(prev => new Set(prev).add(userId));

    try {
      const isFollowing = followingUsers.has(userId);
      
      if (isFollowing) {
        console.log('📤 Unfollowing user...');
        const response = await followApi.unfollowUser(userId);
        console.log('✅ Unfollow response:', response.data);
        
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast.success('Unfollowed successfully');
        
        // Refresh user data to update follower/following counts
        await refreshUser();
      } else {
        console.log('📤 Following user...');
        const response = await followApi.followUser(userId);
        console.log('✅ Follow response:', response.data);
        
        setFollowingUsers(prev => new Set(prev).add(userId));
        toast.success('Following now!');
        
        // Refresh user data to update follower/following counts
        await refreshUser();
      }
    } catch (error: any) {
      console.error('❌ Follow error:', error);
      console.error('❌ Follow error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Handle like/unlike post
  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    try {
      await postsApi.likePost(postId);
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            const isLiked = post.likes.some(user => user.id === currentUser.id);
            return {
              ...post,
              likes: isLiked
                ? post.likes.filter(user => user.id !== currentUser.id)
                : [...post.likes, currentUser],
              likeCount: isLiked ? post.likeCount - 1 : post.likeCount + 1,
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to like post');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
        Discover Posts
      </Typography>

      {posts.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No posts available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Be the first to create a post!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {posts.map((post) => (
            <Card key={post.id} sx={{ mb: 2 }}>
                {/* Post Header */}
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={post.user.profilePicture}
                        alt={post.user.username}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/${post.user.username}`)}
                      />
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          fontWeight="bold"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={() => navigate(`/${post.user.username}`)}
                        >
                          {post.user.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(post.createdAt)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Follow Button */}
                    {currentUser && currentUser.id !== post.user.id && (
                      <Button
                        variant={followingUsers.has(post.user.id) ? "outlined" : "contained"}
                        color="primary"
                        size="small"
                        startIcon={
                          followingUsers.has(post.user.id) ? <PersonRemoveIcon /> : <PersonAddIcon />
                        }
                        onClick={() => handleFollowToggle(post.user.id)}
                        disabled={followLoading.has(post.user.id)}
                        sx={{ minWidth: 100 }}
                      >
                        {followLoading.has(post.user.id) ? (
                          <CircularProgress size={16} />
                        ) : followingUsers.has(post.user.id) ? (
                          'Following'
                        ) : (
                          'Follow'
                        )}
                      </Button>
                    )}
                  </Box>
                </CardContent>

                {/* Post Media */}
                {post.media && post.media.length > 0 && (
                  <CardMedia
                    component={post.media[0].type === 'video' ? 'video' : 'img'}
                    image={post.media[0].url}
                    src={post.media[0].type === 'video' ? post.media[0].url : undefined}
                    controls={post.media[0].type === 'video'}
                    sx={{
                      height: 400,
                      objectFit: 'cover',
                    }}
                  />
                )}

                {/* Post Actions */}
                <CardContent sx={{ pt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <IconButton
                      onClick={() => handleLike(post.id)}
                      color="primary"
                      disabled={!currentUser}
                    >
                      {currentUser && post.likes.some(user => user.id === currentUser.id) ? (
                        <FavoriteIcon />
                      ) : (
                        <FavoriteBorderIcon />
                      )}
                    </IconButton>
                    <IconButton disabled>
                      <CommentIcon />
                    </IconButton>
                    <IconButton disabled>
                      <ShareIcon />
                    </IconButton>
                  </Box>

                  {/* Like Count */}
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                    {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
                  </Typography>

                  {/* Caption */}
                  {post.caption && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <Typography 
                        component="span" 
                        fontWeight="bold"
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => navigate(`/${post.user.username}`)}
                      >
                        {post.user.username}
                      </Typography>{' '}
                      {post.caption}
                    </Typography>
                  )}

                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {post.hashtags.map((hashtag, index) => (
                        <Chip
                          key={index}
                          label={`#${hashtag}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
        </Box>
      )}
    </Box>
  );
};

export default Feed;