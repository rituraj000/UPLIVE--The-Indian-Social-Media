import React from 'react';
import { Box } from '@mui/material';
import PostFeed from '../components/PostFeed';
import StoriesBar from '../components/StoriesBar';
import Sidebar from '../components/Sidebar';

const Home: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', gap: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: '65%' } }}>
        <StoriesBar />
        <PostFeed />
      </Box>
      <Box sx={{ 
        width: { xs: '100%', md: '35%' }, 
        display: { xs: 'none', md: 'block' } 
      }}>
        <Sidebar />
      </Box>
    </Box>
  );
};

export default Home;