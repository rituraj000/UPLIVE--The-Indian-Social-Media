import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  PersonAdd as PersonAddIcon,
  Comment as CommentIcon,
  Close as CloseIcon,
   Check as CheckIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { notificationsApi, followApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import toast from 'react-hot-toast';

// Helper functions for date formatting
const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

const getDateLabel = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups: { [key: string]: Notification[] } = {};
  
  notifications.forEach(notification => {
    const date = new Date(notification.createdAt);
    const label = getDateLabel(date);
    
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(notification);
  });
  
  // Sort groups by date (Today first, then Yesterday, then older dates)
  const sortedGroups: { label: string; notifications: Notification[] }[] = [];
  
  if (groups['Today']) {
    sortedGroups.push({ label: 'Today', notifications: groups['Today'] });
  }
  
  if (groups['Yesterday']) {
    sortedGroups.push({ label: 'Yesterday', notifications: groups['Yesterday'] });
  }
  
  // Add other dates in chronological order (newest first)
  Object.keys(groups)
    .filter(label => label !== 'Today' && label !== 'Yesterday')
    .sort((a, b) => {
      const dateA = new Date(groups[a][0].createdAt);
      const dateB = new Date(groups[b][0].createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .forEach(label => {
      sortedGroups.push({ label, notifications: groups[label] });
    });
  
  return sortedGroups;
};

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ open, onClose }) => {
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());
  const [followRequestLoading, setFollowRequestLoading] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await notificationsApi.getNotifications();
      // Show all notifications (both read and unread)
      setNotifications(response.data);
      
      // Check follow status for all follow notifications
      const followNotifications = response.data.filter((n: Notification) => n.type === 'follow');
      const followingSet = new Set<string>();
      
      for (const notification of followNotifications) {
        try {
          const isFollowingResponse = await followApi.isFollowing(notification.fromUser.id);
          if (isFollowingResponse.data.following) {
            followingSet.add(notification.fromUser.id);
          }
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
      
      setFollowingUsers(followingSet);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      // Mark all notifications as read in backend
      await notificationsApi.markAllAsRead();
      
      // Update UI to show all notifications as read
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          isRead: true
        }))
      );
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
      // Auto mark all notifications as read when modal opens
      markAllNotificationsAsRead();
    }
  }, [open, fetchNotifications, markAllNotificationsAsRead]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      // Mark notification as read in UI instead of removing it
      setNotifications(prev =>
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleFollowRequestAction = async (notificationId: string, action: 'approve' | 'decline', userId: string) => {
    if (followRequestLoading.has(notificationId)) return;
    
    setFollowRequestLoading(prev => new Set(prev).add(notificationId));
    
    try {
      if (action === 'approve') {
        await notificationsApi.approveFollowRequest(notificationId);
        toast.success('Follow request approved!');
        
        // Remove the notification from the list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Refresh user data
        await refreshUser();
      } else {
        await notificationsApi.declineFollowRequest(notificationId);
        toast.success('Follow request declined');
        
        // Remove the notification from the list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error: any) {
      console.error(`Error ${action}ing follow request:`, error);
      toast.error(error.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setFollowRequestLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleFollowBack = async (notificationId: string, userId: string) => {
    if (followLoading.has(userId)) return;
    
    setFollowLoading(prev => new Set(prev).add(userId));
    
    try {
      const response = await notificationsApi.followBack(notificationId);
      
      if (response.data.requestSent) {
        toast.success('Follow request sent!');
      } else {
        toast.success('Following back!');
        setFollowingUsers(prev => new Set(prev).add(userId));
      }
      
      // Refresh user data
      await refreshUser();
      
    } catch (error: any) {
      console.error('Follow back error:', error);
      toast.error(error.response?.data?.message || 'Failed to follow back');
    } finally {
      setFollowLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Don't navigate for follow_request notifications - user should use approve/decline buttons
    if (notification.type === 'follow_request') {
      return;
    }
    
    // Check if fromUser exists
    if (!notification.fromUser || !notification.fromUser.username) {
      console.error('Notification missing fromUser data:', notification);
      toast.error('Cannot navigate - user information missing');
      return;
    }
    
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        navigate(`/messages/${notification.fromUser.username}`);
        break;
      case 'follow':
        navigate(`/${notification.fromUser.username}`);
        break;
      case 'like':
      case 'comment':
      case 'mention':
        if (notification.post && notification.post.user && notification.post.user.username) {
          // Navigate to post owner's profile
          navigate(`/${notification.post.user.username}`);
        } else {
          // Fallback to fromUser profile
          navigate(`/${notification.fromUser.username}`);
        }
        break;
      default:
        navigate(`/${notification.fromUser.username}`);
    }
    
    // Close the modal after navigation
    onClose();
  };  const formatNotificationText = (notification: Notification) => {
    const handleUsernameClick = (e: React.MouseEvent, username: string) => {
      e.stopPropagation();
      navigate(`/${username}`);
      onClose();
    };

    const UsernameLink = ({ username }: { username: string }) => (
      <span
        style={{
          fontWeight: 'bold',
          color: '#000000',
          cursor: 'pointer',
          textDecoration: 'none'
        }}
        onClick={(e) => handleUsernameClick(e, username)}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = 'underline';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = 'none';
        }}
      >
        {username}
      </span>
    );

    switch (notification.type) {
      case 'follow':
        return (
          <>
            <UsernameLink username={notification.fromUser.username} /> started following you
          </>
        );
      case 'follow_request':
        return (
          <>
            <UsernameLink username={notification.fromUser.username} /> wants to follow you
          </>
        );
      case 'follow_request_accepted':
        return (
          <>
            <UsernameLink username={notification.fromUser.username} /> accepted your follow request
          </>
        );
      case 'follow_back_suggestion':
        return (
          <>
            <UsernameLink username={notification.fromUser.username} /> accepted your follow request. Follow back?
          </>
        );
      case 'like':
        return (
          <>
            <UsernameLink username={notification.fromUser.username} /> liked your post
          </>
        );
      case 'comment':
        return (
          <>
            <UsernameLink username={notification.fromUser.username} /> commented on your post
          </>
        );
      case 'mention':
        return (
          <>
            <UsernameLink username={notification.fromUser.username} /> mentioned you in a comment
          </>
        );
      case 'message':
        return (
          <>
            <UsernameLink username={notification.fromUser.username} /> sent you a message: {notification.message || 'New message'}
          </>
        );
      default:
        return 'New notification';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <PersonAddIcon color="primary" />;
      case 'follow_request':
        return <PersonAddIcon color="secondary" />;
      case 'follow_request_accepted':
        return <CheckIcon color="success" />;
      case 'follow_back_suggestion':
        return <PersonAddIcon color="info" />;
      case 'like':
        return <FavoriteIcon color="error" />;
      case 'comment':
        return <CommentIcon color="action" />;
      case 'message':
        return <MessageIcon color="primary" />;
      default:
        return <CheckIcon color="action" />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Notifications</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {groupNotificationsByDate(notifications).map((group, groupIndex) => (
              <React.Fragment key={group.label}>
                {/* Date Header */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    backgroundColor: 'grey.50',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontSize: '0.75rem'
                    }}
                  >
                    {group.label}
                  </Typography>
                </Box>
                
                {/* Notifications for this date */}
                {group.notifications.map((notification, index) => {
                  // Skip notifications with missing fromUser data
                  if (!notification.fromUser || !notification.fromUser.username) {
                    console.warn('Skipping notification with missing fromUser:', notification);
                    return null;
                  }
                  
                  return (
                  <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    cursor: notification.type === 'follow_request' ? 'default' : 'pointer',
                    color: '#000000', // Always black text
                    '&:hover': {
                      backgroundColor: notification.isRead ? 'action.hover' : 'action.selected'
                    }
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={notification.fromUser.profilePicture}
                      alt={notification.fromUser.username}
                      sx={{ width: 44, height: 44 }}
                    >
                      {notification.fromUser.username[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#000000' }}>
                          {formatNotificationText(notification)}
                        </Typography>
                        {!notification.isRead && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'primary.main',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notification.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    }
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Show post thumbnail for post-related notifications */}
                    {notification.post && notification.post.media && notification.post.media.length > 0 && (
                      <Avatar
                        src={notification.post.media[0].url}
                        variant="rounded"
                        sx={{ width: 44, height: 44 }}
                      />
                    )}
                    
                    {/* Show follow-back button for follow notifications only if not already following */}
                    {(notification.type === 'follow' || notification.type === 'follow_back_suggestion' || notification.type === 'follow_request_accepted') && !followingUsers.has(notification.fromUser.id) && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowBack(notification.id, notification.fromUser.id);
                        }}
                        disabled={followLoading.has(notification.fromUser.id)}
                      >
                        {followLoading.has(notification.fromUser.id) ? (
                          <CircularProgress size={16} />
                        ) : (
                          'Follow Back'
                        )}
                      </Button>
                    )}
                    
                    {/* Show approve/decline buttons for follow request notifications */}
                    {notification.type === 'follow_request' && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowRequestAction(notification.id, 'approve', notification.fromUser.id);
                          }}
                          disabled={followRequestLoading.has(notification.id)}
                          sx={{ minWidth: 70 }}
                        >
                          {followRequestLoading.has(notification.id) ? (
                            <CircularProgress size={16} />
                          ) : (
                            'Approve'
                          )}
                        </Button>
                        
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowRequestAction(notification.id, 'decline', notification.fromUser.id);
                          }}
                          disabled={followRequestLoading.has(notification.id)}
                          sx={{ minWidth: 70 }}
                        >
                          {followRequestLoading.has(notification.id) ? (
                            <CircularProgress size={16} />
                          ) : (
                            'Decline'
                          )}
                        </Button>
                      </>
                    )}
                    
                    {/* Show "Following" indicator for users already being followed */}
                    {notification.type === 'follow' && followingUsers.has(notification.fromUser.id) && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ 
                          px: 1.5, 
                          py: 0.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}
                      >
                        Following
                      </Typography>
                    )}
                    
                    {/* Notification type icon */}
                    <Box sx={{ ml: 1 }}>
                      {getNotificationIcon(notification.type)}
                    </Box>
                  </Box>
                </ListItem>
                
                {index < group.notifications.length - 1 && <Divider />}
              </React.Fragment>
            );}
            )}
                
                {/* Divider between date groups */}
                {groupIndex < groupNotificationsByDate(notifications).length - 1 && (
                  <Divider sx={{ my: 2, borderColor: 'primary.main', borderWidth: 1 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsModal;