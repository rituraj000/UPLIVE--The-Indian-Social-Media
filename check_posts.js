const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    checkPosts();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Post Schema (simplified)
const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  caption: String,
  media: [{ url: String, type: String }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

async function checkPosts() {
  try {
    const postCount = await Post.countDocuments();
    console.log("Total posts in database:", postCount);

    if (postCount > 0) {
      const posts = await Post.find().populate("user", "username").limit(5);
      console.log("Sample posts:");
      posts.forEach((post, index) => {
        console.log(
          `${index + 1}. User: ${post.user?.username || "Unknown"}, Caption: ${
            post.caption?.substring(0, 50) || "No caption"
          }...`
        );
      });
    } else {
      console.log(
        "No posts found in database. This is why your feed is empty!"
      );
    }
  } catch (error) {
    console.error("Error checking posts:", error);
  } finally {
    mongoose.disconnect();
  }
}
