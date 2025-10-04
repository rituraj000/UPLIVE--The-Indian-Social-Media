import React from 'react';
import {
  Box,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  styled
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { Conversation, User } from '../types';

// Styled components for message states
const MessageListItem = styled(ListItem)<{ isUnread?: boolean }>(({ theme, isUnread }) => ({
  padding: 0,
  '& .MuiListItemButton-root': {
    padding: theme.spacing(1.5, 2),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-selected': {
      backgroundColor: theme.palette.action.selected,
    },
  },
}));

const MessageListItemText = styled(ListItemText)<{ isUnread?: boolean }>(({ theme, isUnread }) => ({
  '& .MuiListItemText-primary': {
    fontWeight: isUnread ? 'bold' : 'normal',
    color: isUnread ? theme.palette.text.primary : theme.palette.text.secondary,
  },
  '& .MuiListItemText-secondary': {
    fontWeight: isUnread ? 'bold' : 'normal',
    color: isUnread ? theme.palette.text.primary : theme.palette.text.secondary,
  },
}));

const UnreadDot = styled(Box)(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: '#007AFF',
  marginLeft: theme.spacing(0.5),
  flexShrink: 0,
}));

interface ConversationListItemProps {
  conversation: Conversation;
  currentUser: User;
  selectedUser: User | null;
  onClick: (conversation: Conversation) => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  currentUser,
  selectedUser,
  onClick
}) => {
  const isUnread = conversation.unreadCount > 0;
  const isSelected = selectedUser?.id === conversation.user.id;
  
  // Generate preview text
  const getPreviewText = () => {
    if (!conversation.lastMessage) {
      return 'Click to open chat';
    }
    
    const isOwnMessage = conversation.lastMessage.sender.id === currentUser.id;
    const messagePrefix = isOwnMessage ? 'You: ' : '';
    
    // Extract content based on message type
    let content = '';
    if (conversation.lastMessage.content?.text) {
      content = conversation.lastMessage.content.text;
    } else if (conversation.lastMessage.content?.media) {
      content = conversation.lastMessage.content.media.type === 'image' ? 'Sent a photo' : 'Sent a video';
    } else if (conversation.lastMessage.content?.post) {
      content = 'Shared a post';
    } else {
      content = 'Sent a message';
    }
    
    if (isUnread && conversation.unreadCount > 1) {
      return `${conversation.unreadCount} new messages`;
    }
    
    return `${messagePrefix}${content}`;
  };

  // Format time
  const getTimeText = () => {
    if (!conversation.lastMessage) return '';
    
    const messageDate = new Date(conversation.lastMessage.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <MessageListItem isUnread={isUnread} disablePadding>
      <ListItemButton 
        onClick={() => onClick(conversation)}
        selected={isSelected}
      >
        <ListItemAvatar>
          <Avatar 
            src={conversation.user.profilePicture} 
            alt={conversation.user.username}
            sx={{ width: 50, height: 50 }}
          >
            <PersonIcon />
          </Avatar>
        </ListItemAvatar>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Top row: Username and time */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography 
              variant="subtitle1" 
              component="div"
              sx={{ 
                fontWeight: isUnread ? 'bold' : 'normal',
                color: isUnread ? 'text.primary' : 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                mr: 1
              }}
            >
              {conversation.user.username}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {conversation.lastMessage && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontWeight: isUnread ? 'bold' : 'normal',
                    mr: 0.5
                  }}
                >
                  {getTimeText()}
                </Typography>
              )}
              {isUnread && <UnreadDot />}
            </Box>
          </Box>
          
          {/* Bottom row: Message preview and unread count */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography 
              variant="body2" 
              component="div"
              sx={{ 
                fontWeight: isUnread ? 'bold' : 'normal',
                color: isUnread ? 'text.primary' : 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                mr: 1
              }}
            >
              {getPreviewText()}
            </Typography>
            
            {isUnread && conversation.unreadCount > 0 && (
              <Badge 
                badgeContent={conversation.unreadCount} 
                color="primary" 
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#007AFF',
                    color: 'white',
                    fontWeight: 'bold',
                    minWidth: 18,
                    height: 18,
                    fontSize: '0.7rem'
                  }
                }}
              />
            )}
          </Box>
        </Box>
      </ListItemButton>
    </MessageListItem>
  );
};

export default ConversationListItem;