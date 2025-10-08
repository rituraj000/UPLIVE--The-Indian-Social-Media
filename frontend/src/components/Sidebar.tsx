import React from 'react';
import { Box, Typography, Paper, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UserSuggestions from './UserSuggestions';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLinkClick = (item: string) => {
    if (item === 'About') {
      navigate('/about');
    }
    // Add other link handlers here for Help, Press, API, Jobs, Privacy, Terms
  };

  return (
    <Box sx={{ position: 'sticky', top: 20 }}>
      <UserSuggestions />
      
      {/* Footer Links */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mt: 3, 
          bgcolor: '#1F1F35',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms'].map((item) => (
            <Link
              key={item}
              component="button"
              onClick={() => handleLinkClick(item)}
              variant="body2"
              sx={{ 
                textDecoration: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.8rem',
                fontWeight: 500,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                '&:hover': { 
                  textDecoration: 'underline',
                  color: '#A855F7'
                },
                transition: 'color 0.2s ease-in-out'
              }}
            >
              {item}
            </Link>
          ))}
        </Box>
        <Typography 
          variant="caption" 
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.75rem',
            fontWeight: 500
          }}
        >
          © 2025 UPLIVE - The Indian Social Media
        </Typography>
      </Paper>
    </Box>
  );
};

export default Sidebar;