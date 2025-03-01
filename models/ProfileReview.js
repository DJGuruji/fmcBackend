const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who wrote the review
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Profile being reviewed
  rating: { type: Number, required: true, min: 1, max: 5 }, // Rating (1-5)
  comment: { type: String, required: true }, // Review comment
  createdAt: { type: Date, default: Date.now }, // Timestamp
});

module.exports = mongoose.model("ProfileReview", ReviewSchema);
