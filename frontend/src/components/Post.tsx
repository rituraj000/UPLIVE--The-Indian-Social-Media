import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  IconButton,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  MoreHoriz as MoreHorizIcon,
  MonetizationOn as SupportIcon,
  VolumeOff as VolumeOffIcon,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material';
import { Post as PostType, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { postsApi } from '../services/api';
import toast from 'react-hot-toast';
import styles from './Post.module.css';

interface PostProps {
  post: PostType;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onSupport?: () => void;
  onFollow?: (userId: string) => void;
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
  followLoading?: boolean;
}

const Post: React.FC<PostProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  onSupport,
  onFollow,
  isLiked = false,
  isSaved = false,
  isFollowing = false,
  followLoading = false
}) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Videos start muted by default
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const heartIdRef = useRef(0);

  // Intersection Observer for video autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Video is in view, play it
            video.play().catch(console.error);
          } else {
            // Video is out of view, pause it
            video.pause();
          }
        });
      },
      {
        threshold: 0.5, // Play when 50% of video is visible
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [post.media]);

  // Handle mute/unmute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  // Format date relative to now
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

  // Handle double tap to like with heart animation (only likes, never unlikes)
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!currentUser) {
      toast.error('Please login to like posts');
      return;
    }

    // Get the position of the click relative to the media container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add heart animation at click position
    const heartId = heartIdRef.current++;
    setHearts(prev => [...prev, { id: heartId, x, y }]);

    // Remove heart after animation
    setTimeout(() => {
      setHearts(prev => prev.filter(heart => heart.id !== heartId));
    }, 1000);

    // Only like the post if it's not already liked
    if (!isLiked && onLike) {
      onLike();
    }
  };

  // Parse caption for mentions and hashtags
  const parseCaption = (caption: string) => {
    const words = caption.split(' ');
    return words.map((word, index) => {
      if (word.startsWith('@')) {
        return (
          <span key={index} className={styles.mention}>
            {word}
          </span>
        );
      } else if (word.startsWith('#')) {
        return (
          <span key={index} className={styles.hashtag}>
            {word}
          </span>
        );
      }
      return word + ' ';
    });
  };

  // Truncate caption if too long
  const truncateCaption = (caption: string, maxLength: number = 125) => {
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + '...';
  };

  const displayCaption = post.caption ? (
    showFullCaption || post.caption.length <= 125 
      ? post.caption 
      : truncateCaption(post.caption)
  ) : '';

  return (
    <article className={styles.post}>
      {/* 1. Top Header - Creator Information */}
      <header className={styles.postHeader}>
        <div className={styles.creatorInfo}>
          <Avatar
            src={post.user.profilePicture}
            alt={post.user.username}
            className={styles.profilePicture}
            onClick={() => navigate(`/${post.user.username}`)}
          />
          <div className={styles.userDetails}>
            <Typography 
              variant="subtitle2" 
              className={styles.username}
              onClick={() => navigate(`/${post.user.username}`)}
            >
              {post.user.username}
              {post.user.isVerified && <span className={styles.verified}>✓</span>}
            </Typography>
            {post.location && (
              <Typography variant="caption" className={styles.location}>
                {post.location.name}
              </Typography>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Follow Button - only show if not following and not own post */}
          {currentUser && currentUser.id !== post.user.id && !isFollowing && (
            <Button
              className={styles.followButton}
              onClick={() => onFollow?.(post.user.id)}
              disabled={followLoading || !currentUser}
              startIcon={followLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {followLoading ? 'Following...' : 'Follow'}
            </Button>
          )}
          
          <IconButton className={styles.optionsMenu} size="small">
            <MoreHorizIcon />
          </IconButton>
        </div>
      </header>

      {/* 2. Media Component */}
      {post.media && post.media.length > 0 && (
        <div className={`${styles.mediaContainer} ${post.media[0].type === 'video' ? styles.videoMedia : ''}`}>
          {post.media[0].type === 'image' ? (
            <img
              src={post.media[0].url}
              alt={post.caption || 'Post image'}
              className={styles.postImage}
              onDoubleClick={handleDoubleClick}
              loading="lazy"
            />
          ) : (
            <div className={styles.videoContainer}>
              <video
                ref={videoRef}
                src={post.media[0].url}
                className={styles.postVideo}
                muted={isMuted}
                loop
                playsInline
                onDoubleClick={handleDoubleClick}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {/* Mute/Unmute Button */}
              <IconButton
                className={styles.muteButton}
                onClick={toggleMute}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  },
                  zIndex: 1,
                  width: 32,
                  height: 32
                }}
              >
                {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
              </IconButton>
            </div>
          )}
          
          {/* Heart Animations */}
          {hearts.map((heart) => (
            <div
              key={heart.id}
              className={styles.heartAnimation}
              style={{
                left: heart.x - 25, // Center the heart (50px width / 2)
                top: heart.y - 25,  // Center the heart (50px height / 2)
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              <FavoriteIcon 
                sx={{
                  fontSize: 50,
                  color: '#ff3040',
                  filter: 'drop-shadow(0 0 10px rgba(255, 48, 64, 0.5))'
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 3. Interaction Bar */}
      <div className={styles.interactionBar}>
        <div className={styles.primaryActions}>
          <IconButton 
            className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
            onClick={onLike}
            disabled={!currentUser}
          >
            {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          
          <IconButton 
            className={styles.actionButton}
            onClick={onComment}
            disabled={!currentUser}
          >
            <CommentIcon />
          </IconButton>
          <Typography variant="body2" className={`${styles.actionLabel} ${styles.mobileHidden}`}>
            Comment
          </Typography>
          
          <IconButton 
            className={styles.actionButton}
            onClick={onShare}
            disabled={!currentUser}
          >
            <ShareIcon />
          </IconButton>
        </div>

        <div className={styles.secondaryActions}>
          <Button
            className={styles.supportButton}
            startIcon={<SupportIcon fontSize="small" />}
            onClick={onSupport}
            disabled={!currentUser}
          >
            Support
          </Button>
          
          <IconButton 
            className={`${styles.actionButton} ${isSaved ? styles.saved : ''}`}
            onClick={onSave}
            disabled={!currentUser}
          >
            {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
        </div>
      </div>

      {/* 4. Bottom Section - Caption & Metrics */}
      <div className={styles.postContent}>
        {/* Like Metric - Always show */}
        <Typography variant="body2" className={styles.likeMetric}>
          {post.likeCount === 0 ? (
            '0 likes'
          ) : post.likeCount === 1 ? (
            `Liked by ${post.likes[0]?.username || 'someone'}`
          ) : post.likeCount === 2 ? (
            `Liked by ${post.likes[0]?.username || 'someone'} and 1 other`
          ) : (
            <>
              Liked by <span className={styles.boldText}>{post.likes[0]?.username || 'someone'}</span> and <span className={styles.boldText}>{post.likeCount - 1} others</span>
            </>
          )}
        </Typography>

        {/* Caption Text */}
        {post.caption && (
          <Typography variant="body2" className={styles.caption}>
            <span 
              className={styles.usernameInCaption}
              onClick={() => navigate(`/${post.user.username}`)}
            >
              {post.user.username}
            </span>{' '}
            {parseCaption(displayCaption)}
            {post.caption.length > 125 && !showFullCaption && (
              <button 
                className={styles.showMore}
                onClick={() => setShowFullCaption(true)}
              >
                more
              </button>
            )}
          </Typography>
        )}

        {/* Comment Count - Always show */}
        <Typography 
          variant="body2" 
          className={styles.commentCount}
          onClick={onComment}
        >
          {post.commentCount === 0 ? (
            'No comments yet'
          ) : post.commentCount === 1 ? (
            '1 comment'
          ) : (
            `View all ${post.commentCount} comments`
          )}
        </Typography>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className={styles.hashtagContainer}>
            {post.hashtags.map((hashtag, index) => (
              <Chip
                key={index}
                label={`#${hashtag}`}
                size="small"
                className={styles.hashtagChip}
              />
            ))}
          </div>
        )}

        {/* Time Stamp */}
        <Typography variant="caption" className={styles.timestamp}>
          {formatDate(post.createdAt)}
        </Typography>
      </div>
    </article>
  );
};

export default Post;