import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Link,
  Container,
  Alert,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';

const RegisterContainer = styled(Container)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#fafafa',
});

const RegisterCard = styled(Card)({
  width: '100%',
  maxWidth: 350,
  textAlign: 'center',
});

const Logo = styled(Typography)({
  fontFamily: 'Billabong, cursive',
  fontSize: '3rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
});

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Username validation states
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: ''
  });

  const { register } = useAuth();
  const navigate = useNavigate();

  // Debounced username validation
  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus({
        checking: false,
        available: null,
        message: ''
      });
      return;
    }

    setUsernameStatus(prev => ({ ...prev, checking: true }));
    
    try {
      const response = await usersApi.checkUsername(username);
      setUsernameStatus({
        checking: false,
        available: response.data.available,
        message: response.data.message
      });
    } catch (error) {
      setUsernameStatus({
        checking: false,
        available: null,
        message: 'Error checking username'
      });
    }
  }, []);

  // Debounce username checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.username) {
        checkUsername(formData.username);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [formData.username, checkUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check if username is available before submitting
    if (usernameStatus.available === false) {
      setError('Username is not available. Please choose a different one.');
      return;
    }
    
    if (usernameStatus.checking) {
      setError('Please wait while we check username availability.');
      return;
    }
    
    setLoading(true);

    try {
      const success = await register(formData);
      if (success) {
        navigate('/welcome');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterContainer maxWidth="sm">
      <Box>
        <RegisterCard>
          <CardContent sx={{ p: 4 }}>
            <Logo>UPLIVE</Logo>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Sign up to see photos and videos from your friends.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                autoFocus
              />
              
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {usernameStatus.checking ? (
                        <CircularProgress size={20} />
                      ) : usernameStatus.available === true ? (
                        <CheckIcon sx={{ color: 'success.main' }} />
                      ) : usernameStatus.available === false ? (
                        <CloseIcon sx={{ color: 'error.main' }} />
                      ) : null}
                    </InputAdornment>
                  ),
                }}
                error={usernameStatus.available === false}
                helperText={usernameStatus.message}
              />
              
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || usernameStatus.checking || usernameStatus.available === false}
              >
                {loading ? 'Signing up...' : 'Sign up'}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              By signing up, you agree to our Terms, Data Policy and Cookies Policy.
            </Typography>
          </CardContent>
        </RegisterCard>

        <Card sx={{ mt: 1, maxWidth: 350, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2">
              Have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/login')}
                sx={{ fontWeight: 'bold' }}
              >
                Log in
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
    </RegisterContainer>
  );
};

export default Register;