// routes/postRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const postController = require('../controllers/postControler');

// Create a new post
router.post('/', protect,postController.createPost);

// Get all posts or specific user post
router.get('/',protect, postController.getPosts);

// Get a single post by ID
router.get('/:id',protect, postController.getPostById);

// Update a post
router.put('/:id',protect, postController.updatePost);

// Delete a post
router.delete('/:id',protect, postController.deletePost);


// Like a post
router.put('/like/:postId',protect,postController.likePost);

// Add a comment
router.post('/comment/:postId',protect,postController.addComment);

// Get comments for a post
router.get('/comments/:postId',protect,postController.getComment);
router.delete("/comment/:commentId", protect, postController.deleteComment);

module.exports = router;
