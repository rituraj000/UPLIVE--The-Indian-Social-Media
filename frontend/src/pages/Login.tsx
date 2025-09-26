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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
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
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoFocus
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

            <Link href="#" variant="body2" sx={{ display: 'block', mb: 2 }}>
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