import React from 'react';
import { Avatar as MuiAvatar, AvatarProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface GradientAvatarWrapperProps {
  hasStory?: boolean;
  size?: number;
}

const GradientAvatarWrapper = styled('div')<GradientAvatarWrapperProps>(({ hasStory = false, size = 40 }) => ({
  position: 'relative',
  borderRadius: '50%',
  padding: hasStory ? '3px' : '0',
  background: hasStory 
    ? 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)' 
    : 'transparent',
  display: 'inline-block',
  width: hasStory ? size + 6 : size,
  height: hasStory ? size + 6 : size,
}));

const StyledAvatar = styled(MuiAvatar, {
  shouldForwardProp: (prop) => prop !== 'avatarSize',
})<{ avatarSize: number }>(({ avatarSize }) => ({
  width: avatarSize,
  height: avatarSize,
  border: '2px solid #1F1F35',
  fontSize: `${avatarSize * 0.4}px`,
  fontWeight: 600,
  background: 'linear-gradient(135deg, #374151 0%, #4B5563 100%)',
  color: '#FFFFFF',
}));

interface EnhancedAvatarProps extends Omit<AvatarProps, 'sx'> {
  hasStory?: boolean;
  size?: number;
}

const EnhancedAvatar: React.FC<EnhancedAvatarProps> = ({ 
  hasStory = false, 
  size = 40, 
  ...props 
}) => {
  return (
    <GradientAvatarWrapper hasStory={hasStory} size={size}>
      <StyledAvatar avatarSize={size} {...props} />
    </GradientAvatarWrapper>
  );
};

export default EnhancedAvatar;