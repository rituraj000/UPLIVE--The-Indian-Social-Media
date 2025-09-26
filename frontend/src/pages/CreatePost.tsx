import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  PhotoCamera,
  VideoCall,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { postsApi } from '../services/api';
import toast from 'react-hot-toast';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoCameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    processSelectedFiles(files);
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    processSelectedFiles(files);
  };

  const processSelectedFiles = (files: File[]) => {

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mov'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Please select only images (JPG, PNG, GIF) or videos (MP4, MOV)');
      return;
    }

    // Check file size (100MB limit per file)
    const oversizedFiles = files.filter(file => file.size > 100 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('File size should not exceed 100MB');
      return;
    }

    setSelectedFiles(files);
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setOpen(true);
  };

  const handleOpenCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleOpenVideoCamera = () => {
    videoCameraInputRef.current?.click();
  };

  const handleOpenFileExplorer = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image or video');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add files to FormData with detailed logging
      selectedFiles.forEach((file, index) => {
        console.log(`Adding file ${index}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          isFile: file instanceof File
        });
        formData.append('media', file, file.name);
      });
      
      if (caption) {
        formData.append('caption', caption);
      }

      // Debug FormData contents
      console.log('FormData has entries:', formData.has('media'));
      console.log('FormData media value:', formData.get('media'));
      console.log('FormData all media values:', formData.getAll('media'));
      
      console.log('Creating post with:', {
        selectedFiles: selectedFiles.length,
        fileNames: selectedFiles.map(f => f.name),
        fileSizes: selectedFiles.map(f => f.size),
        caption: caption || 'No caption'
      });

      const response = await postsApi.createPost(formData);
      console.log('Post created successfully:', response.data);
      
      toast.success('Post created successfully!');
      
      // Clean up
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setCaption('');
      setOpen(false);
      
      navigate('/');
    } catch (error: any) {
      console.error('=== CREATE POST ERROR START ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Has response:', !!error.response);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Is network error:', !error.response);
      console.error('Is timeout:', error.code === 'ECONNABORTED');
      console.error('=== CREATE POST ERROR END ===');
      
      // Check if it's actually a successful response misinterpreted as error
      if (error.response?.status === 201 || (error.response?.status >= 200 && error.response?.status < 300)) {
        console.log('✅ POST CREATED SUCCESSFULLY despite error!');
        toast.success('Post created successfully!');
        
        // Clean up and navigate
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setPreviewUrls([]);
        setCaption('');
        setOpen(false);
        navigate('/');
      } else if (!error.response) {
        // Network error
        console.error('❌ NETWORK ERROR - Server not reachable');
        toast.error('Network error: Could not reach server. Please check your connection.');
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        console.error('❌ TIMEOUT ERROR');
        toast.error('Request timeout: Server took too long to respond.');
      } else {
        // Other errors
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create post';
        console.error('❌ SERVER ERROR:', errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setCaption('');
    setOpen(false);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL for the removed file
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  return (
    <Box sx={{ 
      maxWidth: { xs: '100%', sm: 500, md: 600 }, 
      mx: 'auto', 
      mt: { xs: 2, sm: 3, md: 4 },
      px: { xs: 2, sm: 0 }
    }}>
      <Typography variant={isMobile ? "h5" : "h4"} sx={{ mb: { xs: 3, sm: 4 }, textAlign: 'center' }}>
        Create New Post
      </Typography>

      <Card sx={{
        p: { xs: 2, sm: 3, md: 4 }, 
        textAlign: 'center',
        border: { xs: 'none', sm: '1px solid', md: 'none' },
        borderColor: { xs: 'transparent', sm: 'rgba(0, 0, 0, 0.12)', md: 'transparent' },
        borderRadius: { xs: 0, sm: 1, md: 0 },
        boxShadow: { xs: 'none', sm: 1, md: 'none' },
        bgcolor: 'background.paper'
      }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <PhotoCamera sx={{ fontSize: { xs: 48, sm: 60 }, color: 'text.secondary', mb: 2 }} />
            <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
              Share photos and videos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {isMobile ? "Capture or select from gallery" : "Select photos and videos from your computer"}
            </Typography>
          </Box>

          {/* Hidden inputs for different capture methods */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            multiple
            onChange={handleCameraCapture}
            style={{ display: 'none' }}
          />
          
          <input
            ref={videoCameraInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            onChange={handleCameraCapture}
            style={{ display: 'none' }}
          />

          {/* Mobile/Tablet Options */}
          {isMobile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleOpenCamera}
                startIcon={<PhotoCamera />}
                fullWidth
                size="large"
              >
                Take Photo
              </Button>
              <Button
                variant="contained"
                onClick={handleOpenVideoCamera}
                startIcon={<VideoCall />}
                fullWidth
                size="large"
                color="secondary"
              >
                Record Video
              </Button>
              <Button
                variant="outlined"
                onClick={handleOpenFileExplorer}
                startIcon={<AddIcon />}
                fullWidth
                size="large"
              >
                Choose from Gallery
              </Button>
            </Box>
          ) : (
            /* Desktop Options */
            <Button
              variant="contained"
              size="large"
              onClick={handleOpenFileExplorer}
              startIcon={<AddIcon />}
              sx={{ mb: 2 }}
            >
              Select from Computer
            </Button>
          )}

          <Typography variant="body2" color="text.secondary">
            {isMobile ? "You can capture photos or select multiple files from gallery" : "You can select multiple files (images and videos)"}
          </Typography>
        </CardContent>
      </Card>

      {/* Create Post Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Create new post
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Media Preview */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {previewUrls.map((url, index) => (
              <Box key={index} sx={{ position: 'relative', width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                {selectedFiles[index].type.startsWith('image/') ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={url}
                    alt={`Preview ${index + 1}`}
                    sx={{ borderRadius: 1, objectFit: 'cover' }}
                  />
                ) : (
                  <CardMedia
                    component="video"
                    height="200"
                    src={url}
                    controls
                    sx={{ borderRadius: 1, objectFit: 'cover' }}
                  />
                )}
                <IconButton
                  size="small"
                  onClick={() => removeFile(index)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* Caption Input */}
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />

          <Alert severity="info" sx={{ mb: 2 }}>
            Supported formats: JPG, PNG, GIF, MP4, MOV (max 10MB per file)
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || selectedFiles.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Posting...' : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreatePost;