const express = require("express");
const {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  passwordSendEmail,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get('/verify-email/:token', verifyEmail)
router.post("/forgotpassword", forgotPassword);
router.get("/reset-password/:token", passwordSendEmail);

router.post("/reset-password/:token", resetPassword);

router.post("/reset-password/:userId", protect, resetPassword);

module.exports = router;
