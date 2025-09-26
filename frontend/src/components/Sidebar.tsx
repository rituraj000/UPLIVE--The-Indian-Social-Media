import React from 'react';
import { Box, Typography } from '@mui/material';

const Sidebar: React.FC = () => {
  return (
    <Box>
      <Typography variant="h6">Suggestions for You</Typography>
      <Typography variant="body2">User suggestions will be displayed here</Typography>
    </Box>
  );
};

export default Sidebar;