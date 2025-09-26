export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  bio?: string;
  website?: string;
  profilePicture: string;
  isPrivate: boolean;
  isVerified: boolean;
  followers: User[];
  following: User[];
  posts: Post[];
  savedPosts: Post[];
  followerCount: number;
  followingCount: number;
  postCount: number;
  lastSeen: string;
  hasSeenWelcome?: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional fields for follow request status
  isFollowing?: boolean;
  hasRequestedToFollow?: boolean;
  followRequestStatus?: 'pending' | 'accepted' | 'declined';
  isOwnProfile?: boolean;
}

export interface Post {
  id: string;
  user: User;
  caption?: string;
  media: MediaItem[];
  likes: User[];
  comments: Comment[];
  location?: Location;
  tags: User[];
  hashtags: string[];
  isArchived: boolean;
  commentsDisabled: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  publicId?: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  likes: User[];
  createdAt: string;
}

export interface Story {
  id: string;
  user: User;
  media?: MediaItem;
  text?: {
    content: string;
    color: string;
    backgroundColor: string;
  };
  viewers: StoryViewer[];
  viewCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface StoryViewer {
  user: User;
  viewedAt: string;
}

export interface Message {
  id: string;
  sender: User;
  receiver: User;
  content: {
    text?: string;
    media?: MediaItem;
    post?: Post;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Story {
  id: string;
  _id: string;
  user: User;
  media?: {
    url: string;
    type: 'image' | 'video';
    publicId?: string;
  };
  text?: {
    content: string;
    color: string;
    backgroundColor: string;
  };
  viewers: {
    user: User;
    viewedAt: string;
  }[];
  viewCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'follow' | 'follow_request' | 'follow_request_accepted' | 'follow_back_suggestion' | 'like' | 'comment' | 'mention' | 'message';
  fromUser: User;
  toUser: User;
  post?: Post;
  messageRef?: Message;
  message?: string;
  isRead: boolean;
  createdAt: string;
}

export interface FollowRequest {
  id: string;
  fromUser: User;
  toUser: User;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Location {
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: { msg: string }[];
}