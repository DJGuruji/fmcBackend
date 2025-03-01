const VideoPost = require("../models/VideoPost");
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
    folder: 'videos',
    resource_type: 'video',
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50000000 }, // Limit file size to 50MB
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|mov|avi|wmv/;
    const extname = filetypes.test(file.originalname.toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Videos Only!');
    }
  },
}).single('video');


exports.createVideoPost = [
  upload,
  async (req, res) => {
    try {
      const { postName, description } = req.body;

      // Ensure that the file was uploaded to Cloudinary
      if (!req.file) {
        return res.status(400).json({ message: 'Video upload failed' });
      }

      const newVideoPost = new VideoPost({
        user: req.user._id,
        postName,
        description,
        video: req.file.path, // Cloudinary URL
      });

      const savedVideoPost = await newVideoPost.save();

      res.status(201).json(savedVideoPost);
    } catch (err) {
      console.error(err); // Log the error to the server console
      res.status(500).json({ message: err.message });
    }
  },
];




// Get all video posts
exports.getVideoPosts = async (req, res) => {
  try {
    const userId = req.query.userId;
    const limit = parseInt(req.query.limit) || 5;
    const skip = parseInt(req.query.skip) || 0;

    let query = userId ? { user: userId } : {};

    const videoPosts = await VideoPost.find(query)
      .populate("user")
      .sort({ createdAt: -1 }) // Get latest videos first
      .limit(limit)
      .skip(skip);

    res.status(200).json(videoPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get a single video post by ID
exports.getVideoPostById = async (req, res) => {
  try {
    const videoPost = await VideoPost.findById(req.params.id).populate("user");
    if (!videoPost) {
      return res.status(404).json({ message: "Video post not found" });
    }
    res.status(200).json(videoPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a video post
exports.updateVideoPost = async (req, res) => {
  try {
    const updatedVideoPost = await VideoPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("user");
    if (!updatedVideoPost) {
      return res.status(404).json({ message: "Video post not found" });
    }
    res.status(200).json(updatedVideoPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a video post
exports.deleteVideoPost = async (req, res) => {
  try {
    const deletedVideoPost = await VideoPost.findByIdAndDelete(req.params.id);
    if (!deletedVideoPost) {
      return res.status(404).json({ message: "Video post not found" });
    }
    res.status(200).json({ message: "Video post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.likevideo = async (req, res) => {
  try {
    const video = await VideoPost.findById(req.params.videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    let liked = false;

    if (video.likes.includes(req.user.id)) {
      video.likes = video.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      video.likes.push(req.user.id);
      liked = true;
    }

    video.likesCount = video.likes.length; 

    await video.save();
    res.json({ 
      likesCount: video.likesCount, 
      likedBy: video.likes, 
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

    const video = await VideoPost.findById(req.params.videoId);
    if (!video) return res.status(404).json({ message: "video not found" });

    const newComment = { user: req.user.id, text };
    video.comments.push(newComment);
    
    await video.save();
    res.json(video.comments);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


exports.getComment = async (req, res) => {
  try {
    const video = await VideoPost.findById(req.params.videoId)
      .populate("comments.user", "name photo"); 

    if (!video) return res.status(404).json({ message: "video not found" });

    res.json(video.comments);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};



exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    let commentDeleted = false;

    const videos = await VideoPost.find(); // Get all posts

    for (let video of videos) {
      const commentIndex = video.comments.findIndex((c) => c._id.toString() === commentId);
      
      if (commentIndex !== -1) {
        if (video.comments[commentIndex].user.toString() !== userId) {
          return res.status(403).json({ message: "Unauthorized to delete this comment" });
        }

        video.comments.splice(commentIndex, 1);
        await video.save();
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