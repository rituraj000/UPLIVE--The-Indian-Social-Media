import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface WelcomeRouteProps {
  children: React.ReactNode;
}

const WelcomeRoute: React.FC<WelcomeRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user has already seen welcome or is an existing user (undefined), redirect to home
  // Only show welcome page for users with hasSeenWelcome explicitly set to false
  if (user.hasSeenWelcome !== false) {
    return <Navigate to="/" replace />;
  }

  // User needs to see welcome page
  return <>{children}</>;
};

export default WelcomeRoute;