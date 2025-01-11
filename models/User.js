const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Post = require("./Post");

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  mobile: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'] 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'] 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ["user", "staff", "admin"], 
    default: "user" 
  },
  photo: { 
    type: String, 
    default: "" 
  },
  state: { 
    type: String, 
    default: "" 
  },
  job: { 
    type: String, 
    default: "" 
  },
  district: { 
    type: String, 
    default: "" 
  },
  office: { 
    type: String, 
    default: "" 
  },
  officePlace: { 
    type: String, 
    default: "" 
  },
  followers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  following: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  resetPasswordToken: { 
    type: String 
  },
  resetPasswordExpire: { 
    type: Date 
  },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },  // Add this line
  deletedAt: { 
    type: Date, 
    default: null // For soft deletion
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Hash password before saving the user
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to delete associated posts when a user is deleted
UserSchema.pre("remove", async function (next) {
  try {
    await Post.deleteMany({ user: this._id });
    console.log(`Posts deleted for user ${this._id}`);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to soft delete user
UserSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("User", UserSchema);
