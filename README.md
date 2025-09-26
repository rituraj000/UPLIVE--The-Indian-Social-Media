# UPLIVE

A full-stack social media platform built with modern technologies including React, TypeScript, Node.js, Express, MongoDB, and Socket.io.

## Features

### Core Features
- 🔐 User authentication (register/login)
- 📱 Responsive design
- 🏠 Home feed with posts from followed users
- 👤 User profiles with posts, followers, and following
- 📸 Create posts with multiple images/videos
- ❤️ Like and comment on posts
- 👥 Follow/unfollow users
- 🔍 Explore posts from other users
- 💬 Real-time messaging
- 📖 Stories feature with 24-hour expiration
- 🔔 Real-time notifications

### Technical Features
- 🚀 Real-time updates with Socket.io
- 📱 Progressive Web App (PWA) ready
- 🌙 Dark/Light mode support
- 📊 Infinite scrolling for posts
- 🖼️ Image/video upload with Cloudinary
- 🔒 JWT authentication
- 📱 Mobile-first responsive design

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **React Query** for state management
- **Socket.io Client** for real-time features
- **Axios** for API calls
- **React Hook Form** for forms
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** & **Cloudinary** for file uploads
- **Express Validator** for input validation

## Project Structure

```
uplive/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Utility functions
│   └── package.json
└── package.json         # Root package.json
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd uplive
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**

   Create `.env` file in the `backend` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/uplive
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:3000

   # Cloudinary configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your machine.

5. **Run the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## Available Scripts

- `npm run dev` - Start both backend and frontend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run build` - Build the frontend for production
- `npm run start` - Start the backend in production mode

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/:userId/follow` - Follow/unfollow user
- `GET /api/users/search/:query` - Search users
- `GET /api/users/suggestions/for-you` - Get user suggestions

### Posts
- `GET /api/posts/feed` - Get feed posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:postId` - Get single post
- `POST /api/posts/:postId/like` - Like/unlike post
- `POST /api/posts/:postId/comments` - Add comment
- `DELETE /api/posts/:postId` - Delete post
- `GET /api/posts/explore/posts` - Get explore posts

### Stories
- `GET /api/stories/feed` - Get stories feed
- `POST /api/stories` - Create story
- `GET /api/stories/:storyId` - Get single story
- `DELETE /api/stories/:storyId` - Delete story

### Messages
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:userId` - Get messages with user
- `POST /api/messages/:userId` - Send message
- `DELETE /api/messages/:messageId` - Delete message

## Database Models

### User Model
- Basic user information (username, email, fullName, etc.)
- Profile settings (bio, website, profilePicture)
- Privacy settings
- Followers and following relationships

### Post Model
- Media files (images/videos)
- Caption and location
- Likes and comments
- Tags and hashtags

### Story Model
- Media or text content
- 24-hour expiration
- Viewer tracking

### Message Model
- Direct messaging between users
- Support for text, media, and post sharing
- Read status tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Push notifications
- [ ] Video calling
- [ ] Live streaming
- [ ] Reels/short videos
- [ ] Shopping features
- [ ] Advanced search filters
- [ ] Content moderation
- [ ] Analytics dashboard
- [ ] Multiple account support
- [ ] Two-factor authentication

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original social media platforms for the design inspiration
- React and Node.js communities for excellent documentation
- All the open-source libraries used in this project