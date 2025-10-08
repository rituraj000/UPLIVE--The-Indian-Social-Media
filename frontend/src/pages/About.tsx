import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Divider,
  IconButton,
  useTheme
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const About: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <>
      <Helmet>
        <title>About - UPLIVE - The Indian Social Media</title>
        <meta name="description" content="Learn about UPLIVE's mission for digital sovereignty and supporting Indian content creators" />
      </Helmet>
      
      <Container 
        maxWidth="md" 
        sx={{ 
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2 }
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: '#1F1F35', 
            borderRadius: { xs: 2, sm: 3 },
            boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}
        >
          {/* Header with Back Button */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: { xs: 3, sm: 4 },
            flexDirection: { xs: 'column', sm: 'row' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{ 
                mr: { xs: 0, sm: 2 },
                mb: { xs: 2, sm: 0 },
                color: '#A855F7',
                '&:hover': {
                  backgroundColor: 'rgba(168, 85, 247, 0.1)'
                }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              About UPLIVE
            </Typography>
          </Box>

          <Divider sx={{ mb: { xs: 3, sm: 4 }, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Mission Statement */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#A855F7', 
                fontWeight: 600, 
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.1rem' }
              }}
            >
              Our Mission: Digital Sovereignty for India
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: { xs: 1.6, sm: 1.8 },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                textAlign: 'justify'
              }}
            >
              Amid rising friction in Indo–US relations under the banner of the "America First" policy, 
              India must recognize the growing threat of US digital hegemony. The overwhelming dominance 
              of American tech giants in India's social media landscape poses serious risks to our digital 
              sovereignty and creative economy.
            </Typography>
          </Box>

          {/* Economic Impact Section */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#EC4899', 
                fontWeight: 600, 
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.1rem' }
              }}
            >
              Economic Challenges
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: { xs: 1.6, sm: 1.8 },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                textAlign: 'justify'
              }}
            >
              Today, India faces powerful economic arm-twisting by the US in trade & commerce. 
              Even a seemingly minor move—such as the imposition of subscription fees or account 
              creation charges—could disproportionately impact Indian content creators, who rely 
              on these platforms for livelihood.
            </Typography>
          </Box>

          {/* Privacy & Security Section */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#10B981', 
                fontWeight: 600, 
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.1rem' }
              }}
            >
              Data Security Concerns
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: { xs: 1.6, sm: 1.8 },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                textAlign: 'justify'
              }}
            >
              India's data security remains another grave concern, as vast amounts of user information 
              are shared with the US. Hence an urgent need for India to nurture indigenous social media 
              ecosystems to safeguard our politics and protect privacy is growing.
            </Typography>
          </Box>

          {/* Call to Action */}
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#F59E0B', 
                fontWeight: 600, 
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.1rem' }
              }}
            >
              The Path Forward
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: { xs: 1.6, sm: 1.8 },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                textAlign: 'justify'
              }}
            >
              The battle ahead is not merely economic—it is about digital freedom, self-reliance, 
              and national dignity in the evolving global order. UPLIVE represents India's commitment 
              to building a sovereign digital ecosystem that empowers Indian voices and protects 
              Indian interests.
            </Typography>
          </Box>

          <Divider sx={{ my: { xs: 3, sm: 4 }, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Footer */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                fontStyle: 'italic',
                px: { xs: 1, sm: 0 }
              }}
            >
              Building the future of Indian social media, one connection at a time.
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                display: 'block',
                mt: 1
              }}
            >
              © 2025 UPLIVE - The Indian Social Media
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default About;