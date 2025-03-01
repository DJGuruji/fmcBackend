// routes/videoPostRoutes.js
const express = require('express');
const router = express.Router();
const {protect} = require("../middleware/authMiddleware")
const videoPostController = require('../controllers/videoPostController');

router.post('/',protect,videoPostController.createVideoPost);


router.get('/',protect, videoPostController.getVideoPosts);


router.get('/:id',protect, videoPostController.getVideoPostById);

router.put('/:id',protect, videoPostController.updateVideoPost);


router.delete('/:id',protect, videoPostController.deleteVideoPost);
// Like a post
router.put('/like/:videoId',protect,videoPostController.likevideo);

// Add a comment
router.post('/comment/:videoId',protect,videoPostController.addComment);

// Get comments for a post
router.get('/comments/:videoId',protect,videoPostController.getComment);
router.delete("/comment/:commentId", protect, videoPostController.deleteComment);

module.exports = router;
