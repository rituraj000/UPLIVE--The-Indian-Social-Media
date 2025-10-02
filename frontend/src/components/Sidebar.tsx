import React from 'react';
import { Box, Typography, Paper, Link } from '@mui/material';
import UserSuggestions from './UserSuggestions';

const Sidebar: React.FC = () => {
  return (
    <Box sx={{ position: 'sticky', top: 20 }}>
      <UserSuggestions />
      
      {/* Footer Links */}
      <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms'].map((item) => (
            <Link
              key={item}
              href="#"
              variant="caption"
              color="text.secondary"
              sx={{ 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {item}
            </Link>
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary">
          © 2025 UPLIVE - The Indian Social Media
        </Typography>
      </Paper>
    </Box>
  );
};

export default Sidebar;