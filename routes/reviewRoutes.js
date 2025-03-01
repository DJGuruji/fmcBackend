const express = require("express");
const { addReview, editReview, deleteReview, getUserReviews } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


router.post("/", protect, addReview);


router.put("/:reviewId", protect, editReview);


router.delete("/:reviewId", protect, deleteReview);


router.get("/:userId",protect, getUserReviews);

module.exports = router;
