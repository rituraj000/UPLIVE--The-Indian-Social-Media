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
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { notificationsApi, followApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import toast from 'react-hot-toast';
import styles from './NotificationsModal.module.css';

// Profile Avatar Component
interface ProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  story?: boolean;
  src?: string;
  username?: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ size = 'md', className = '', story = false, src, username }) => {
  const sizeClasses: Record<string, string> = {
    sm: styles.small,
    md: styles.medium,
    lg: styles.large,
  };
  
  return (
    <div className={`${styles.profileAvatar} ${story ? styles.withStory : ''}`}>
      <div className={`${styles.avatarCircle} ${sizeClasses[size]} ${className}`}>
        {src ? (
          <img 
            src={src} 
            alt={username} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              borderRadius: '50%' 
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const nextElement = target.nextElementSibling as HTMLElement;
              if (nextElement) {
                nextElement.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div 
          style={{ 
            display: src ? 'none' : 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          <PersonIcon sx={{ fontSize: size === 'sm' ? 16 : (size === 'md' ? 20 : 28) }} />
        </div>
      </div>
    </div>
  );
};

// Gradient Button Component
interface GradientButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

const GradientButton: React.FC<GradientButtonProps> = ({ children, className = '', onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${styles.gradientButton} ${className}`}
  >
    {children}
  </button>
);

// Notification Item Component
interface NotificationItemProps {
  notification: Notification;
  onNotificationClick: (notification: Notification) => void;
  onFollowBack: (notificationId: string, userId: string) => void;
  onFollowRequestAction: (notificationId: string, action: 'approve' | 'decline', userId: string) => void;
  followLoading: Set<string>;
  followRequestLoading: Set<string>;
  followingUsers: Set<string>;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onNotificationClick, 
  onFollowBack, 
  onFollowRequestAction, 
  followLoading, 
  followRequestLoading, 
  followingUsers 
}) => {
  const navigate = useNavigate();
  
  const handleUsernameClick = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    navigate(`/${username}`);
  };
  
  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <FavoriteIcon sx={{ fontSize: 18 }} className={styles.like} />;
      case 'comment':
        return <CommentIcon sx={{ fontSize: 18 }} className={styles.comment} />;
      case 'follow':
      case 'follow_request':
      case 'follow_back_suggestion':
        return <GroupIcon sx={{ fontSize: 18 }} className={styles.follow} />;
      case 'follow_request_accepted':
        return <GroupIcon sx={{ fontSize: 18 }} className={styles.followed} />;
      default:
        return <NotificationsIcon sx={{ fontSize: 18 }} className={styles.default} />;
    }
  };
  
  const getActionElement = () => {
    // Follow request notifications
    if (notification.type === 'follow_request') {
      return (
        <div className={styles.actionButtons}>
          <button
            className={styles.approveButton}
            onClick={(e) => {
              e.stopPropagation();
              onFollowRequestAction(notification.id, 'approve', notification.fromUser.id);
            }}
            disabled={followRequestLoading.has(notification.id)}
          >
            {followRequestLoading.has(notification.id) ? (
              <CircularProgress size={12} color="inherit" />
            ) : (
              'Approve'
            )}
          </button>
          <button
            className={styles.declineButton}
            onClick={(e) => {
              e.stopPropagation();
              onFollowRequestAction(notification.id, 'decline', notification.fromUser.id);
            }}
            disabled={followRequestLoading.has(notification.id)}
          >
            {followRequestLoading.has(notification.id) ? (
              <CircularProgress size={12} color="inherit" />
            ) : (
              'Decline'
            )}
          </button>
        </div>
      );
    }
    
    // Follow back button for follow notifications
    if (
      (notification.type === 'follow' || 
       notification.type === 'follow_back_suggestion' || 
       notification.type === 'follow_request_accepted') && 
      !followingUsers.has(notification.fromUser.id)
    ) {
      return (
        <GradientButton
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onFollowBack(notification.id, notification.fromUser.id);
          }}
          disabled={followLoading.has(notification.fromUser.id)}
        >
          {followLoading.has(notification.fromUser.id) ? (
            <CircularProgress size={12} color="inherit" />
          ) : (
            'Follow'
          )}
        </GradientButton>
      );
    }
    
    // Following indicator
    if (notification.type === 'follow' && followingUsers.has(notification.fromUser.id)) {
      return (
        <button className={styles.followingButton}>
          Following
        </button>
      );
    }
    
    // Post thumbnail for post-related notifications
    if (notification.post && notification.post.media && notification.post.media.length > 0) {
      return (
        <div className={styles.postThumbnail}>
          <img
            src={notification.post.media[0].url}
            alt="Post thumbnail"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "https://placehold.co/40x40/362a4d/ffffff?text=P";
            }}
          />
        </div>
      );
    }
    
    return null;
  };
  
  const formatNotificationText = () => {
    const username = notification.fromUser.username;
    
    switch (notification.type) {
      case 'follow':
        return 'started following you.';
      case 'follow_request':
        return 'wants to follow you.';
      case 'follow_request_accepted':
        return 'accepted your follow request.';
      case 'follow_back_suggestion':
        return 'accepted your follow request.';
      case 'like':
        return 'liked your latest reel.';
      case 'comment':
        return 'commented: "Amazing view!" on your post.';
      case 'mention':
        return 'mentioned you in a comment.';
      case 'message':
        return `sent you a message: ${notification.message || 'New message'}`;
      default:
        return 'sent you a notification.';
    }
  };
  
  const formatTime = () => {
    const date = new Date(notification.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <div 
      className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
      onClick={() => onNotificationClick(notification)}
    >
      <div className={styles.notificationLeft}>
        <ProfileAvatar 
          size="md" 
          src={notification.fromUser.profilePicture}
          username={notification.fromUser.username}
        />
        <div className={styles.notificationContent}>
          <span className={styles.notificationUsername}>
            {notification.fromUser.username}
          </span>
          <span className={styles.notificationText}>
            {formatNotificationText()}
          </span>
          <span className={styles.notificationTime}>
            {formatTime()}
          </span>
        </div>
      </div>
      <div className={styles.notificationRight}>
        <div className={`${styles.notificationIcon} ${notification.type === 'like' ? styles.like : notification.type === 'comment' ? styles.comment : notification.type.includes('follow') ? styles.follow : styles.default}`}>
          {getIcon()}
        </div>
        {getActionElement()}
        {!notification.isRead && <div className={styles.unreadIndicator} />}
      </div>
    </div>
  );
};
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

  // Don't render if not open
  if (!open) return null;

  return (
    <div className={styles.notificationModal}>
      {/* Background Overlay */}
      <div className={styles.backgroundOverlay} onClick={onClose}></div>

      {/* Notification Panel */}
      <div className={styles.notificationPanel}>
        {/* Header */}
        <div className={styles.notificationHeader}>
          <h2 className={styles.notificationTitle}>Notifications</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <CloseIcon sx={{ fontSize: 24 }} />
          </button>
        </div>

        {/* Notification List */}
        <div className={styles.notificationList}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <CircularProgress className={styles.loadingSpinner} />
            </div>
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <Typography variant="body2">
                No notifications yet
              </Typography>
            </div>
          ) : (
            <>
              <div className={styles.notificationSection}>
                <h3 className={styles.sectionTitle}>Today</h3>
                {groupNotificationsByDate(notifications)[0]?.notifications
                  ?.filter(n => n.fromUser && n.fromUser.username)
                  ?.map(notification => (
                    <NotificationItem 
                      key={notification.id}
                      notification={notification}
                      onNotificationClick={handleNotificationClick}
                      onFollowBack={handleFollowBack}
                      onFollowRequestAction={handleFollowRequestAction}
                      followLoading={followLoading}
                      followRequestLoading={followRequestLoading}
                      followingUsers={followingUsers}
                    />
                  ))
                }
              </div>
              
              {groupNotificationsByDate(notifications).slice(1).map((group, index) => (
                <div key={group.label} className={styles.notificationSection}>
                  <h3 className={styles.sectionTitle}>{group.label}</h3>
                  {group.notifications
                    ?.filter(n => n.fromUser && n.fromUser.username)
                    ?.map(notification => (
                      <NotificationItem 
                        key={notification.id}
                        notification={notification}
                        onNotificationClick={handleNotificationClick}
                        onFollowBack={handleFollowBack}
                        onFollowRequestAction={handleFollowRequestAction}
                        followLoading={followLoading}
                        followRequestLoading={followRequestLoading}
                        followingUsers={followingUsers}
                      />
                    ))
                  }
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;