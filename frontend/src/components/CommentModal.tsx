import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Card,
  Typography,
  IconButton,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { postsApi } from '../services/api';
import { Post } from '../types';
import toast from 'react-hot-toast';

interface Comment {
  _id: string;
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  text: string;
  createdAt: string;
}

interface CommentModalProps {
  post: Post | null;
  open: boolean;
  onClose: () => void;
  onCommentAdded?: (postId: string) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ post, open, onClose, onCommentAdded }) => {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments when modal opens
  useEffect(() => {
    if (open && post) {
      fetchComments();
    } else {
      setComments([]);
      setCommentText('');
    }
  }, [open, post]);

  const fetchComments = async () => {
    if (!post) return;
    
    setLoading(true);
    try {
      const response = await postsApi.getComments(post.id);
      setComments(response.data.comments);
    } catch (error: any) {
      console.error('Fetch comments error:', error);
      if (error.response?.status === 403) {
        toast.error('You can only view comments from accounts you follow');
      } else {
        toast.error('Failed to load comments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !currentUser || !commentText.trim()) return;

    setSubmitting(true);
    try {
      const response = await postsApi.addComment(post.id, commentText.trim());
      
      // Add new comment to the list
      const newComment: Comment = {
        _id: response.data._id || Date.now().toString(),
        user: {
          _id: currentUser.id,
          username: currentUser.username,
          profilePicture: currentUser.profilePicture,
        },
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      };
      
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      
      // Notify parent component that a comment was added
      if (onCommentAdded) {
        onCommentAdded(post.id);
      }
      
      toast.success('Comment added!');
    } catch (error: any) {
      console.error('Add comment error:', error);
      if (error.response?.status === 403) {
        toast.error('You can only comment on posts from accounts you follow');
      } else {
        toast.error('Failed to add comment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMinutes > 0) return `${diffMinutes}m`;
    return 'now';
  };

  if (!post) return null;

  return (
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
          width: '100%',
          maxWidth: 500,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Comments
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Post Info */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={post.user.profilePicture}
              sx={{ width: 32, height: 32 }}
            >
              {post.user.username[0].toUpperCase()}
            </Avatar>
            <Typography variant="subtitle2" fontWeight="bold">
              {post.user.username}
            </Typography>
          </Box>
          {post.caption && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {post.caption}
            </Typography>
          )}
        </Box>

        {/* Comments List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 200 }}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200,
              }}
            >
              <CircularProgress />
            </Box>
          ) : comments.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No comments yet. Be the first to comment!
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {comments.map((comment, index) => (
                <React.Fragment key={comment._id}>
                  <ListItem alignItems="flex-start" sx={{ py: 1 }}>
                    <ListItemAvatar>
                      <Avatar
                        src={comment.user.profilePicture}
                        sx={{ width: 32, height: 32 }}
                      >
                        {comment.user.username[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            component="span"
                          >
                            {comment.user.username}
                          </Typography>
                          <Typography variant="body2" component="span">
                            {comment.text}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeAgo(comment.createdAt)}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < comments.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Add Comment Form */}
        {currentUser && (
          <Box
            component="form"
            onSubmit={handleSubmitComment}
            sx={{
              p: 2,
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Avatar
              src={currentUser.profilePicture}
              sx={{ width: 32, height: 32 }}
            >
              {currentUser.username[0].toUpperCase()}
            </Avatar>
            <TextField
              fullWidth
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              variant="outlined"
              size="small"
              multiline
              maxRows={3}
              disabled={submitting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 20,
                },
              }}
            />
            <IconButton
              type="submit"
              disabled={!commentText.trim() || submitting}
              color="primary"
            >
              {submitting ? (
                <CircularProgress size={20} />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </Box>
        )}
      </Card>
    </Modal>
  );
};

export default CommentModal;