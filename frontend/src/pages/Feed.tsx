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
  Chip,
  useMediaQuery,
  useTheme,
  styled
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  MonetizationOn as SupportIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { postsApi, usersApi, followApi } from '../services/api';
import { Post, User } from '../types';
import CommentModal from '../components/CommentModal';
import ShareModal from '../components/ShareModal';
import toast from 'react-hot-toast';

// Styled Logo Component
const Logo = styled(Typography)({
  fontFamily: 'inherit',
  fontSize: '2.5rem',
  fontWeight: 'bold',
  background: 'linear-gradient(45deg, #FF9933, #138808)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  textAlign: 'center',
  padding: '16px 0',
  margin: 0,
  // Fallback for browsers that don't support background-clip
  color: '#FF9933',
});

const Feed: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
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

  // Handle comment click - open comment modal
  const handleCommentClick = (postId: string) => {
    if (!currentUser) {
      toast.error('Please login to comment');
      return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setCommentModalOpen(true);
    }
  };

  // Handle comment added - update post comment count
  const handleCommentAdded = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, commentCount: (post.commentCount || 0) + 1 }
          : post
      )
    );
  };

  // Handle share modal close
  const handleShareModalClose = () => {
    setShareModalOpen(false);
    setSelectedPost(null);
  };

  // Handle support click - show support modal or payment options
  const handleSupportClick = (postId: string, username: string) => {
    if (!currentUser) {
      toast.error('Please login to support creators');
      return;
    }
    
    // For now, show a coming soon message
    toast.success(`Support feature coming soon! Support ${username} 💰`);
    console.log('Support clicked for post:', postId, 'by user:', username);
  };

  // Handle share click - open share modal
  const handleShareClick = (postId: string) => {
    if (!currentUser) {
      toast.error('Please login to share');
      return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setShareModalOpen(true);
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
    <Box sx={{ 
      maxWidth: { xs: '100%', sm: 600 }, // Full width on mobile, 600px on larger screens
      mx: { xs: 0, sm: 'auto' }, // No horizontal margin on mobile, auto on larger screens
      mt: { xs: 0, sm: 2 } // No top margin on mobile to position logo at top
    }}>
      {/* UPLIVE Logo - TESTING - Always visible */}
      <Box sx={{ 
        width: '100%', 
        background: 'rgba(255, 153, 51, 0.9)',
        borderBottom: '2px solid rgba(255, 255, 255, 0.5)',
        padding: '8px 0',
        textAlign: 'center'
      }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 'bold',
            color: '#000',
            fontFamily: 'inherit'
          }}
        >
          UPLIVE
        </Typography>
      </Box>
      
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center', px: { xs: 2, sm: 0 } }}>
        Discover Posts
      </Typography>

      {posts.length === 0 ? (
        <Card sx={{ mx: { xs: 2, sm: 0 } }}>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0, sm: 1 } }}>
          {posts.map((post) => (
            <Card key={post.id} sx={{ 
              mb: { xs: 0, sm: 1 }, // Reduced margin bottom
              mx: { xs: 0, sm: 0 }, // No horizontal margin
              borderRadius: { xs: 0, sm: 1 } // No border radius on mobile
            }}>
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
                    <IconButton 
                      onClick={() => handleCommentClick(post.id)}
                      disabled={!currentUser}
                    >
                      <CommentIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleShareClick(post.id)}
                      disabled={!currentUser}
                    >
                      <ShareIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleSupportClick(post.id, post.user.username)}
                      disabled={!currentUser}
                      color="warning"
                    >
                      <SupportIcon />
                    </IconButton>
                  </Box>

                  {/* Like Count */}
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                    {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
                  </Typography>

                  {/* Comment Count */}
                  {post.commentCount > 0 && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => handleCommentClick(post.id)}
                    >
                      View all {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                    </Typography>
                  )}

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
      
      {/* Comment Modal */}
      <CommentModal 
        post={selectedPost}
        open={commentModalOpen}
        onClose={() => {
          setCommentModalOpen(false);
          setSelectedPost(null);
        }}
        onCommentAdded={handleCommentAdded}
      />
      
      {/* Share Modal */}
      {shareModalOpen && selectedPost && (
        <ShareModal
          open={shareModalOpen}
          onClose={handleShareModalClose}
          post={selectedPost}
        />
      )}
    </Box>
  );
};

export default Feed;