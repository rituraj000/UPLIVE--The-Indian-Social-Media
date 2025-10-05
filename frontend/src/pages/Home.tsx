import React from 'react';
import { Box, Container, Typography, styled } from '@mui/material';
import PostFeed from '../components/PostFeed';
import StoriesBar from '../components/StoriesBar';
import Sidebar from '../components/Sidebar';

// Styled Logo Component
const Logo = styled(Typography)({
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: '2rem',
  fontWeight: 800,
  background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: '#A855F7', // Fallback color
  margin: 0,
  padding: '16px 0 8px 16px', // Left padding for left alignment
  textAlign: 'left', // Left aligned
});

const Home: React.FC = () => {
  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: { xs: 0, md: 2 }, // No vertical padding on mobile
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
          {/* UPLIVE Logo - Only visible on mobile */}
          <Box sx={{ 
            width: '100%', 
            background: 'transparent', // Same as page background
            display: { xs: 'block', md: 'none' }, // Only show on mobile/tablet
            mb: 1 // Small margin bottom for spacing
          }}>
            <Logo>UPLIVE</Logo>
          </Box>
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