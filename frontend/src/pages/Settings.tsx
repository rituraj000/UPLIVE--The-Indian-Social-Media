import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  IconButton,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Info as InfoIcon,
  Logout as LogoutIcon,
  Security as SecurityIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';
import PasswordChange from '../components/PasswordChange';
import WalletSection from '../components/WalletSection';
import { useAuth } from '../context/AuthContext';
import { usersApi, notificationsApi } from '../services/api';
import { User } from '../types';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user: currentUser, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isPrivate, setIsPrivate] = useState(currentUser?.isPrivate || false);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchData();
      setIsPrivate(currentUser.isPrivate);
    }
  }, [currentUser]);

  const fetchData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Try to fetch follow requests, but handle 404 gracefully
      try {
        const requestsRes = await usersApi.getFollowRequests();
        setFollowRequests(requestsRes.data);
      } catch (requestError: any) {
        if (requestError.response?.status === 404) {
          console.log('Follow requests endpoint not available yet, using fallback');
          setFollowRequests([]); // Set empty array as fallback
        } else {
          throw requestError; // Re-throw non-404 errors
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPrivacy = event.target.checked;
    setUpdating(true);
    
    try {
      await usersApi.updatePrivacySetting(newPrivacy);
      setIsPrivate(newPrivacy);
      toast.success(`Account is now ${newPrivacy ? 'private' : 'public'}`);
      
      // Update user context if available
      if (updateUser) {
        updateUser({ ...currentUser!, isPrivate: newPrivacy });
      }
    } catch (error: any) {
      console.error('Error updating privacy:', error);
      if (error.response?.status === 404) {
        toast.error('Privacy settings feature is being updated. Please try again later.');
      } else {
        toast.error('Failed to update privacy setting');
      }
      // Revert the toggle
      event.target.checked = !newPrivacy;
    } finally {
      setUpdating(false);
    }
  };

  const handleFollowRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        await usersApi.acceptFollowRequest(requestId);
        toast.success('Follow request accepted');
      } else {
        await usersApi.declineFollowRequest(requestId);
        toast.success('Follow request declined');
      }
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error(`Error ${action}ing follow request:`, error);
      if (error.response?.status === 404) {
        toast.error('Follow request feature is being updated. Please try again later.');
      } else {
        toast.error(`Failed to ${action} follow request`);
      }
    }
  };

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate('/');
  };

  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: { xs: '100%', sm: 500, md: 600 }, 
      mx: 'auto', 
      p: { xs: 1, sm: 2 }
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: { xs: 2, sm: 3 },
        px: { xs: 1, sm: 0 }
      }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
          Settings
        </Typography>
      </Box>

      {/* Privacy Settings */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 },
        mx: { xs: 1, sm: 0 },
        borderRadius: { xs: 0, sm: 1 },
        boxShadow: { xs: 'none', sm: 1 },
        border: { xs: '1px solid', sm: 'none' },
        borderColor: 'divider'
      }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          {isPrivate ? <LockIcon /> : <PublicIcon />}
          Privacy Settings
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={isPrivate}
              onChange={handlePrivacyChange}
              disabled={updating}
            />
          }
          label={
            <Box>
              <Typography variant="subtitle1">
                Private Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isPrivate 
                  ? "Only approved followers can see your posts and message you"
                  : "Anyone can see your posts and message you"
                }
              </Typography>
            </Box>
          }
        />
        
        {updating && (
          <Box sx={{ mt: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1, display: 'inline' }}>
              Updating privacy setting...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Follow Requests (only show if private account) */}
      {isPrivate && followRequests.length > 0 && (
        <Paper sx={{ 
          mb: { xs: 2, sm: 3 },
          mx: { xs: 1, sm: 0 },
          borderRadius: { xs: 0, sm: 1 },
          boxShadow: { xs: 'none', sm: 1 },
          border: { xs: '1px solid', sm: 'none' },
          borderColor: 'divider'
        }}>
          <Box sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            borderBottom: 1, 
            borderColor: 'divider' 
          }}>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Follow Requests
              <Badge badgeContent={followRequests.length} color="primary" />
            </Typography>
          </Box>
          
          <List>
            {followRequests.map((request, index) => (
              <React.Fragment key={request.id}>
                <ListItem>
                  <Avatar 
                    src={request.fromUser.profilePicture} 
                    alt={request.fromUser.username}
                    sx={{ mr: 2 }}
                  />
                  <ListItemText
                    primary={request.fromUser.username}
                    secondary={request.fromUser.fullName}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      onClick={() => handleFollowRequest(request.id, 'accept')}
                      color="primary"
                      sx={{ mr: 1 }}
                    >
                      <CheckIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleFollowRequest(request.id, 'decline')}
                      color="error"
                    >
                      <CloseIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < followRequests.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Wallet Section */}
      <WalletSection />

      {/* Saved Posts Section */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 },
        mx: { xs: 1, sm: 0 },
        borderRadius: { xs: 0, sm: 1 },
        boxShadow: { xs: 'none', sm: 1 },
        border: { xs: '1px solid', sm: 'none' },
        borderColor: 'divider'
      }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookmarkBorderIcon />
          Your Content
        </Typography>
        
        <Button
          variant="outlined"
          fullWidth
          startIcon={<BookmarkBorderIcon />}
          onClick={() => navigate('/saved-posts')}
          sx={{
            py: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.9rem', sm: '1rem' },
            fontWeight: 'medium',
            justifyContent: 'flex-start',
            textAlign: 'left'
          }}
        >
          <Box sx={{ flex: 1, textAlign: 'left' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Saved Posts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View all posts you've saved
            </Typography>
          </Box>
        </Button>
      </Paper>

      {/* Security Section - Password Change */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 },
        mx: { xs: 1, sm: 0 },
        borderRadius: { xs: 0, sm: 1 },
        boxShadow: { xs: 'none', sm: 1 },
        border: { xs: '1px solid', sm: 'none' },
        borderColor: 'divider'
      }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon />
          Security
        </Typography>
        
        <PasswordChange onSuccess={() => toast.success('Password updated successfully')} />
      </Paper>

      {/* About Section */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 },
        mx: { xs: 1, sm: 0 },
        borderRadius: { xs: 0, sm: 1 },
        boxShadow: { xs: 'none', sm: 1 },
        border: { xs: '1px solid', sm: 'none' },
        borderColor: 'divider'
      }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon />
          About UPLIVE
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
            This is a Social Media App created by <strong>Ritu Raj</strong> for the people of India.
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6, color: 'primary.main', fontWeight: 'medium' }}>
            Stop sending your personal data to other countries—let's keep our data safe within our nation.
          </Typography>
          
          <Typography variant="body1" sx={{ lineHeight: 1.6, color: 'success.main', fontWeight: 'medium' }}>
            Let's stand with India, grow with India, and build a stronger digital future together.
          </Typography>
        </Box>

        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: 'rgba(255, 153, 0, 0.1)', 
          borderRadius: 1, 
          border: '1px solid rgba(255, 153, 0, 0.2)' 
        }}>
          <Typography variant="body2" sx={{ 
            color: 'text.primary', 
            fontWeight: 'medium',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            🇮🇳 Made in India, for India
          </Typography>
        </Box>
      </Paper>

      {/* Logout Button */}
      <Paper sx={{
        p: { xs: 2, sm: 3 },
        mx: { xs: 1, sm: 0 },
        borderRadius: { xs: 0, sm: 1 },
        boxShadow: { xs: 'none', sm: 1 },
        border: { xs: '1px solid', sm: 'none' },
        borderColor: 'divider',
        textAlign: 'center'
      }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          fullWidth
          sx={{
            py: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.9rem', sm: '1rem' },
            fontWeight: 'bold'
          }}
        >
          Logout
        </Button>
      </Paper>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to logout from your account?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmLogout} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;