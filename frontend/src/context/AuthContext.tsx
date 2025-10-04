import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  login: (credentials: { email?: string; phoneNumber?: string; password: string }) => Promise<boolean>;
  loginWithToken: (token: string, userData: User) => void;
  register: (userData: {
    username: string;
    email?: string;
    phoneNumber?: string;
    password: string;
    fullName: string;
  }) => Promise<{ success: boolean; requiresVerification?: boolean; message?: string; verificationMethod?: 'email' | 'phone'; userId?: string }>;
  logout: () => void;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Optionally refresh user data
        authApi.getCurrentUser()
          .then(response => {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          })
          .catch(() => {
            // If token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: { email?: string; phoneNumber?: string; password: string }): Promise<boolean> => {
    try {
      const response = await authApi.login(credentials);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Welcome back!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      
      // Handle email verification requirement
      if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
        toast.error('🇮🇳 Please verify your email first');
        throw new Error('EMAIL_VERIFICATION_REQUIRED');
      }
      
      toast.error(message);
      throw new Error(message);
    }
  };

  const register = async (userData: {
    username: string;
    email?: string;
    phoneNumber?: string;
    password: string;
    fullName: string;
  }): Promise<{ success: boolean; requiresVerification?: boolean; message?: string; verificationMethod?: 'email' | 'phone'; userId?: string }> => {
    try {
      const response = await authApi.register(userData);
      
      // New verification flow (email or phone)
      if (response.data.requiresVerification) {
        const verificationMethod = response.data.verificationMethod || 'email';
        const message = verificationMethod === 'email' 
          ? '🇮🇳 Account created! Please check your email to verify your account.'
          : '🇮🇳 Account created! Please check your phone for the OTP.';
        toast.success(message);
        return { 
          success: true, 
          requiresVerification: true,
          message: response.data.message,
          verificationMethod: response.data.verificationMethod,
          userId: response.data.userId
        };
      }
      
      // Legacy flow (if somehow we get a token directly)
      if ('token' in response.data && 'user' in response.data) {
        localStorage.setItem('token', response.data.token as string);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user as User);
        toast.success('Account created successfully!');
        return { success: true };
      }
      
      return { success: false, message: 'Unexpected response format' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    const username = user?.username;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success(`Goodbye ${username ? username : ''}! You have been logged out successfully.`, {
      duration: 4000,
    });
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const loginWithToken = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    toast.success('You have been logged in successfully');
  };

  const value = {
    user,
    login,
    loginWithToken,
    register,
    logout,
    loading,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};