const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const storyRoutes = require("./routes/story");
const messageRoutes = require("./routes/message");
const notificationRoutes = require("./routes/notification");

const app = express();
const server = http.createServer(app);

// Trust proxy for rate limiting
app.set("trust proxy", 1);

const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://uplive-the-indian-social-media-qlqj.vercel.app",
      "https://uplive-the-indian-social-media.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://uplive-the-indian-social-media-qlqj.vercel.app",
      "https://uplive-the-indian-social-media.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting - more generous for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // 1000 requests for development, 100 for production
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit headers
});

// Create a very lenient limiter for username checking
const usernameCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === "production" ? 50 : 500, // 500 requests for development, 50 for production
  message: {
    error: "Too many username checks, please wait a moment.",
    retryAfter: "1 minute",
  },
});

// Create a more lenient limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 20 : 200, // 200 requests for development, 20 for production
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes",
  },
});

app.use(limiter);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Database connection with fallback
const connectDB = async () => {
  try {
    // Try Atlas first
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000, // 15 second timeout (increased from 5)
    });
    console.log("MongoDB Atlas connected successfully");
    console.log("Database:", mongoose.connection.db.databaseName);
  } catch (atlasError) {
    console.log("Atlas connection failed, trying local MongoDB...");
    try {
      // Fallback to local MongoDB
      await mongoose.connect("mongodb://localhost:27017/instagram-clone", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Local MongoDB connected successfully");
      console.log("Database:", mongoose.connection.db.databaseName);
    } catch (localError) {
      console.log("Both Atlas and local MongoDB failed:");
      console.log("Atlas Error:", atlasError.message);
      console.log("Local Error:", localError.message);
      console.log("\nServer continuing without database...");
      console.log(
        "API routes will still work but database operations will fail"
      );
    }
  }
};

// Start database connection (non-blocking)
connectDB();

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("send_message", (data) => {
    socket.to(data.receiverId).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    email: process.env.EMAIL_USER ? "Configured" : "Not Configured",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "UPLIVE Backend API",
    version: "1.0.0",
    status: "Running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth/*",
      users: "/api/users/*",
      posts: "/api/posts/*",
      stories: "/api/stories/*",
      messages: "/api/messages/*",
      notifications: "/api/notifications/*",
    },
  });
});
app.get("/api/health", (req, res) => {
  res.json({ message: "UPLIVE API is running!" });
});

// Test direct route for privacy features
app.get("/api/test-direct", (req, res) => {
  res.json({
    message: "Direct route working!",
    userRoutesLoaded: true,
    timestamp: new Date().toISOString(),
  });
});

// Environment test endpoint
app.get("/api/test/env", (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    emailConfigured: {
      EMAIL_USER: process.env.EMAIL_USER ? "✅ Set" : "❌ Missing",
      EMAIL_PASS: process.env.EMAIL_PASS ? "✅ Set" : "❌ Missing",
      ENABLE_REAL_EMAIL: process.env.ENABLE_REAL_EMAIL || "❌ Not Set",
    },
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
