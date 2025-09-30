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

// Components
const EmailVerification = lazy(() => import('./components/EmailVerification'));

// Loading component
const Loading = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
    <CircularProgress />
  </Box>
);

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#E4405F',
    },
    background: {
      default: '#fafafa',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
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
