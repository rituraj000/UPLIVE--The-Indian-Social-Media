import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import { User } from '../types';
import { usersApi, notificationsApi } from '../services/api';
import toast from 'react-hot-toast';

interface FollowRequestNotificationProps {
  notificationId: string;
  user: User;
  onAction: (notificationId: string, action: 'approved' | 'declined') => void;
}

const FollowRequestNotification: React.FC<FollowRequestNotificationProps> = ({
  notificationId,
  user,
  onAction
}) => {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await notificationsApi.approveFollowRequest(notificationId);
      toast.success(`Approved follow request from ${user.username}`);
      onAction(notificationId, 'approved');
    } catch (error: any) {
      console.error('Error approving follow request:', error);
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await notificationsApi.declineFollowRequest(notificationId);
      toast.success(`Declined follow request from ${user.username}`);
      onAction(notificationId, 'declined');
    } catch (error: any) {
      console.error('Error declining follow request:', error);
      toast.error(error.response?.data?.message || 'Failed to decline request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={user.profilePicture} 
            alt={user.username}
            sx={{ width: 40, height: 40 }}
          />
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2">
              <strong>{user.username}</strong> wants to follow you
            </Typography>
            {user.fullName && (
              <Typography variant="caption" color="text.secondary">
                {user.fullName}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleApprove}
              disabled={loading}
              sx={{ minWidth: 80 }}
            >
              {loading ? <CircularProgress size={16} /> : 'Approve'}
            </Button>
            
            <Button
              size="small"
              variant="outlined"
              onClick={handleDecline}
              disabled={loading}
              sx={{ minWidth: 80 }}
            >
              {loading ? <CircularProgress size={16} /> : 'Decline'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FollowRequestNotification;