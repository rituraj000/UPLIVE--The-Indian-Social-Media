import React, { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

const Loading = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
    <CircularProgress />
  </Box>
);

// Lazy load page components
export const LazyLogin = lazy(() => import('../pages/Login'));
export const LazyRegister = lazy(() => import('../pages/Register'));
export const LazyWelcome = lazy(() => import('../pages/Welcome'));
export const LazyHome = lazy(() => import('../pages/Home'));
export const LazyProfile = lazy(() => import('../pages/Profile'));
export const LazyExplore = lazy(() => import('../pages/Explore'));
export const LazyMessages = lazy(() => import('../pages/Messages'));
export const LazyCreatePost = lazy(() => import('../pages/CreatePost'));
export const LazyFeed = lazy(() => import('../pages/Feed'));
export const LazySearch = lazy(() => import('../pages/Search'));
export const LazySettings = lazy(() => import('../pages/Settings'));

// Wrapped components with Suspense
export const Login = () => (
  <Suspense fallback={<Loading />}>
    <LazyLogin />
  </Suspense>
);

export const Register = () => (
  <Suspense fallback={<Loading />}>
    <LazyRegister />
  </Suspense>
);

export const Welcome = () => (
  <Suspense fallback={<Loading />}>
    <LazyWelcome />
  </Suspense>
);

export const Home = () => (
  <Suspense fallback={<Loading />}>
    <LazyHome />
  </Suspense>
);

export const Profile = () => (
  <Suspense fallback={<Loading />}>
    <LazyProfile />
  </Suspense>
);

export const Explore = () => (
  <Suspense fallback={<Loading />}>
    <LazyExplore />
  </Suspense>
);

export const Messages = () => (
  <Suspense fallback={<Loading />}>
    <LazyMessages />
  </Suspense>
);

export const CreatePost = () => (
  <Suspense fallback={<Loading />}>
    <LazyCreatePost />
  </Suspense>
);

export const Feed = () => (
  <Suspense fallback={<Loading />}>
    <LazyFeed />
  </Suspense>
);

export const Search = () => (
  <Suspense fallback={<Loading />}>
    <LazySearch />
  </Suspense>
);

export const Settings = () => (
  <Suspense fallback={<Loading />}>
    <LazySettings />
  </Suspense>
);