import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { postsApi, usersApi, followApi } from '../services/api';
import { Post as PostType, User } from '../types';
import Post from './Post';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';
import toast from 'react-hot-toast';

const PostFeed: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  // Fetch all posts from all users
  const fetchAllPosts = useCallback(async () => {
    try {
      console.log('🔍 PostFeed: Starting to fetch all posts...');
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
      
      // Set liked and saved posts from current user data
      if (currentUser) {
        const userLikedPosts = new Set<string>();
        const userSavedPosts = new Set<string>();
        
        response.data.forEach((post: PostType) => {
          if (post.likes.some((user: User) => user.id === currentUser.id)) {
            userLikedPosts.add(post.id);
          }
        });
        
        // Handle savedPosts - they could be ObjectIds (strings) or Post objects
        if (currentUser.savedPosts && Array.isArray(currentUser.savedPosts)) {
          currentUser.savedPosts.forEach((savedPost: any) => {
            // If it's a Post object, use its id; if it's just an ObjectId string, use it directly
            const postId = typeof savedPost === 'string' ? savedPost : savedPost.id || savedPost._id;
            if (postId) {
              userSavedPosts.add(postId);
            }
          });
        }
        
        setLikedPosts(userLikedPosts);
        setSavedPosts(userSavedPosts);
        
        // Get current user's following list
        console.log('🔍 Getting user following list for:', currentUser.username);
        const userResponse = await usersApi.getProfile(currentUser.username);
        console.log('👥 Following data:', userResponse.data.following);
        const following = new Set(userResponse.data.following.map((u: User) => u.id));
        setFollowingUsers(following);
        console.log('✅ Following set created with', following.size, 'users');
      }
      
      console.log('✅ PostFeed loading complete');
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

  // Handle like/unlike post
  const handleLike = async (postId: string) => {
    if (!currentUser) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      await postsApi.likePost(postId);
      
      // Update local state
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(postId)) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
      
      // Update posts state
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            const isLiked = post.likes.some((user: User) => user.id === currentUser.id);
            return {
              ...post,
              likes: isLiked
                ? post.likes.filter((user: User) => user.id !== currentUser.id)
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

  // Handle support click
  const handleSupportClick = (postId: string) => {
    if (!currentUser) {
      toast.error('Please login to support creators');
      return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (post) {
      toast.success(`Support feature coming soon! Support ${post.user.username} 💰`);
      console.log('Support clicked for post:', postId, 'by user:', post.user.username);
    }
  };

  // Handle save/unsave post
  const handleSaveClick = async (postId: string) => {
    if (!currentUser) {
      toast.error('Please login to save posts');
      return;
    }

    try {
      const isSaved = savedPosts.has(postId);
      
      if (isSaved) {
        // Unsave post
        await postsApi.unsavePost(postId);
        setSavedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        toast.success('Post removed from saved');
      } else {
        // Save post
        await postsApi.savePost(postId);
        setSavedPosts(prev => new Set(prev).add(postId));
        toast.success('Post saved');
      }
      
      // Refresh user data to keep savedPosts in sync
      await refreshUser();
    } catch (error: any) {
      console.error('Save error:', error);
      if (error.response?.status === 400) {
        // Handle already saved/not saved errors
        const message = error.response.data.message;
        if (message.includes('already saved')) {
          toast.error('Post is already saved');
        } else if (message.includes('not saved')) {
          toast.error('Post is not in your saved collection');
        } else {
          toast.error(message);
        }
      } else {
        toast.error('Failed to save post');
      }
    }
  };

  // Handle follow/unfollow user
  const handleFollow = async (userId: string) => {
    if (!currentUser || followLoading.has(userId)) return;
    
    console.log('🔍 PostFeed Follow user:', { userId, currentUserId: currentUser.id });

    setFollowLoading(prev => new Set(prev).add(userId));

    try {
      console.log('📤 PostFeed Following user...');
      const response = await followApi.followUser(userId);
      console.log('✅ PostFeed Follow response:', response.data);
      
      setFollowingUsers(prev => new Set(prev).add(userId));
      toast.success('Now following!');
      
      // Refresh user data to update follower/following counts
      await refreshUser();
    } catch (error: any) {
      console.error('❌ PostFeed Follow error:', error);
      console.error('❌ PostFeed Follow error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('Failed to follow user');
    } finally {
      setFollowLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
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

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '200px',
        mt: 4 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: { xs: '100vw', sm: 470 }, // Reduced from 614 to match post width
      mx: 'auto', 
      mt: { xs: 0, sm: 2 },
      px: 0,
      overflow: 'hidden'
    }}>
      {posts.length === 0 ? (
        <Box sx={{
          textAlign: 'center',
          py: 8,
          px: 4,
          backgroundColor: 'rgba(31, 31, 53, 0.6)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          mx: { xs: 0, sm: 1 },
          backdropFilter: 'blur(10px)'
        }}>
          <Typography variant="h6" sx={{ mb: 1, color: '#FFFFFF' }}>
            No posts available
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Be the first to create a post!
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          width: '100%',
          gap: 2
        }}>
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              isLiked={likedPosts.has(post.id)}
              isSaved={savedPosts.has(post.id)}
              isFollowing={followingUsers.has(post.user.id)}
              followLoading={followLoading.has(post.user.id)}
              onLike={() => handleLike(post.id)}
              onComment={() => handleCommentClick(post.id)}
              onShare={() => handleShareClick(post.id)}
              onSave={() => handleSaveClick(post.id)}
              onSupport={() => handleSupportClick(post.id)}
              onFollow={handleFollow}
            />
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
      <ShareModal 
        post={selectedPost}
        open={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setSelectedPost(null);
        }}
      />
    </Box>
  );
};

export default PostFeed;