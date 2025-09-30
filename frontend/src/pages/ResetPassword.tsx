import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormHelperText
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ResetPassword: React.FC = () => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  
  // Check password strength
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });

  useEffect(() => {
    // Extract token from URL query parameters
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setTokenError(true);
    }
  }, [location]);
  
  useEffect(() => {
    // Simple password strength checker
    const checkStrength = (pass: string) => {
      if (!pass) {
        return { score: 0, feedback: '' };
      }
      
      let score = 0;
      
      // Length check
      if (pass.length >= 8) score += 1;
      if (pass.length >= 12) score += 1;
      
      // Complexity checks
      if (/[A-Z]/.test(pass)) score += 1;
      if (/[a-z]/.test(pass)) score += 1;
      if (/[0-9]/.test(pass)) score += 1;
      if (/[^A-Za-z0-9]/.test(pass)) score += 1;
      
      let feedback = '';
      if (score < 3) feedback = 'Weak password';
      else if (score < 5) feedback = 'Moderate password';
      else feedback = 'Strong password';
      
      return { score, feedback };
    };
    
    setPasswordStrength(checkStrength(password));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }
    
    if (!password) {
      setError('Please enter a new password');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength.score < 3) {
      setError('Please use a stronger password');
      return;
    }

    const correlationId = uuidv4();
    setLoading(true);
    setError('');

    try {
      // Use the dedicated authApi method with token and password parameters
      const response = await authApi.resetPassword(token, password);
      
      console.log('Password reset successful', { correlationId });
      
      // If we got a token back, log the user in automatically
      if (response.data.token && response.data.user) {
        auth.loginWithToken(response.data.token, response.data.user);
        navigate('/');
      } else {
        // Otherwise just redirect to login
        navigate('/login', { 
          state: { 
            message: 'Your password has been reset. Please log in with your new password.' 
          } 
        });
      }
      
    } catch (err: any) {
      console.error('Password reset error', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred while resetting your password. Please try again.');
      }
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
            backgroundColor: 'primary.main', 
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <LockOutlined sx={{ fontSize: 40, color: 'white' }} />
          </Box>

          <Typography component="h1" variant="h5" fontWeight="bold">
            Reset Password
          </Typography>

          {tokenError ? (
            <Box sx={{ mt: 3, width: '100%', textAlign: 'center' }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                Invalid or missing reset token. Please request a new password reset.
              </Alert>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/forgot-password')}
                sx={{ mt: 2 }}
              >
                Request New Reset Link
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
              <Typography variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
                Enter your new password below.
              </Typography>
              
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {password && (
                <FormHelperText 
                  sx={{ 
                    ml: 1.5,
                    color: 
                      passwordStrength.score < 3 ? 'error.main' :
                      passwordStrength.score < 5 ? 'warning.main' : 'success.main'
                  }}
                >
                  {passwordStrength.feedback}
                </FormHelperText>
              )}

              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={confirmPassword !== '' && password !== confirmPassword}
                helperText={confirmPassword !== '' && password !== confirmPassword ? 'Passwords do not match' : ''}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Reset Password'}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Remember your password?{' '}
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Typography component="span" color="primary" variant="body2">
              Back to login
            </Typography>
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default ResetPassword;