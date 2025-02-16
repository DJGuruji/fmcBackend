const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const axios = require('axios');
const OpenAI = require('openai');
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'images',
    resource_type: 'image',
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
}).fields([
  { name: "postImage", maxCount: 1 },
  { name: "photo", maxCount: 1 },
]);


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};


const updateUserProfile = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
     
      console.error("Multer error:", err);
      return res.status(400).json({ message: "Error uploading file", error: err });
    }

    try {
      const user = await User.findById(req.params.userId);
      console.log(req.body)

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

    
      user.name = req.body.name ?? user.name;
      user.mobile = req.body.mobile ?? user.mobile;
      user.email = req.body.email ?? user.email;
      
     
      if (req.files && req.files.photo) {
        user.photo = req.files.photo[0].path;
      }
      

      user.state = req.body.state ?? user.state;
      user.job = req.body.job ?? user.job;
      user.district = req.body.district ?? user.district;
      user.office = req.body.office ?? user.office;
      user.officePlace = req.body.officePlace ?? user.officePlace;

      const updatedUser = await user.save();

      return res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        photo: updatedUser.photo, 
        state: updatedUser.state,
        job: updatedUser.job,
        district: updatedUser.district,
        office: updatedUser.office,
        officePlace: updatedUser.officePlace,
        role: updatedUser.role,
        token: generateToken(updatedUser._id), 
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ message: "Failed to update profile", error });
    }
  });
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name') 
      .populate('following', 'name'); 

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      photo: user.photo,
      state: user.state,
      job: user.job,
      district: user.district,
      office: user.office,
      officePlace: user.officePlace,
      followersCount: user.followers.length,
      followingCount: user.following.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const deleteAccount = async (req, res) => {
  const { password } = req.body;

  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Delete user
    await user.deleteOne();

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const userSearch = async (req, res) => {
  const { query } = req.query;

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { mobile: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { job: { $regex: query, $options: "i" } },
        { officePlace: { $regex: query, $options: "i" } },
        { district: { $regex: query, $options: "i" } },
        { state: { $regex: query, $options: "i" } },
      ],
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.photo = ""; 
    await user.save();

    res.status(200).json({ message: 'Profile photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


const follow = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({ message: 'User followed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};





const unfollow = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    currentUser.following = currentUser.following.filter(
      (userId) => userId.toString() !== userToUnfollow._id.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (userId) => userId.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.status(200).json({ message: 'User unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('followers', 'name photo');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('following', 'name photo');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


const postOpenai = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY; // Store API key in .env file
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
    });

    if (response.data && response.data.candidates) {
      res.json({ message: response.data.candidates[0].content.parts[0].text.trim() });
    } else {
      res.status(500).json({ error: "Unexpected response from Google AI" });
    }
  } catch (error) {
    console.error("Error calling Google Gemini API:", error);
    res.status(500).json({ error: "Failed to fetch response from Google Gemini AI" });
  }
};








module.exports = {
  updateUserProfile,
  deleteAccount,
  userSearch,
  getProfile,
  deleteProfilePhoto,
  follow,
  unfollow,
  getFollowing,
  getFollowers,
  postOpenai
};
