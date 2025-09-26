import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Avatar, 
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  useTheme,
  useMediaQuery,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Home as HomeIcon,
  Search as SearchIcon,
  Explore as ExploreIcon,
  FavoriteBorder as HeartIcon,
  Add as AddIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsApi, messagesApi } from '../services/api';
import NotificationsModal from './NotificationsModal';
import SearchModal from './SearchModal';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'white',
  color: 'black',
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'none', // Hide on mobile, use bottom navigation instead
  },
}));

const MobileBottomNav = styled(BottomNavigation)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  borderTop: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.up('md')]: {
    display: 'none', // Hide on desktop
  },
}));

const NavContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: '975px !important',
  [theme.breakpoints.down('sm')]: {
    padding: '0 8px',
  },
}));

const Logo = styled('div')({
  fontFamily: 'Billabong, cursive',
  fontSize: '2rem',
  fontWeight: 'bold',
  cursor: 'pointer',
});

const NavIcons = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [bottomNavValue, setBottomNavValue] = useState(location.pathname);
  const open = Boolean(anchorEl);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      if (!user) return;
      
      try {
        // Fetch notification count
        const notificationResponse = await notificationsApi.getUnreadCount();
        setUnreadCount(notificationResponse.data.count);
        
        // Fetch message count
        const messageResponse = await messagesApi.getUnreadCount();
        setUnreadMessagesCount(messageResponse.data.count);
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    };

    fetchUnreadCounts();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Sync bottom navigation with current route
  useEffect(() => {
    setBottomNavValue(location.pathname);
  }, [location.pathname]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    navigate(`/${user?.username}`);
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    navigate('/settings');
  };

  return (
    <Box>
      <StyledAppBar position="sticky">
        <Toolbar>
          <NavContainer>
            <Box onClick={() => handleNavigation('/')} sx={{ cursor: 'pointer' }}>
              <Logo>
                UPLIVE
              </Logo>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.65rem',
                  color: '#FF9933',
                  fontWeight: 'bold',
                  display: 'block',
                  textAlign: 'center',
                  mt: -0.5,
                  lineHeight: 1
                }}
              >
                🇮🇳 Made in India, for India
              </Typography>
            </Box>
            
            <NavIcons>
              <IconButton
                onClick={() => handleNavigation('/')}
                color={isActive('/') ? 'primary' : 'default'}
              >
                <HomeIcon />
              </IconButton>
              
              <IconButton
                onClick={() => {
                  // On mobile/small screens, navigate to search page
                  // On desktop, open search modal
                  if (isMobile) {
                    handleNavigation('/search');
                  } else {
                    setSearchOpen(true);
                  }
                }}
                color={isActive('/search') || searchOpen ? 'primary' : 'default'}
              >
                <SearchIcon />
              </IconButton>
              
              <IconButton
                onClick={() => handleNavigation('/feed')}
                color={isActive('/feed') ? 'primary' : 'default'}
              >
                <ExploreIcon />
              </IconButton>
              
              <IconButton
                onClick={() => handleNavigation('/messages')}
                color={isActive('/messages') ? 'primary' : 'default'}
              >
                <Badge badgeContent={unreadMessagesCount} color="error">
                  <MessageIcon />
                </Badge>
              </IconButton>
              
              <IconButton
                onClick={async () => {
                  setNotificationsOpen(true);
                  // Mark all notifications as read when opening modal (clear badge)
                  try {
                    await notificationsApi.markAllAsRead();
                    setUnreadCount(0);
                  } catch (error) {
                    console.error('Error marking notifications as read:', error);
                  }
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <HeartIcon />
                </Badge>
              </IconButton>
              
              <IconButton
                onClick={() => handleNavigation('/create')}
                color={isActive('/create') ? 'primary' : 'default'}
              >
                <AddIcon />
              </IconButton>
              
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ p: 0 }}
              >
                <Avatar
                  src={user?.profilePicture}
                  alt={user?.username}
                  sx={{ width: 24, height: 24 }}
                />
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleProfileMenuClose}
                onClick={handleProfileMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleProfileClick}>
                  <Avatar src={user?.profilePicture} />
                  <Box>
                    <ListItemText 
                      primary={user?.username}
                      secondary={user?.fullName}
                    />
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleProfileClick}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Profile" />
                </MenuItem>
                <MenuItem onClick={handleSettingsClick}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Log Out" />
                </MenuItem>
              </Menu>
            </NavIcons>
          </NavContainer>
        </Toolbar>
      </StyledAppBar>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav
          value={bottomNavValue}
          onChange={(event, newValue) => {
            setBottomNavValue(newValue);
            handleNavigation(newValue);
          }}
        >
          <BottomNavigationAction
            label="Home"
            value="/"
            icon={<HomeIcon />}
          />
          <BottomNavigationAction
            label="Search"
            value="/search"
            icon={<SearchIcon />}
          />
          <BottomNavigationAction
            label="Create"
            value="/create"
            icon={<AddIcon />}
          />
          <BottomNavigationAction
            label="Messages"
            value="/messages"
            icon={
              <Badge badgeContent={unreadMessagesCount} color="error">
                <MessageIcon />
              </Badge>
            }
          />
          <BottomNavigationAction
            label="Profile"
            value={`/${user?.username}`}
            icon={
              <Avatar
                src={user?.profilePicture}
                alt={user?.username}
                sx={{ width: 24, height: 24 }}
              />
            }
          />
        </MobileBottomNav>
      )}
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          pt: 2, 
          pb: isMobile ? 10 : 4, // Extra bottom padding for mobile bottom nav
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        {children}
      </Container>
      
      {/* Notifications Modal */}
      <NotificationsModal
        open={notificationsOpen}
        onClose={() => {
          setNotificationsOpen(false);
          // Don't reset count - it should stay 0 once notifications are marked as read
        }}
      />
      
      {/* Search Modal */}
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </Box>
  );
};

export default Layout;