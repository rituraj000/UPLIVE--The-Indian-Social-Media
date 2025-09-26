import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  Box,
  Card,
  CardMedia,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  MonetizationOn as SupportIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { postsApi } from '../services/api';
import { Post } from '../types';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';

interface PostDetailModalProps {
  post: Post | null;
  open: boolean;
  onClose: () => void;
  onPostUpdated?: (updatedPost: Post) => void;
  onPostDeleted?: (postId: string) => void;
  currentUserId?: string;
  isSharedPost?: boolean; // New prop to indicate if this is a shared post
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  open,
  onClose,
  onPostUpdated,
  onPostDeleted,
  currentUserId,
  isSharedPost = false, // Default to false
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);

  // Update local post state when prop changes
  useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  if (!currentPost) return null;

  const isOwner = currentUserId === currentPost.user.id;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setEditCaption(currentPost?.caption || '');
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleEditSave = async () => {
    if (!currentPost) return;
    
    setLoading(true);
    try {
      await postsApi.editPost(currentPost.id, { caption: editCaption });
      const updatedPost = { ...currentPost, caption: editCaption };
      setCurrentPost(updatedPost);
      onPostUpdated?.(updatedPost);
      setEditDialogOpen(false);
      toast.success('Caption updated successfully!');
    } catch (error) {
      console.error('Edit post error:', error);
      toast.error('Failed to update caption');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentPost) return;

    setLoading(true);
    try {
      await postsApi.deletePost(currentPost.id);
      onPostDeleted?.(currentPost.id);
      setDeleteDialogOpen(false);
      onClose();
      toast.success('Post deleted successfully!');
    } catch (error) {
      console.error('Delete post error:', error);
      toast.error('Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentPost) return;

    const isCurrentlyLiked = currentPost.likes.some(user => user.id === currentUserId);
    
    // Optimistically update the UI
    const updatedPost = {
      ...currentPost,
      likeCount: isCurrentlyLiked ? currentPost.likeCount - 1 : currentPost.likeCount + 1,
      likes: isCurrentlyLiked 
        ? currentPost.likes.filter(user => user.id !== currentUserId)
        : [...currentPost.likes, { id: currentUserId } as any]
    };
    
    setCurrentPost(updatedPost);
    
    try {
      await postsApi.likePost(currentPost.id);
      // Call the callback to update the parent component's state
      onPostUpdated?.(updatedPost);
    } catch (error) {
      // Revert the optimistic update on error
      setCurrentPost(currentPost);
      console.error('Like post error:', error);
      toast.error('Failed to like post');
    }
  };

  const handleCommentClick = () => {
    setCommentModalOpen(true);
  };

  const handleShareClick = () => {
    setShareModalOpen(true);
  };

  const handleSupportClick = () => {
    if (!post) return;
    toast.success(`Support feature coming soon! Support @${post.user.username} 💰`);
  };

  const handleCommentAdded = (postId: string) => {
    if (post && post.id === postId) {
      const updatedPost = {
        ...post,
        commentCount: (post.commentCount || 0) + 1,
      };
      onPostUpdated?.(updatedPost);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Card
          sx={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: 800,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            overflow: 'hidden',
          }}
        >
          {/* Image/Video Section */}
          <Box
            sx={{
              flex: { xs: 'none', md: '1 1 60%' },
              height: { xs: 300, md: 'auto' },
              backgroundColor: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CardMedia
              component={currentPost.media[0]?.type === 'video' ? 'video' : 'img'}
              image={currentPost.media[0]?.url}
              src={currentPost.media[0]?.type === 'video' ? currentPost.media[0]?.url : undefined}
              controls={currentPost.media[0]?.type === 'video'}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>

          {/* Content Section */}
          <Box
            sx={{
              flex: { xs: 'none', md: '1 1 40%' },
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 'auto', md: 500 },
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={currentPost.user.profilePicture}
                  alt={currentPost.user.username}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    navigate(`/${currentPost?.user.username}`);
                    onClose();
                  }}
                />
                <Typography 
                  variant="subtitle2" 
                  fontWeight="bold"
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={() => {
                    navigate(`/${currentPost?.user.username}`);
                    onClose();
                  }}
                >
                  {currentPost?.user.username}
                </Typography>
              </Box>

              <Box>
                {/* Only show menu for post owner */}
                {isOwner && (
                  <IconButton onClick={handleMenuOpen}>
                    <MoreVertIcon />
                  </IconButton>
                )}
                <IconButton onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, p: 2 }}>
              {currentPost?.caption && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <Typography
                      component="span"
                      fontWeight="bold"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => {
                        navigate(`/${currentPost.user.username}`);
                        onClose();
                      }}
                    >
                      {currentPost.user.username}
                    </Typography>{' '}{currentPost.caption}
                  </Typography>
                </Box>
              )}

              {currentPost?.hashtags && currentPost.hashtags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {currentPost.hashtags.map((hashtag, index) => (
                    <Chip
                      key={index}
                      label={`#${hashtag}`}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}

              <Typography variant="caption" color="text.secondary">
                {formatDate(currentPost?.createdAt || '')}
              </Typography>
            </Box>

            <Divider />

            {/* Actions */}
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {/* Like Button */}
                <IconButton onClick={handleLike} color="primary">
                  {currentPost?.likes.some(user => user.id === currentUserId) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
                
                {/* Comment Button */}
                <IconButton onClick={handleCommentClick} color="primary">
                  <CommentIcon />
                </IconButton>
                
                {/* Share Button - Hide when viewing shared post */}
                {!isSharedPost && (
                  <IconButton onClick={handleShareClick} color="primary">
                    <ShareIcon />
                  </IconButton>
                )}
                
                {/* Support Button */}
                <IconButton onClick={handleSupportClick} color="primary">
                  <SupportIcon />
                </IconButton>
              </Box>
              
              {/* Post Stats */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {currentPost?.likeCount} {currentPost?.likeCount === 1 ? 'like' : 'likes'}
                </Typography>
                {currentPost && currentPost.commentCount > 0 && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={handleCommentClick}
                  >
                    View all {currentPost?.commentCount} {currentPost?.commentCount === 1 ? 'comment' : 'comments'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Card>
      </Modal>

      {/* Menu - Only for post owner */}
      {isOwner && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
        <MenuItem onClick={handleEditClick}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Caption
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Post
        </MenuItem>
        </Menu>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Caption</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            placeholder="Write a caption..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this post? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Modal */}
      <CommentModal
        open={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        post={post}
        onCommentAdded={handleCommentAdded}
      />

      {/* Share Modal - Only show for original posts, not shared posts */}
      {!isSharedPost && (
        <ShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          post={post}
        />
      )}
    </>
  );
};

export default PostDetailModal;