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
  CircularProgress,
  Chip
} from '@mui/material';
import { 
  Check as CheckIcon, 
  Close as CloseIcon, 
  Email as EmailIcon,
  Verified as VerifiedIcon 
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, usersApi } from '../services/api';

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

const OTPContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#f8f9fa',
  border: '2px dashed #dee2e6',
  borderRadius: '12px',
  padding: '20px',
  margin: '16px 0',
  transition: 'all 0.3s ease',
  '&.verified': {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  }
}));

interface OTPStatus {
  sent: boolean;
  verified: boolean;
  loading: boolean;
  error: string;
  countdown: number;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP status
  const [otpStatus, setOtpStatus] = useState<OTPStatus>({
    sent: false,
    verified: false,
    loading: false,
    error: '',
    countdown: 0,
  });
  
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

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpStatus.countdown > 0) {
      interval = setInterval(() => {
        setOtpStatus(prev => ({
          ...prev,
          countdown: prev.countdown - 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStatus.countdown]);

  // Send OTP function
  const handleSendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setOtpStatus(prev => ({ ...prev, loading: true, error: '' }));
    setError('');

    try {
      const response = await authApi.sendOTP(formData.email);
      
      if (response.data.success) {
        setOtpStatus({
          sent: true,
          verified: false,
          loading: false,
          error: '',
          countdown: 60, // 60 seconds countdown
        });
        setError('');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send verification code';
      setOtpStatus(prev => ({ ...prev, loading: false, error: errorMessage }));
      setError(errorMessage);
    }
  };

  // Verify OTP function
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setOtpStatus(prev => ({ ...prev, error: 'Please enter a valid 6-digit code' }));
      return;
    }

    setOtpStatus(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await authApi.verifyOTP(formData.email, otp);
      
      if (response.data.success) {
        setOtpStatus({
          sent: true,
          verified: true,
          loading: false,
          error: '',
          countdown: 0,
        });
        setError('');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Invalid verification code';
      setOtpStatus(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  };

  // Reset OTP when email changes
  useEffect(() => {
    if (otpStatus.sent || otpStatus.verified) {
      setOtpStatus({
        sent: false,
        verified: false,
        loading: false,
        error: '',
        countdown: 0,
      });
      setOtp('');
    }
  }, [formData.email]);

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
    
    // Check if email is verified
    if (!otpStatus.verified) {
      setError('Please verify your email address before registering.');
      return;
    }
    
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
            
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                color: '#FF9933',
                fontWeight: 'bold',
                display: 'block',
                textAlign: 'center',
                mb: 2,
                lineHeight: 1
              }}
            >
              🇮🇳 Made in India, for India
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {/* Email Field */}
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
                InputProps={{
                  endAdornment: otpStatus.verified ? (
                    <InputAdornment position="end">
                      <VerifiedIcon sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  ) : null,
                }}
              />

              {/* OTP Verification Section */}
              {formData.email && !otpStatus.verified && (
                <OTPContainer className={otpStatus.verified ? 'verified' : ''}>
                  {!otpStatus.sent ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                        Verify your email address
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={handleSendOTP}
                        disabled={otpStatus.loading}
                        startIcon={otpStatus.loading ? <CircularProgress size={20} /> : <EmailIcon />}
                        fullWidth
                      >
                        {otpStatus.loading ? 'Sending...' : 'Send Verification Code'}
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter the 6-digit code sent to your email
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputProps={{ 
                            maxLength: 6,
                            style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }
                          }}
                          sx={{ flex: 1 }}
                        />
                        <Button
                          variant="contained"
                          onClick={handleVerifyOTP}
                          disabled={otpStatus.loading || otp.length !== 6}
                          sx={{ minWidth: 'auto', p: 1.5 }}
                        >
                          {otpStatus.loading ? <CircularProgress size={20} /> : <CheckIcon />}
                        </Button>
                      </Box>

                      {otpStatus.error && (
                        <Alert severity="error" sx={{ mt: 1, fontSize: '0.8rem' }}>
                          {otpStatus.error}
                        </Alert>
                      )}

                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        {otpStatus.countdown > 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            Resend code in {otpStatus.countdown}s
                          </Typography>
                        ) : (
                          <Button
                            variant="text"
                            size="small"
                            onClick={handleSendOTP}
                            disabled={otpStatus.loading}
                          >
                            Resend Code
                          </Button>
                        )}
                      </Box>
                    </Box>
                  )}
                </OTPContainer>
              )}

              {/* Email Verified Status */}
              {otpStatus.verified && (
                <Alert severity="success" sx={{ mt: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedIcon />
                    Email verified successfully!
                  </Box>
                </Alert>
              )}
              
              {/* Other Fields - Only show after email verification */}
              {otpStatus.verified && (
                <>
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
                </>
              )}
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

        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '0.7rem',
            color: '#FF9933',
            fontWeight: 'bold',
            display: 'block',
            textAlign: 'center',
            mt: 2,
            lineHeight: 1
          }}
        >
          🇮🇳 Made in India, for India
        </Typography>
      </Box>
    </RegisterContainer>
  );
};

export default Register;