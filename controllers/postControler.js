// controllers/postController.js
const Post = require("../models/Post");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "posts",
    resource_type: "image",
  },
});

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads");
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}${path.extname(file.originalname)}`);
//   },
// });

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images only!");
    }
  },
}).single("postImage");

// Create a new post
exports.createPost = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const { postName, postDescription } = req.body;
      const postImage = req.file.path;

      const newPost = new Post({
        user: req.user._id,
        postName,
        postImage,
        postDescription,
      });

      const savedPost = await newPost.save();
      res.status(201).json(savedPost);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
};

exports.getPosts = async (req, res) => {
  try {
    const userId = req.query.userId;
    const limit = parseInt(req.query.limit) || 7;
    const skip = parseInt(req.query.skip) || 0;
    let posts;

    if (userId) {
      posts = await Post.find({ user: userId })
        .populate("user")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
    } else {
      posts = await Post.find()
        .populate("user")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
    }

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("user");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("user");
    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    let liked = false;

    if (post.likes.includes(req.user.id)) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      post.likes.push(req.user.id);
      liked = true;
    }

    post.likesCount = post.likes.length; // ✅ Ensure this updates

    await post.save();
    post = await Post.findById(req.params.postId).populate("likes", "username profilePic");

    res.json({ 
      likesCount: post.likesCount, 
      likedBy: post.likes, 
      liked 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};






exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment cannot be empty" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = { user: req.user.id, text };
    post.comments.push(newComment);
    
    await post.save();
    const updatedpost = await Post.findById(req.params.postId)
      .populate("comments.user", "name photo");
    res.json(updatedpost.comments);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


exports.getComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("comments.user", "name photo"); // Populate only the user's name

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};



exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id; // Get user ID from token
    let commentDeleted = false;

    const posts = await Post.find(); // Get all posts

    for (let post of posts) {
      const commentIndex = post.comments.findIndex((c) => c._id.toString() === commentId);
      
      if (commentIndex !== -1) {
        if (post.comments[commentIndex].user.toString() !== userId) {
          return res.status(403).json({ message: "Unauthorized to delete this comment" });
        }

        post.comments.splice(commentIndex, 1);
        await post.save();
        commentDeleted = true;
        break;
      }
    }

    if (!commentDeleted) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

