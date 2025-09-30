import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Typography, Button, Box, Paper } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    
    // In production, we could send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          bgcolor="#f5f5f5"
          p={2}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Typography variant="h5" color="error" gutterBottom>
              Oops! Something went wrong.
            </Typography>
            
            <Typography variant="body1" color="textSecondary" paragraph>
              We're sorry for the inconvenience. Please try refreshing the page or go back home.
            </Typography>
            
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <Box 
                sx={{ 
                  mt: 3, 
                  p: 2, 
                  bgcolor: '#f8f8f8', 
                  borderRadius: 1,
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  Error Details:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
            
            <Box mt={4} display="flex" justifyContent="center" gap={2}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={this.handleReload}
                startIcon={<RefreshIcon />}
              >
                Refresh Page
              </Button>
              
              <Button 
                variant="outlined"
                onClick={this.handleGoHome}
              >
                Go Home
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;