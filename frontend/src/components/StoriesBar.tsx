import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Card,
  CardMedia,
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  PhotoCamera,
  Videocam,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import EnhancedAvatar from './EnhancedAvatar';
import GradientButton from './GradientButton';
import { useAuth } from '../context/AuthContext';
import { storiesApi } from '../services/api';
import { Story, User } from '../types';
import toast from 'react-hot-toast';

interface StoryGroup {
  user: User;
  stories: Story[];
  hasUnseenStories: boolean;
}

const StoriesBar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Story viewer state
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [currentStoryGroup, setCurrentStoryGroup] = useState<StoryGroup | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [viewingUserStories, setViewingUserStories] = useState<Story[]>([]);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Story viewers modal state
  const [viewersModalOpen, setViewersModalOpen] = useState(false);
  const [storyViewers, setStoryViewers] = useState<{ user: User; viewedAt: string }[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  // Fetch stories feed
  const fetchStories = async () => {
    if (!user) return;
    
    setFetchLoading(true);
    try {
      console.log('🔍 StoriesBar: Fetching stories feed for user:', user.username);
      const response = await storiesApi.getFeed();
      console.log('📡 Stories API Response:', {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        storyGroupCount: Array.isArray(response.data) ? response.data.length : 'Not array',
        data: response.data
      });
      
      // Log each story group
      if (Array.isArray(response.data)) {
        response.data.forEach((group, index) => {
          console.log(`📖 Story Group ${index + 1}:`, {
            username: group.user?.username,
            userId: group.user?.id,
            storiesCount: group.stories?.length,
            hasUnseenStories: group.hasUnseenStories,
            isCurrentUser: group.user?.id === user?.id
          });
        });
      }
      
      setStoryGroups(response.data);
    } catch (error: any) {
      console.error('❌ Failed to fetch stories:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    console.log('👤 Current user in StoriesBar:', {
      username: user?.username,
      userId: user?.id,
      followingCount: user?.following?.length,
      following: user?.following?.map(u => ({ username: u.username, id: u.id }))
    });
    fetchStories();
  }, [user]);

  // Handle story viewing
  const handleViewStory = async (storyGroup: StoryGroup) => {
    setCurrentStoryGroup(storyGroup);
    setCurrentStoryIndex(0);
    setViewerLoading(true);
    setStoryViewerOpen(true);
    
    try {
      // Fetch user's stories
      const response = await storiesApi.getUserStories(storyGroup.user.id);
      setViewingUserStories(response.data.stories);
      
      // Mark first story as viewed if it exists
      if (response.data.stories.length > 0) {
        await storiesApi.markStoryViewed(response.data.stories[0].id);
        
        // Update the story group state to remove the unseen indicator
        setStoryGroups(prevGroups => 
          prevGroups.map(group => 
            group.user.id === storyGroup.user.id 
              ? { ...group, hasUnseenStories: false }
              : group
          )
        );
      }
    } catch (error: any) {
      console.error('Failed to fetch user stories:', error);
      toast.error('Failed to load stories');
      setStoryViewerOpen(false);
    } finally {
      setViewerLoading(false);
    }
  };

  // Navigate to next/previous story
  const navigateStory = async (direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' ? currentStoryIndex + 1 : currentStoryIndex - 1;
    
    if (newIndex >= 0 && newIndex < viewingUserStories.length) {
      setCurrentStoryIndex(newIndex);
      
      // Mark story as viewed
      try {
        await storiesApi.markStoryViewed(viewingUserStories[newIndex].id);
      } catch (error) {
        console.error('Failed to mark story as viewed:', error);
      }
    }
  };

  // Handle story deletion
  const handleDeleteStory = async () => {
    if (!viewingUserStories[currentStoryIndex]) return;
    
    setDeleteLoading(true);
    setMenuAnchorEl(null);
    
    try {
      await storiesApi.deleteStory(viewingUserStories[currentStoryIndex].id);
      toast.success('Story deleted successfully');
      
      // Remove the deleted story from the array
      const updatedStories = viewingUserStories.filter((_, index) => index !== currentStoryIndex);
      setViewingUserStories(updatedStories);
      
      if (updatedStories.length === 0) {
        // No more stories, close viewer
        setStoryViewerOpen(false);
      } else if (currentStoryIndex >= updatedStories.length) {
        // If we were at the last story, go to the previous one
        setCurrentStoryIndex(updatedStories.length - 1);
      }
      
      // Refresh the stories feed
      fetchStories();
    } catch (error: any) {
      console.error('Failed to delete story:', error);
      toast.error('Failed to delete story');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle viewing story viewers
  const handleViewStoryViewers = async () => {
    if (!viewingUserStories[currentStoryIndex]) return;
    
    setViewersLoading(true);
    setViewersModalOpen(true);
    
    try {
      const response = await storiesApi.getStoryViewers(viewingUserStories[currentStoryIndex].id);
      setStoryViewers(response.data.viewers);
      setViewCount(response.data.viewCount);
    } catch (error: any) {
      console.error('Failed to fetch story viewers:', error);
      toast.error('Failed to load viewers');
      setViewersModalOpen(false);
    } finally {
      setViewersLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a valid image or video file`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large. Maximum size is 100MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Only allow one story at a time
    const file = validFiles[0];
    setSelectedFiles([file]);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrls([url]);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const handleCreateStory = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select an image or video');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('media', selectedFiles[0]);

      await storiesApi.createStory(formData);
      toast.success('Story created successfully!');
      
      // Reset form
      setSelectedFiles([]);
      setPreviewUrls([]);
      setCreateOpen(false);
      
      // Cleanup URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Refresh stories after creation
      fetchStories();
    } catch (error: any) {
      console.error('Create story error:', error);
      toast.error(error.response?.data?.message || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setCreateOpen(false);
    setSelectedFiles([]);
    
    // Cleanup preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };

  return (
    <Paper elevation={0} sx={{ 
      mb: { xs: 1, md: 3 }, // Small margin bottom on mobile for spacing
      borderRadius: { xs: 0, md: '20px' }, // No border radius on mobile for full width
      background: 'rgba(31, 31, 53, 0.8)',
      backdropFilter: 'blur(10px)',
      border: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.1)' }, // No border on mobile
      borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.1)', md: 'none' }, // Only bottom border on mobile
      overflow: 'hidden'
    }}>
      {/* Stories Container */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        overflowX: 'auto', 
        pb: 1,
        px: 2,
        py: 2,
        '&::-webkit-scrollbar': { 
          display: 'none',
          height: 0,
          background: 'transparent'
        },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}>
        {/* User's own story / Add story */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          minWidth: 80,
          py: 1,
          cursor: 'pointer',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            transform: 'translateY(-2px)'
          }
        }}>
          <Box sx={{ position: 'relative', mb: 1 }}>
            <EnhancedAvatar
              src={user?.profilePicture}
              size={56}
              hasStory={storyGroups.some(sg => sg.user.id === user?.id && sg.stories.length > 0)}
              onClick={() => {
                // If user has stories, view them; otherwise navigate to profile
                const userStoryGroup = storyGroups.find(sg => sg.user.id === user?.id);
                if (userStoryGroup && userStoryGroup.stories.length > 0) {
                  handleViewStory(userStoryGroup);
                } else {
                  navigate(`/${user?.username}`);
                }
              }}
            />
            <IconButton
              onClick={() => setCreateOpen(true)}
              sx={{
                position: 'absolute',
                bottom: 5,
                right: -5,
                bgcolor: 'primary.main',
                color: 'white',
                width: 24,
                height: 24,
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Typography variant="caption" sx={{ textAlign: 'center' }}>
            Your Story
          </Typography>
        </Box>

        {/* Stories from Feed */}
        {fetchLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="caption" sx={{ ml: 1 }}>Loading stories...</Typography>
          </Box>
        ) : (
          storyGroups
            .filter(storyGroup => storyGroup.user) // Filter out story groups with null user
            .map((storyGroup) => (
            <Box 
              key={storyGroup.user.id} 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                minWidth: 80,
                py: 1,
                cursor: 'pointer',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => handleViewStory(storyGroup)}
            >
              <Box sx={{ 
                width: 50, 
                height: 50, 
                borderRadius: '50%',
                padding: storyGroup.hasUnseenStories ? '3px' : '2px',
                background: storyGroup.hasUnseenStories 
                  ? 'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #F59E0B 100%)' 
                  : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
                position: 'relative',
                '&::before': storyGroup.hasUnseenStories ? {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #F59E0B 100%)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  opacity: 0.3,
                  zIndex: -1,
                  transform: 'scale(1.1)'
                } : {}
              }}>
                <Avatar
                  src={storyGroup.user?.profilePicture || ''}
                  sx={{ 
                    width: storyGroup.hasUnseenStories ? 44 : 46, 
                    height: storyGroup.hasUnseenStories ? 44 : 46,
                    border: storyGroup.hasUnseenStories 
                      ? '2px solid #1F1F35' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    opacity: storyGroup.hasUnseenStories ? 1 : 0.7,
                    transition: 'all 0.3s ease'
                  }}
                />
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  textAlign: 'center',
                  fontWeight: storyGroup.hasUnseenStories ? 600 : 400,
                  fontSize: '0.75rem',
                  color: storyGroup.hasUnseenStories ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
                  maxWidth: '70px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {storyGroup.user?.username || 'Unknown'}
              </Typography>
            </Box>
          ))
        )}
      </Box>

      {/* Create Story Dialog */}
      <Dialog 
        open={createOpen} 
        onClose={handleDialogClose}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Create Story
          <IconButton onClick={handleDialogClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Upload Area */}
          {selectedFiles.length === 0 ? (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                <PhotoCamera sx={{ fontSize: 40, color: 'text.secondary' }} />
                <Videocam sx={{ fontSize: 40, color: 'text.secondary' }} />
              </Box>
              <Typography variant="body1" gutterBottom>
                Select photos and videos to share
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can select images or videos up to 50MB each
              </Typography>
            </Box>
          ) : (
            // Preview Area
            <Box>
              <Box sx={{ position: 'relative', mb: 2 }}>
                {selectedFiles[0].type.startsWith('image/') ? (
                  <Card>
                    <CardMedia
                      component="img"
                      image={previewUrls[0]}
                      alt="Story preview"
                      sx={{ maxHeight: 400, objectFit: 'contain' }}
                    />
                  </Card>
                ) : (
                  <Card>
                    <CardMedia
                      component="video"
                      src={previewUrls[0]}
                      controls
                      sx={{ maxHeight: 400, objectFit: 'contain' }}
                    />
                  </Card>
                )}
                
                {/* Remove button */}
                <IconButton
                  onClick={() => handleRemoveFile(0)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                  }}
                >
                  <DeleteIcon />
                </IconButton>

                {/* File info */}
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Chip 
                    label={selectedFiles[0].name}
                    variant="outlined"
                    size="small"
                  />
                  <Chip 
                    label={`${(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB`}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>

              {/* Add More Button */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
              >
                Change Media
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateStory}
            disabled={loading || selectedFiles.length === 0}
          >
            {loading ? <CircularProgress size={20} /> : 'Share Story'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Story Viewer Modal */}
      <Dialog
        open={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'black',
            color: 'white',
            borderRadius: 2
          }
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '90vh' }}>
          {viewerLoading ? (
            <Box sx={{ 
              flex: 1,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CircularProgress sx={{ color: 'white' }} />
            </Box>
          ) : (
            viewingUserStories[currentStoryIndex] && currentStoryGroup && (
              <>
                {/* Story Header - Fixed at top */}
                <Box sx={{ 
                  p: 2,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={currentStoryGroup?.user?.profilePicture || ''}
                      alt={currentStoryGroup?.user?.username || 'Unknown user'}
                      sx={{ width: 32, height: 32 }}
                    />
                    <Typography variant="subtitle2" color="white">
                      {currentStoryGroup?.user?.username || 'Unknown User'}
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.7)">
                      {new Date(viewingUserStories[currentStoryIndex].createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Show 3-dot menu only for story owner */}
                    {currentStoryGroup?.user?.id === user?.id && (
                      <IconButton 
                        onClick={(e) => setMenuAnchorEl(e.currentTarget)} 
                        sx={{ color: 'white', mr: 1 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                    <IconButton onClick={() => setStoryViewerOpen(false)} sx={{ color: 'white' }}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Story Progress Bar - Fixed below header */}
                <Box sx={{ 
                  px: 2,
                  pb: 1,
                  display: 'flex', 
                  gap: 0.5,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 2
                }}>
                  {viewingUserStories.map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        flex: 1,
                        height: 2,
                        backgroundColor: index <= currentStoryIndex ? 'white' : 'rgba(255,255,255,0.3)',
                        borderRadius: 1
                      }}
                    />
                  ))}
                </Box>

                {/* Story Content - Flexible middle section */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {/* Story Media */}
                  {viewingUserStories[currentStoryIndex].media && (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {viewingUserStories[currentStoryIndex].media!.type === 'image' ? (
                        <img
                          src={viewingUserStories[currentStoryIndex].media!.url}
                          alt="Story"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <video
                          src={viewingUserStories[currentStoryIndex].media!.url}
                          controls
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                    </Box>
                  )}

                  {/* Text Story */}
                  {viewingUserStories[currentStoryIndex].text && !viewingUserStories[currentStoryIndex].media && (
                    <Box sx={{ 
                      width: '100%',
                      height: '100%',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: viewingUserStories[currentStoryIndex].text!.backgroundColor,
                      color: viewingUserStories[currentStoryIndex].text!.color
                    }}>
                      <Typography variant="h4" textAlign="center" sx={{ px: 3 }}>
                        {viewingUserStories[currentStoryIndex].text!.content}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Navigation Buttons - Fixed at bottom */}
                <Box sx={{ 
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 2
                }}>
                  {/* Left side - Viewers count for story owner */}
                  <Box>
                    {currentStoryGroup?.user?.id === user?.id && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={handleViewStoryViewers}
                        startIcon={<VisibilityIcon />}
                        sx={{ 
                          color: 'rgba(255,255,255,0.8)',
                          textTransform: 'none',
                          fontSize: '0.8rem',
                          '&:hover': { 
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            color: 'white'
                          }
                        }}
                      >
                        {viewingUserStories[currentStoryIndex]?.viewers?.length || 0} views
                      </Button>
                    )}
                  </Box>

                  {/* Center - Navigation buttons */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {currentStoryIndex > 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigateStory('prev')}
                        sx={{ 
                          color: 'white', 
                          borderColor: 'white',
                          '&:hover': { 
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: 'white'
                          }
                        }}
                      >
                        Previous
                      </Button>
                    )}
                    {currentStoryIndex < viewingUserStories.length - 1 && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigateStory('next')}
                        sx={{ 
                          color: 'white', 
                          borderColor: 'white',
                          '&:hover': { 
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: 'white'
                          }
                        }}
                      >
                        Next
                      </Button>
                    )}
                  </Box>

                  {/* Right side - Empty for balance */}
                  <Box sx={{ width: '80px' }} />
                </Box>
              </>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Story Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <MenuItem 
          onClick={handleDeleteStory} 
          disabled={deleteLoading}
          sx={{ color: 'red' }}
        >
          <ListItemIcon>
            <DeleteIcon sx={{ color: 'red' }} />
          </ListItemIcon>
          <ListItemText>
            {deleteLoading ? 'Deleting...' : 'Delete Story'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Story Viewers Modal */}
      <Dialog
        open={viewersModalOpen}
        onClose={() => setViewersModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'white',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="h6">Story Views</Typography>
          <Typography variant="body2" color="text.secondary">
            {viewCount} {viewCount === 1 ? 'view' : 'views'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 0, py: 0 }}>
          {viewersLoading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              py: 4 
            }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
              {storyViewers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No views yet
                  </Typography>
                </Box>
              ) : (
                storyViewers
                  .filter(viewer => viewer.user) // Filter out viewers with null user
                  .map((viewer, index) => (
                  <Box
                    key={viewer.user.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      px: 3,
                      py: 2,
                      borderBottom: index < storyViewers.filter(v => v.user).length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    <Avatar
                      src={viewer.user?.profilePicture || ''}
                      alt={viewer.user?.username || 'Unknown user'}
                      sx={{ width: 40, height: 40 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">
                        {viewer.user?.fullName || viewer.user?.username || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        @{viewer.user?.username || 'unknown'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(viewer.viewedAt).toLocaleDateString()} {new Date(viewer.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewersModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default StoriesBar;