import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledGradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
  border: 'none',
  borderRadius: '12px',
  padding: '12px 24px',
  fontWeight: 600,
  fontSize: '0.95rem',
  color: '#FFFFFF',
  textTransform: 'none',
  boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #9333EA 0%, #DB2777 100%)',
    boxShadow: '0 6px 25px rgba(168, 85, 247, 0.4)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
  },
  '&:disabled': {
    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.5) 0%, rgba(236, 72, 153, 0.5) 100%)',
    color: 'rgba(255, 255, 255, 0.5)',
    transform: 'none',
    boxShadow: 'none',
  },
}));

interface GradientButtonProps extends Omit<ButtonProps, 'color' | 'variant'> {
  children: React.ReactNode;
}

const GradientButton: React.FC<GradientButtonProps> = ({ children, ...props }) => {
  return (
    <StyledGradientButton {...props}>
      {children}
    </StyledGradientButton>
  );
};

export default GradientButton;