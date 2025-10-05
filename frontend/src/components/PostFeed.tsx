import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import { CurrencyRupee as CurrencyRupeeIcon } from '@mui/icons-material';
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
  
  // Support dialog state
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [supportAmount, setSupportAmount] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportPost, setSupportPost] = useState<PostType | null>(null);

  // Fetch all posts from all users - Demo version
  const fetchAllPosts = useCallback(async () => {
    try {
      console.log('🔍 PostFeed: Starting to fetch demo posts...');
      console.log('👤 Current user:', currentUser);
      setLoading(true);
      
      // Create demo posts data
      const demoPosts: PostType[] = [
        {
          id: '1',
          user: {
            id: 'demo_user_1',
            username: 'alex_photo',
            email: 'alex@demo.com',
            fullName: 'Alex Photography',
            bio: 'Professional photographer',
            profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
            isPrivate: false,
            isVerified: true,
            followers: [],
            following: [],
            posts: [],
            savedPosts: [],
            followerCount: 1250,
            followingCount: 180,
            postCount: 23,
            lastSeen: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          caption: 'Just captured this amazing sunset! The colors were absolutely perfect and I couldn\'t be happier with how this turned out. What do you think? 📸✨ #photography #sunset #nature #art',
          media: [{
            url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=750&fit=crop&crop=face',
            type: 'image' as const,
            publicId: 'demo_image_1'
          }],
          likes: [
            { id: '2', username: 'friend_1' } as any,
            { id: '3', username: 'friend_2' } as any,
          ],
          comments: [],
          location: { name: 'Golden Gate Bridge' },
          tags: [],
          hashtags: ['photography', 'sunset', 'nature', 'art'],
          isArchived: false,
          commentsDisabled: false,
          likeCount: 47,
          commentCount: 12,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          user: {
            id: 'demo_user_2',
            username: 'sarah_art',
            email: 'sarah@demo.com',
            fullName: 'Sarah Artist',
            bio: 'Digital artist & creator',
            profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b494?w=150&h=150&fit=crop&crop=face',
            isPrivate: false,
            isVerified: false,
            followers: [],
            following: [],
            posts: [],
            savedPosts: [],
            followerCount: 850,
            followingCount: 120,
            postCount: 18,
            lastSeen: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          caption: 'Working on my latest digital art piece! This took me about 6 hours to complete. Love experimenting with new styles! 🎨 #digitalart #creative #artwork #artist',
          media: [{
            url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&h=750&fit=crop',
            type: 'image' as const,
            publicId: 'demo_image_2'
          }],
          likes: [
            { id: '1', username: 'alex_photo' } as any,
            { id: '4', username: 'mike_dev' } as any,
            { id: '5', username: 'jane_music' } as any,
          ],
          comments: [],
          location: { name: 'Art Studio' },
          tags: [],
          hashtags: ['digitalart', 'creative', 'artwork', 'artist'],
          isArchived: false,
          commentsDisabled: false,
          likeCount: 23,
          commentCount: 8,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          user: {
            id: 'demo_user_3',
            username: 'mike_dev',
            email: 'mike@demo.com',
            fullName: 'Mike Developer',
            bio: 'Full stack developer',
            profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            isPrivate: false,
            isVerified: false,
            followers: [],
            following: [],
            posts: [],
            savedPosts: [],
            followerCount: 650,
            followingCount: 200,
            postCount: 15,
            lastSeen: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          caption: 'Late night coding session! Building something amazing. Coffee is my best friend tonight ☕️💻 #coding #developer #latenight #coffee',
          media: [{
            url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=750&fit=crop',
            type: 'image' as const,
            publicId: 'demo_image_3'
          }],
          likes: [
            { id: '1', username: 'alex_photo' } as any,
            { id: '2', username: 'sarah_art' } as any,
          ],
          comments: [],
          location: { name: 'Home Office' },
          tags: [],
          hashtags: ['coding', 'developer', 'latenight', 'coffee'],
          isArchived: false,
          commentsDisabled: false,
          likeCount: 15,
          commentCount: 5,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      
      console.log('📡 Demo Posts created:', {
        postCount: demoPosts.length,
        posts: demoPosts.map(p => ({ id: p.id, user: p.user.username, caption: (p.caption || '').substring(0, 30) + '...' }))
      });
      
      setPosts(demoPosts);
      
      // Set liked and saved posts from current user data
      if (currentUser) {
        const userLikedPosts = new Set<string>();
        const userSavedPosts = new Set<string>();
        
        // Demo: simulate some liked/saved posts
        demoPosts.forEach((post: PostType) => {
          // Simulate user has liked some posts
          if (post.likes.some(like => like.username === currentUser.username)) {
            userLikedPosts.add(post.id);
          }
        });
        
        setLikedPosts(userLikedPosts);
        setSavedPosts(userSavedPosts);
        
        // Demo: set empty following list for now
        setFollowingUsers(new Set());
      }
      
      console.log('✅ PostFeed loading complete');
    } catch (error: any) {
      console.error('❌ Error loading demo posts:', error);
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
    if (!post) return;
    
    // Don't allow supporting own posts
    if (post.user.id === currentUser.id) {
      toast.error('You cannot support your own post');
      return;
    }
    
    setSupportPost(post);
    setSupportDialogOpen(true);
    setSupportAmount('');
    setSupportMessage('');
  };

  // Handle support form submission - Demo version
  const handleSupportSubmit = async () => {
    if (!supportPost || !currentUser || !supportAmount) return;

    const amount = parseFloat(supportAmount);
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > 10000) {
      toast.error('Maximum support amount is ₹10,000');
      return;
    }

    // Demo functionality - show coming soon message
    toast.success(`🎉 Support feature is coming soon! You tried to support @${supportPost.user.username} with ₹${amount}.`);
    setSupportDialogOpen(false);
    setSupportAmount('');
    setSupportMessage('');
    setSupportPost(null);
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

      {/* Support Dialog */}
      <Dialog 
        open={supportDialogOpen} 
        onClose={() => setSupportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Support @{supportPost?.user.username}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Send coins to support this amazing content creator!
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Amount to support"
            type="number"
            fullWidth
            variant="outlined"
            value={supportAmount}
            onChange={(e) => setSupportAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CurrencyRupeeIcon />
                </InputAdornment>
              ),
            }}
            inputProps={{ min: 1, max: 10000 }}
            helperText="Minimum: ₹1, Maximum: ₹10,000"
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Support message (optional)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            placeholder="Leave a supportive message..."
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setSupportDialogOpen(false)}
            disabled={supportLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSupportSubmit}
            variant="contained"
            disabled={!supportAmount || parseFloat(supportAmount) <= 0}
            startIcon={<CurrencyRupeeIcon />}
          >
            Support ₹{supportAmount || '0'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PostFeed;