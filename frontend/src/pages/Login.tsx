import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Link,
  Divider,
  Container,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginContainer = styled(Container)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#fafafa',
});

const LoginCard = styled(Card)({
  width: '100%',
  maxWidth: 350,
  textAlign: 'center',
});

const Logo = styled(Typography)({
  fontFamily: 'Billabong, cursive',
  fontSize: '3rem',
  fontWeight: 'bold',
  marginBottom: '2rem',
});

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState(''); // Can be email or phone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Helper function to determine if input is email or phone
  const isEmail = (value: string) => {
    return value.includes('@');
  };

  const isPhoneNumber = (value: string) => {
    return /^\+?[1-9]\d{1,14}$/.test(value.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Determine login credentials based on input
      const credentials: { email?: string; phoneNumber?: string; password: string } = {
        password
      };

      if (isEmail(identifier)) {
        credentials.email = identifier;
      } else if (isPhoneNumber(identifier)) {
        // Format phone number for Indian numbers
        let formattedPhone = identifier.replace(/\s/g, '');
        if (!formattedPhone.startsWith('+')) {
          if (formattedPhone.length === 10 && !formattedPhone.startsWith('91')) {
            formattedPhone = '+91' + formattedPhone;
          } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
          }
        }
        credentials.phoneNumber = formattedPhone;
      } else {
        setError('Please enter a valid email address or phone number');
        setLoading(false);
        return;
      }

      const success = await login(credentials);
      if (success) {
        navigate('/');
      }
    } catch (err: any) {
      if (err.message === 'EMAIL_VERIFICATION_REQUIRED') {
        setError('Please verify your email before logging in. Check your inbox for the verification email.');
      } else if (err.message.includes('verify your phone')) {
        setError('Please verify your phone number before logging in.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer maxWidth="sm">
      <Box>
        <LoginCard>
          <CardContent sx={{ p: 4 }}>
            <Logo>UPLIVE</Logo>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email or Phone Number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                margin="normal"
                required
                autoFocus
                placeholder="Enter email or phone number (e.g., +919876543210)"
                helperText="You can login with either your email address or phone number"
              />
              
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </Box>

            <Divider sx={{ my: 2 }}>OR</Divider>

            <Link 
              component="button"
              variant="body2" 
              sx={{ display: 'block', mb: 2 }}
              onClick={() => navigate('/forgot-password')}
            >
              Forgot password?
            </Link>
          </CardContent>
        </LoginCard>

        <Card sx={{ mt: 1, maxWidth: 350, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/register')}
                sx={{ fontWeight: 'bold' }}
              >
                Sign up
              </Link>
            </Typography>
          </CardContent>
        </Card>

        {/* Made in India Message */}
        <Box sx={{ 
          mt: 3, 
          p: 2, 
          bgcolor: 'rgba(255, 153, 0, 0.1)', 
          borderRadius: 1, 
          border: '1px solid rgba(255, 153, 0, 0.2)',
          maxWidth: 350,
          width: '100%'
        }}>
          <Typography variant="body2" sx={{ 
            color: 'text.primary', 
            fontWeight: 'medium',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            textAlign: 'center'
          }}>
            🇮🇳 Made in India, for India
          </Typography>
        </Box>
      </Box>
    </LoginContainer>
  );
};

export default Login;