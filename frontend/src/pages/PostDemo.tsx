import React from 'react';
import { Box, Typography } from '@mui/material';
import Post from '../components/Post';
import { Post as PostType, User } from '../types';

// Sample post data for demonstration
const sampleUser: User = {
  id: '1',
  username: 'creator_name',
  email: 'creator@example.com',
  fullName: 'Creative Creator',
  bio: 'Digital artist and content creator',
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
};

const samplePost: PostType = {
  id: '1',
  user: sampleUser,
  caption: 'Just captured this amazing moment during my latest photoshoot! The lighting was absolutely perfect and I couldn\'t be happier with how this turned out. What do you think? 📸✨ #photography #studentlife #supportyoungtalent #creative #art',
  media: [{
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=750&fit=crop&crop=face', // 4:5 aspect ratio portrait
    type: 'image' as const,
    publicId: 'sample_image'
  }],
  likes: [
    { ...sampleUser, id: '2', username: 'friend_1' },
    { ...sampleUser, id: '3', username: 'friend_2' },
    { ...sampleUser, id: '4', username: 'friend_3' },
  ],
  comments: [],
  location: {
    name: 'Honsia Clors'
  },
  tags: [],
  hashtags: ['photography', 'studentlife', 'supportyoungtalent', 'creative', 'art'],
  isArchived: false,
  commentsDisabled: false,
  likeCount: 47,
  commentCount: 12,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  updatedAt: new Date().toISOString(),
};

const PostDemo: React.FC = () => {
  return (
    <Box sx={{ 
      maxWidth: 470, // Match the post max-width
      mx: 'auto', 
      py: 2,
      px: { xs: 0, sm: 2 } // No padding on mobile, padding on larger screens
    }}>
      <Box sx={{ mb: 4, textAlign: 'center', px: { xs: 2, sm: 0 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Instagram-Style Post Design
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          This demonstrates the complete Instagram-style post layout with 4:5 aspect ratio images.
        </Typography>
      </Box>

      {/* Instagram-style Post */}
      <Post
        post={samplePost}
        isLiked={false}
        isSaved={false}
        isFollowing={false}
        followLoading={false}
        onLike={() => console.log('Like clicked')}
        onComment={() => console.log('Comment clicked')}
        onShare={() => console.log('Share clicked')}
        onSave={() => console.log('Save clicked')}
        onSupport={() => console.log('Support clicked')}
        onFollow={(userId: string) => console.log('Follow clicked for user:', userId)}
      />

      <Box sx={{ mt: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2, mx: { xs: 2, sm: 0 } }}>
        <Typography variant="h6" gutterBottom>
          Size Optimizations:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li><strong>Desktop:</strong> Max width 470px (reduced from 614px)</li>
          <li><strong>Tablet:</strong> Square aspect ratio (more compact)</li>
          <li><strong>Mobile:</strong> Full-width with 4:5 portrait ratio</li>
          <li><strong>Responsive Heights:</strong> Controlled max-height on larger screens</li>
        </ul>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Design Features:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li><strong>4:5 Aspect Ratio:</strong> Portrait images optimized for mobile feeds</li>
          <li><strong>Clean Background:</strong> White/light gray with subtle shadows</li>
          <li><strong>Top Header:</strong> 40px circular profile picture, bold username, optional location</li>
          <li><strong>Follow Button:</strong> Blue follow button appears for non-followed users, disappears after following</li>
          <li><strong>Full-width Images:</strong> Edge-to-edge display, double-tap to like</li>
          <li><strong>Interaction Bar:</strong> Like (red heart), Comment with label, Share, Support (orange button), Save</li>
          <li><strong>Bottom Section:</strong> Like metrics, caption with username, hashtags, comment count, timestamp</li>
          <li><strong>Typography:</strong> Clean sans-serif, proper hierarchy, bold usernames</li>
          <li><strong>Color Palette:</strong> White background, dark text, red likes, blue follow, orange support button</li>
          <li><strong>Mobile Responsive:</strong> Full-width on mobile, contained on desktop</li>
        </ul>
      </Box>
    </Box>
  );
};

export default PostDemo;