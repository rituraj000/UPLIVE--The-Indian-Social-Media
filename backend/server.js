const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

// Import routes with error handling
let authRoutes,
  authSafeRoutes,
  debugRoutes,
  userRoutes,
  postRoutes,
  storyRoutes,
  messageRoutes,
  notificationRoutes,
  healthRoutes,
  emailHealthRoutes;

try {
  authRoutes = require("./routes/auth");
  console.log("✅ Auth routes loaded");
} catch (error) {
  console.error("❌ Failed to load auth routes:", error.message);
  authRoutes = express.Router(); // Empty fallback
}

try {
  authSafeRoutes = require("./routes/authSafe");
  console.log("✅ Auth safe routes loaded");
} catch (error) {
  console.error("❌ Failed to load auth safe routes:", error.message);
  authSafeRoutes = express.Router(); // Empty fallback
}

try {
  debugRoutes = require("./routes/debug");
  console.log("✅ Debug routes loaded");
} catch (error) {
  console.error("❌ Failed to load debug routes:", error.message);
  debugRoutes = express.Router(); // Empty fallback
}

try {
  userRoutes = require("./routes/user");
  console.log("✅ User routes loaded");
} catch (error) {
  console.error("❌ Failed to load user routes:", error.message);
  userRoutes = express.Router(); // Empty fallback
}

try {
  postRoutes = require("./routes/post");
  console.log("✅ Post routes loaded");
} catch (error) {
  console.error("❌ Failed to load post routes:", error.message);
  postRoutes = express.Router(); // Empty fallback
}

try {
  storyRoutes = require("./routes/story");
  console.log("✅ Story routes loaded");
} catch (error) {
  console.error("❌ Failed to load story routes:", error.message);
  storyRoutes = express.Router(); // Empty fallback
}

try {
  messageRoutes = require("./routes/message");
  console.log("✅ Message routes loaded");
} catch (error) {
  console.error("❌ Failed to load message routes:", error.message);
  messageRoutes = express.Router(); // Empty fallback
}

try {
  notificationRoutes = require("./routes/notification");
  console.log("✅ Notification routes loaded");
} catch (error) {
  console.error("❌ Failed to load notification routes:", error.message);
  notificationRoutes = express.Router(); // Empty fallback
}

try {
  healthRoutes = require("./routes/health");
  console.log("✅ Health routes loaded");
} catch (error) {
  console.error("❌ Failed to load health routes:", error.message);
  healthRoutes = express.Router(); // Empty fallback
}

try {
  emailHealthRoutes = require("./routes/email-health");
  console.log("✅ Email health routes loaded");
} catch (error) {
  console.error("❌ Failed to load email health routes:", error.message);
  emailHealthRoutes = express.Router(); // Empty fallback
}

// Import email services with error handling
let emailService, emailQueue;

try {
  emailService = require("./services/emailService");
  console.log("✅ Email service loaded");
} catch (error) {
  console.error("❌ Failed to load email service:", error.message);
  emailService = { verifyConnection: () => Promise.resolve(false) }; // Mock fallback
}

try {
  emailQueue = require("./services/emailQueue");
  console.log("✅ Email queue loaded");
} catch (error) {
  console.error("❌ Failed to load email queue:", error.message);
  emailQueue = { start: () => {}, stop: () => {} }; // Mock fallback
}

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
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());

// Enhanced CORS configuration for production
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",
        "https://uplive-the-indian-social-media-qlqj.vercel.app",
        "https://uplive-the-indian-social-media.vercel.app",
        // Add any other Vercel preview URLs
        /^https:\/\/uplive-the-indian-social-media-.*\.vercel\.app$/,
      ];

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === "string") {
          return allowed === origin;
        } else if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(null, true); // Allow all origins in production for now
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Access-Control-Allow-Origin"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Handle preflight requests explicitly
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS,PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With,Accept,Origin"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

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

// Routes with error handling
try {
  app.use("/api/auth", authLimiter, authRoutes);
  console.log("✅ Auth routes mounted");
} catch (error) {
  console.error("❌ Failed to mount auth routes:", error.message);
}

try {
  app.use("/api/auth", authLimiter, authSafeRoutes); // Safe fallback routes
  console.log("✅ Auth safe routes mounted");
} catch (error) {
  console.error("❌ Failed to mount auth safe routes:", error.message);
}

try {
  app.use("/api/debug", debugRoutes); // Debug routes for production troubleshooting
  console.log("✅ Debug routes mounted");
} catch (error) {
  console.error("❌ Failed to mount debug routes:", error.message);
}

try {
  app.use("/api/users", userRoutes);
  console.log("✅ User routes mounted");
} catch (error) {
  console.error("❌ Failed to mount user routes:", error.message);
}

try {
  app.use("/api/posts", postRoutes);
  console.log("✅ Post routes mounted");
} catch (error) {
  console.error("❌ Failed to mount post routes:", error.message);
}

try {
  app.use("/api/stories", storyRoutes);
  console.log("✅ Story routes mounted");
} catch (error) {
  console.error("❌ Failed to mount story routes:", error.message);
}

try {
  app.use("/api/messages", messageRoutes);
  console.log("✅ Message routes mounted");
} catch (error) {
  console.error("❌ Failed to mount message routes:", error.message);
}

try {
  app.use("/api/notifications", notificationRoutes);
  console.log("✅ Notification routes mounted");
} catch (error) {
  console.error("❌ Failed to mount notification routes:", error.message);
}

// Essential health checks (always available)
app.get("/api/health", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.json({
    message: "UPLIVE API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
  });
});

app.get("/api/status", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.json({
    status: "online",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Emergency CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.json({
    message: "CORS is working",
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Emergency POST test endpoint
app.post("/api/emergency-test", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.json({
    message: "POST request working",
    receivedData: req.body,
    timestamp: new Date().toISOString(),
  });
});

try {
  app.use("/api", emailHealthRoutes);
  console.log("✅ Email health routes mounted");
} catch (error) {
  console.error("❌ Failed to mount email health routes:", error.message);
}

// Test direct route for privacy features
app.get("/api/test-direct", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.json({
    message: "Direct route working!",
    userRoutesLoaded: true,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.status(404).json({
    message: "Route not found",
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Process error handlers
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  console.error("Stack:", error.stack);
  // Don't exit the process in production
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process in production
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;

// Initialize email service
async function initializeServices() {
  try {
    // Verify email service connection
    if (emailService && emailService.verifyConnection) {
      const emailConnected = await emailService.verifyConnection();
      if (emailConnected) {
        console.log("✅ Email service initialized successfully");
      } else {
        console.log("⚠️  Email service not configured (optional)");
      }
    }

    if (emailQueue && emailQueue.start) {
      console.log("✅ Email queue initialized");
    }
  } catch (error) {
    console.error("❌ Failed to initialize services:", error.message);
    console.log("⚠️  Continuing without email services...");
  }
}

// Enhanced server startup with error handling
const startServer = () => {
  try {
    server.listen(PORT, () => {
      console.log("🚀 ================================");
      console.log(`🚀 UPLIVE Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📅 Started at: ${new Date().toISOString()}`);
      console.log("🚀 ================================");

      // Initialize services after server starts
      initializeServices().catch((error) => {
        console.error("❌ Service initialization failed:", error.message);
      });
    });

    server.on("error", (error) => {
      if (error.syscall !== "listen") {
        throw error;
      }

      const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

      switch (error.code) {
        case "EACCES":
          console.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          console.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
