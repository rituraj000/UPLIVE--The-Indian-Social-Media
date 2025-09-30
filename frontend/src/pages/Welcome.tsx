import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';

const WelcomeContainer = styled(Container)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '20px',
});

const WelcomeCard = styled(Card)({
  maxWidth: 600,
  width: '100%',
  textAlign: 'center',
  borderRadius: '20px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
});

const FlagColors = styled(Box)({
  height: '8px',
  background: 'linear-gradient(90deg, #FF9933 33.33%, #FFFFFF 33.33% 66.66%, #138808 66.66%)',
  borderRadius: '20px 20px 0 0',
});

const Logo = styled(Typography)({
  fontFamily: 'Billabong, cursive',
  fontSize: '4rem',
  fontWeight: 'bold',
  background: 'linear-gradient(45deg, #FF9933, #138808)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  marginBottom: '1rem',
});

const PatrioticText = styled(Typography)({
  fontSize: '1.2rem',
  lineHeight: 1.8,
  color: '#2c3e50',
  marginBottom: '2rem',
  fontWeight: 500,
});

const StartButton = styled(Button)({
  background: 'linear-gradient(45deg, #FF9933, #138808)',
  color: 'white',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  padding: '15px 40px',
  borderRadius: '50px',
  textTransform: 'none',
  boxShadow: '0 8px 25px rgba(255, 153, 51, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 35px rgba(255, 153, 51, 0.4)',
    background: 'linear-gradient(45deg, #e68829, #0f7506)',
  },
});

const Welcome: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const handleStart = async () => {
    setLoading(true);
    try {
      // Mark user as having seen the welcome page
      await usersApi.updateProfileSettings({ hasSeenWelcome: true });
      updateUser({ hasSeenWelcome: true });
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error updating welcome status:', error);
      // Even if API call fails, navigate to prevent user from being stuck
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WelcomeContainer maxWidth={false}>
      <WelcomeCard>
        <FlagColors />
        <CardContent sx={{ p: 5 }}>
          <Logo>UPLIVE</Logo>
          
          <PatrioticText>
            This is a Social Media App created by <strong>Indian dev</strong> for the people of India.
          </PatrioticText>
          
          <PatrioticText>
            Stop sending your personal data to other countries—let's keep our data safe within our nation.
          </PatrioticText>
          
          <PatrioticText sx={{ mb: 4 }}>
            Let's stand with India, grow with India, and build a stronger digital future together.
          </PatrioticText>
          
          <StartButton
            onClick={handleStart}
            disabled={loading}
            size="large"
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
            ) : null}
            {loading ? "Starting..." : "Let's Start"}
          </StartButton>
        </CardContent>
      </WelcomeCard>
    </WelcomeContainer>
  );
};

export default Welcome;