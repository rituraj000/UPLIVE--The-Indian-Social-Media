import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Card,
  CardMedia,
  Backdrop,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  BookmarkBorder as BookmarkBorderIcon,
  GridOn as GridOnIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { postsApi } from '../services/api';
import { Post as PostType } from '../types';
import Post from '../components/Post';
import toast from 'react-hot-toast';

const SavedPosts: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [savedPosts, setSavedPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Call the saved posts API
      const response = await postsApi.getSavedPosts();
      setSavedPosts(response.data);
    } catch (error: any) {
      console.error('Error fetching saved posts:', error);
      
      // Fallback to user's savedPosts if API call fails
      if (currentUser.savedPosts) {
        setSavedPosts(currentUser.savedPosts);
      } else {
        setSavedPosts([]);
      }
      
      if (error.response?.status !== 404) {
        toast.error('Failed to load saved posts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (post: PostType) => {
    if (viewMode === 'grid') {
      setSelectedPost(post);
    }
  };

  const handleUnsavePost = async (postId: string) => {
    try {
      // Remove from local state immediately for better UX
      setSavedPosts(prev => prev.filter(post => post.id !== postId));
      
      // Call API to unsave
      await postsApi.unsavePost(postId);
      toast.success('Post removed from saved');
      
      // Close modal if it's the current post
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    } catch (error: any) {
      console.error('Error unsaving post:', error);
      
      // Revert local state change if API call failed
      setSavedPosts(prev => [...prev, selectedPost!].filter(Boolean));
      
      if (error.response?.status === 400) {
        toast.error('Post is not in your saved collection');
      } else {
        toast.error('Failed to remove post from saved');
      }
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: { xs: '100%', sm: 600, md: 900 }, 
      mx: 'auto', 
      p: { xs: 1, sm: 2 }
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: { xs: 2, sm: 3 },
        px: { xs: 1, sm: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            Saved Posts
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={() => setViewMode(viewMode === 'grid' ? 'feed' : 'grid')}
            color={viewMode === 'grid' ? 'primary' : 'default'}
          >
            <GridOnIcon />
          </IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : savedPosts.length === 0 ? (
        // Empty State
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          px: 4 
        }}>
          <BookmarkBorderIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No Saved Posts
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Posts you save will appear here. Start exploring and save posts you want to see again.
          </Typography>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // Grid View
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: {
                xs: 'repeat(3, 1fr)',
                sm: 'repeat(3, 1fr)', 
                md: 'repeat(4, 1fr)'
              },
              gap: 1
            }}>
              {savedPosts.map((post) => (
                <Card 
                  key={post.id}
                  sx={{ 
                    aspectRatio: '1/1',
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                  }}
                  onClick={() => handlePostClick(post)}
                >
                  <CardMedia
                    component="img"
                    height="100%"
                    image={post.media && post.media.length > 0 ? post.media[0].url : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='}
                    alt={post.caption || 'Saved post'}
                    sx={{ objectFit: 'cover' }}
                  />
                </Card>
              ))}
            </Box>
          ) : (
            // Feed View
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {savedPosts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  isLiked={false} // You can implement this logic
                  isSaved={true}
                  isFollowing={false} // You can implement this logic
                  followLoading={false}
                  onLike={() => console.log('Like functionality')}
                  onComment={() => console.log('Comment functionality')}
                  onShare={() => console.log('Share functionality')}
                  onSave={() => handleUnsavePost(post.id)}
                  onSupport={() => console.log('Support functionality')}
                  onFollow={() => console.log('Follow functionality')}
                />
              ))}
            </Box>
          )}
        </>
      )}

      {/* Post Detail Modal */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={!!selectedPost}
        onClick={() => setSelectedPost(null)}
      >
        <Box sx={{ 
          maxWidth: 470,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 2
        }}>
          {selectedPost && (
            <Post
              post={selectedPost}
              isLiked={false}
              isSaved={true}
              isFollowing={false}
              followLoading={false}
              onLike={() => console.log('Like functionality')}
              onComment={() => console.log('Comment functionality')}
              onShare={() => console.log('Share functionality')}
              onSave={() => handleUnsavePost(selectedPost.id)}
              onSupport={() => console.log('Support functionality')}
              onFollow={() => console.log('Follow functionality')}
            />
          )}
        </Box>
      </Backdrop>
    </Box>
  );
};

export default SavedPosts;