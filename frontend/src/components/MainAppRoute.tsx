import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface MainAppRouteProps {
  children: React.ReactNode;
}

const MainAppRoute: React.FC<MainAppRouteProps> = ({ children }) => {
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

  // If user hasn't seen welcome page (explicitly set to false), redirect to welcome
  // Note: undefined hasSeenWelcome means existing user, so don't redirect
  if (user.hasSeenWelcome === false) {
    return <Navigate to="/welcome" replace />;
  }

  // User has seen welcome, show the main app
  return <>{children}</>;
};

export default MainAppRoute;