import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import LockResetIcon from '@mui/icons-material/LockReset';
import { v4 as uuidv4 } from 'uuid';
import { authApi } from '../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const correlationId = uuidv4();
    setLoading(true);
    setError('');

    try {
      // Use the dedicated authApi method with email parameter
      await authApi.forgotPassword(email);
      
      console.log('Forgot password request sent', { correlationId });
      setSuccess(true);
      
      // We'll always get a 200 response to prevent email enumeration
    } catch (err: any) {
      console.error('Forgot password error', err);
      
      // Don't expose specific errors to prevent email enumeration
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={6}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Box sx={{ 
            mb: 2, 
            p: 2, 
            backgroundColor: 'primary.light', 
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <LockResetIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>

          <Typography component="h1" variant="h5" fontWeight="bold">
            Forgot Password
          </Typography>

          {success ? (
            <Box sx={{ mt: 3, width: '100%', textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                If an account with that email exists, we've sent password reset instructions.
              </Alert>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Please check your inbox and spam folder for the reset link.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{ mt: 2 }}
              >
                Return to Login
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
              <Typography variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
                Enter the email address associated with your account,
                and we'll send you a link to reset your password.
              </Typography>
              
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography color="primary" variant="body2">
                    Remember your password? Log in
                  </Typography>
                </Link>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{' '}
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <Typography component="span" color="primary" variant="body2">
              Sign up
            </Typography>
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default ForgotPassword;