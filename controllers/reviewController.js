const ProfileReview = require("../models/ProfileReview");
const User = require("../models/User");
const path = require("path");

exports.addReview = async (req, res) => {
  try {
    const { user, rating, comment } = req.body;
    const reviewer = req.user.id; // Assuming authentication middleware sets req.user

    // Check if the user exists
    const reviewedUser = await User.findById(user);
    if (!reviewedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent duplicate reviews by the same user
    const existingReview = await ProfileReview.findOne({ user, reviewer });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this user" });
    }

    const review = new ProfileReview({ reviewer, user, rating, comment });
    await review.save();

    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Edit a review
exports.editReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { reviewId } = req.params;
    const reviewer = req.user.id;

    const review = await ProfileReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Ensure only the reviewer can edit the review
    if (review.reviewer.toString() !== reviewer) {
      return res.status(403).json({ message: "Not authorized to edit this review" });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    res.status(200).json({ message: "Review updated successfully", review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const reviewer = req.user.id;

    const review = await ProfileReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Ensure only the reviewer or an admin can delete the review
    if (review.reviewer.toString() !== reviewer && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await review.deleteOne();

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Fetch reviews for a specific user profile
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await ProfileReview.find({ user: userId })
      .populate("reviewer", "name photo") // Populate reviewer details
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
