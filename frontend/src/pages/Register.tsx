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
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  Check as CheckIcon, 
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon 
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api'; // Assuming this is where checkUsername is

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
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    fullName: '',
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userId, setUserId] = useState('');
  const [showOTPField, setShowOTPField] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  
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
        message: 'Username must be at least 3 characters.'
      });
      return;
    }

    setUsernameStatus(prev => ({ ...prev, checking: true, message: 'Checking...' }));
    
    try {
      // NOTE: Update api.ts to ensure this points to the new backend route
      const response = await usersApi.checkUsername(username);
      setUsernameStatus({
        checking: false,
        available: response.data.available,
        message: response.data.message
      });
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameStatus({
        checking: false,
        available: null,
        message: 'Could not check availability. Try again.'
      });
    }
  }, []);

  // Debounce username checking
  useEffect(() => {
    // Clear previous status when the user starts typing again
    setUsernameStatus(prev => ({ ...prev, available: null, message: '' }));
    
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
    
    // Client-side quick check to match backend validation (optional, but good practice)
    if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    setLoading(true);

    try {
      const registrationData = {
        username: formData.username,
        fullName: formData.fullName,
        password: formData.password,
        ...(verificationMethod === 'email' 
          ? { email: formData.email } 
          : { phoneNumber: formData.phoneNumber }
        )
      };

      const result = await register(registrationData);
      if (result?.success) {
        if (result.verificationMethod === 'email') {
          setRegistrationSuccess(true);
        } else if (result.verificationMethod === 'phone') {
          setUserId(result.userId || '');
          setShowOTPField(true);
          setRegistrationSuccess(true);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const { authApi } = await import('../services/api');
      const response = await authApi.verifyOTP({ 
        phoneNumber: formData.phoneNumber, 
        otp, 
        userId 
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'OTP verification failed';
      setError(errorMessage);
    } finally {
      setOtpLoading(false);
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

            {registrationSuccess && verificationMethod === 'email' && !showOTPField && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  🇮🇳 Account Created Successfully!
                </Typography>
                <Typography variant="body2">
                  Please check your email and click the verification link to complete your registration.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontSize: '0.875rem', color: '#666' }}>
                  Don't forget to check your spam folder if you don't see the email.
                </Typography>
              </Alert>
            )}

            {registrationSuccess && verificationMethod === 'phone' && !showOTPField && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  🇮🇳 Account Created Successfully!
                </Typography>
                <Typography variant="body2">
                  An OTP has been sent to your phone number. Please verify to complete registration.
                </Typography>
              </Alert>
            )}

            {!registrationSuccess && (
              <>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Choose your verification method:
                </Typography>
                
                <ToggleButtonGroup
                  value={verificationMethod}
                  exclusive
                  onChange={(e, value) => value && setVerificationMethod(value)}
                  sx={{ mb: 2, width: '100%' }}
                >
                  <ToggleButton value="email" sx={{ flex: 1 }}>
                    <EmailIcon sx={{ mr: 1 }} /> Email
                  </ToggleButton>
                  <ToggleButton value="phone" sx={{ flex: 1 }}>
                    <PhoneIcon sx={{ mr: 1 }} /> Phone
                  </ToggleButton>
                </ToggleButtonGroup>

                <Box component="form" onSubmit={handleSubmit}>
                  {verificationMethod === 'email' ? (
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
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      margin="normal"
                      required
                      autoFocus
                      placeholder="+91 XXXXXXXXXX"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                  
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
                    label="Password (min 6 characters)"
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
                    disabled={loading || usernameStatus.checking || usernameStatus.available === false || !formData.password || formData.password.length < 6}
                  >
                    {loading ? 'Signing up...' : 'Sign up'}
                  </Button>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  By signing up, you agree to our Terms, Data Policy and Cookies Policy.
                </Typography>
              </>
            )}

            {showOTPField && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Please enter the 6-digit OTP sent to {formData.phoneNumber}
                  </Typography>
                </Alert>
                
                <TextField
                  fullWidth
                  label="Enter OTP"
                  type="number"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  margin="normal"
                  required
                  placeholder="Enter 6-digit OTP"
                />
                
                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || !otp.trim() || otp.length !== 6}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {otpLoading ? <CircularProgress size={24} /> : 'Verify OTP'}
                </Button>
              </Box>
            )}

            {(registrationSuccess && verificationMethod === 'email') && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  sx={{ mb: 2 }}
                >
                  Go to Login
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Didn't receive the email?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate('/verify-email')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Resend verification email
                  </Link>
                </Typography>
              </Box>
            )}
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