import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomeRoute from './components/WelcomeRoute';
import MainAppRoute from './components/MainAppRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import Messages from './pages/Messages';
import CreatePost from './pages/CreatePost';
import Feed from './pages/Feed';
import Search from './pages/Search';
import Settings from './pages/Settings';

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SocketProvider>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
