import React from 'react';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import PostFeed from '../components/PostFeed';
import StoriesBar from '../components/StoriesBar';
import Sidebar from '../components/Sidebar';

const Home: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: 2,
        px: { xs: 0, md: 3 }, // No horizontal padding on mobile
        bgcolor: 'background.default',
        minHeight: '100vh'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 0, md: 3 }, // No gap on mobile
        minHeight: '100vh',
        position: 'relative'
      }}>
        <Box sx={{ 
          flex: 1, 
          maxWidth: { xs: '100%', md: '65%' },
          pb: { xs: '80px', md: '20px' } // Extra padding for mobile bottom nav
        }}>
          <StoriesBar />
          <PostFeed />
        </Box>
        <Box sx={{ 
          width: { xs: '100%', md: '35%' }, 
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: '20px',
          height: 'fit-content'
        }}>
          <Sidebar />
        </Box>
      </Box>
    </Container>
  );
};

export default Home;