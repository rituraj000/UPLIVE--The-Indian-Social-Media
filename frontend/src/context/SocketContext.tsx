import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Message } from '../types';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  sendMessage: (receiverId: string, message: any) => void;
  joinRoom: (userId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      const newSocket = io(SOCKET_URL);

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        newSocket.emit('join', user.id);
      });

      newSocket.on('online_users', (users: string[]) => {
        setOnlineUsers(users);
      });

      newSocket.on('receive_message', (message: Message) => {
        // Handle incoming message - you might want to use a global state manager here
        console.log('New message received:', message);
        // You can dispatch to a messages context or trigger a callback
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [user]);

  const sendMessage = (receiverId: string, message: any) => {
    if (socket) {
      socket.emit('send_message', {
        receiverId,
        ...message,
      });
    }
  };

  const joinRoom = (userId: string) => {
    if (socket) {
      socket.emit('join', userId);
    }
  };

  const value = {
    socket,
    onlineUsers,
    sendMessage,
    joinRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};