import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import WelcomeRoute from './components/WelcomeRoute';
import MainAppRoute from './components/MainAppRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded components
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Welcome = lazy(() => import('./pages/Welcome'));
const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const Explore = lazy(() => import('./pages/Explore'));
const Messages = lazy(() => import('./pages/Messages'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const Feed = lazy(() => import('./pages/Feed'));
const Search = lazy(() => import('./pages/Search'));
const Settings = lazy(() => import('./pages/Settings'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SuggestionsPage = lazy(() => import('./pages/SuggestionsPage'));
const PostDemo = lazy(() => import('./pages/PostDemo'));
const SavedPosts = lazy(() => import('./pages/SavedPosts'));
const About = lazy(() => import('./pages/About'));

// Components
const EmailVerification = lazy(() => import('./components/EmailVerification'));

// Loading component
const Loading = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
    <CircularProgress />
  </Box>
);

// Create theme - Modern Dark Theme with Gradients
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#A855F7', // Purple
      light: '#C084FC',
      dark: '#7C3AED',
    },
    secondary: {
      main: '#EC4899', // Pink
      light: '#F472B6',
      dark: '#DB2777',
    },
    background: {
      default: '#0d011a', // Almost black with deep purple hint
      paper: '#1F1F35', // Dark gray-purple
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A1A1AA',
    },
    error: {
      main: '#EF4444',
    },
    warning: {
      main: '#F59E0B',
    },
    success: {
      main: '#10B981',
    },
    info: {
      main: '#3B82F6',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 800,
      background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    h2: {
      fontWeight: 700,
      color: '#FFFFFF',
    },
    h3: {
      fontWeight: 600,
      color: '#FFFFFF',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0F0F23 0%, #1F1F35 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          padding: '10px 20px',
        },
        contained: {
          background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
          boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #9333EA 0%, #DB2777 100%)',
            boxShadow: '0 6px 25px rgba(168, 85, 247, 0.4)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1F1F35',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1F1F35',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(168, 85, 247, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#A855F7',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&:hover': {
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
          },
        },
      },
    },
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
              <SocketProvider>
                <Router>
                  <div className="App">
                    <Routes>
                      <Route path="/login" element={
                        <Suspense fallback={<Loading />}>
                          <Login />
                        </Suspense>
                      } />
                      <Route path="/register" element={
                        <Suspense fallback={<Loading />}>
                          <Register />
                        </Suspense>
                      } />
                      <Route path="/forgot-password" element={
                        <Suspense fallback={<Loading />}>
                          <ForgotPassword />
                        </Suspense>
                      } />
                      <Route path="/reset-password" element={
                        <Suspense fallback={<Loading />}>
                          <ResetPassword />
                        </Suspense>
                      } />
                      <Route path="/verify-email" element={
                        <Suspense fallback={<Loading />}>
                          <EmailVerification />
                        </Suspense>
                      } />
                      <Route 
                        path="/welcome" 
                        element={
                          <WelcomeRoute>
                            <Welcome />
                          </WelcomeRoute>
                        } 
                      />
                      <Route
                        path="/*"
                        element={
                          <MainAppRoute>
                            <Layout>
                              <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/feed" element={<Feed />} />
                                <Route path="/search" element={<Search />} />
                                <Route path="/explore" element={<Explore />} />
                                <Route path="/messages" element={<Messages />} />
                                <Route path="/messages/:username" element={<Messages />} />
                                <Route path="/create" element={<CreatePost />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/suggestions" element={<SuggestionsPage />} />
                                <Route path="/post-demo" element={<PostDemo />} />
                                <Route path="/saved-posts" element={<SavedPosts />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/:username" element={<Profile />} />
                              </Routes>
                            </Layout>
                          </MainAppRoute>
                        }
                      />
                    </Routes>
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 3000,
                        style: {
                          background: '#333',
                          color: '#fff',
                        },
                      }}
                    />
                  </div>
                </Router>
              </SocketProvider>
            </AuthProvider>
          </ThemeProvider>
        </HelmetProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
