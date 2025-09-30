import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
  TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

const VerificationContainer = styled(Container)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#fafafa',
});

const VerificationCard = styled(Card)({
  maxWidth: 450,
  width: '100%',
  textAlign: 'center',
  borderRadius: '12px',
  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
});

const Logo = styled(Typography)({
  fontFamily: 'inherit',
  fontSize: '3rem',
  fontWeight: 'bold',
  background: 'linear-gradient(45deg, #FF9933, #138808)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  marginBottom: '1rem',
});

const FlagColors = styled(Box)({
  height: '4px',
  background: 'linear-gradient(90deg, #FF9933 33.33%, #FFFFFF 33.33% 66.66%, #138808 66.66%)',
  borderRadius: '2px 2px 0 0',
});

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('resend');
      setMessage('No verification token found. Please check your email or request a new verification link.');
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      setLoading(true);
      const response = await authApi.verifyEmail(token);
      
      if (response.data.token) {
        // Auto-login after successful verification
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setStatus('success');
        setMessage('Email verified successfully! Welcome to UPLIVE!');
        
        toast.success('🇮🇳 Welcome to UPLIVE! Your email has been verified.');
        
        // Redirect to home page
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error: any) {
      setStatus('error');
      const errorMessage = error.response?.data?.message || 'Verification failed';
      setMessage(errorMessage);
      
      if (errorMessage.includes('expired')) {
        setStatus('resend');
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await authApi.resendVerification(email);
      toast.success('Verification email sent! Please check your inbox.');
      setMessage('Verification email sent! Please check your inbox and spam folder.');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification email';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'resend': return 'warning';
      default: return 'info';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'resend': return '📧';
      default: return '⏳';
    }
  };

  return (
    <VerificationContainer maxWidth="sm">
      <VerificationCard>
        <FlagColors />
        <CardContent sx={{ p: 4 }}>
          <Logo>UPLIVE</Logo>
          
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            {getStatusIcon()} Email Verification
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress />
            </Box>
          )}

          <Alert severity={getStatusColor()} sx={{ mb: 3 }}>
            {message || 'Verifying your email address...'}
          </Alert>

          {status === 'success' && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                🇮🇳 Welcome to India's own social media platform!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You will be redirected shortly...
              </Typography>
            </Box>
          )}

          {status === 'resend' && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enter your email address to receive a new verification link:
              </Typography>
              
              <TextField
                fullWidth
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                variant="outlined"
              />
                
              <Button
                variant="contained"
                fullWidth
                onClick={handleResendVerification}
                disabled={loading || !email.trim()}
                sx={{
                  mt: 1,
                  background: 'linear-gradient(45deg, #FF9933, #138808)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #e68829, #0f7506)',
                  }
                }}
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <Button 
              variant="text" 
              onClick={() => navigate('/login')}
              sx={{ color: '#666' }}
            >
              Back to Login
            </Button>
          </Box>

          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'rgba(255, 153, 0, 0.1)', 
            borderRadius: 1,
            fontSize: '14px',
            color: '#666'
          }}>
            🇮🇳 Made in India, for India - Your data stays secure within our nation
          </Box>
        </CardContent>
      </VerificationCard>
    </VerificationContainer>
  );
};

export default EmailVerification;