const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  toggleLike,
  addComment,
  deletePost,
  getCommunityStats
} = require('../controllers/communityController');
const { protect } = require('../middleware/auth');

// Routes pour les posts
router.post('/posts', protect, createPost);
router.get('/posts', getPosts);
router.delete('/posts/:postId', protect, deletePost);

// Routes pour les interactions
router.post('/posts/:postId/like', protect, toggleLike);
router.post('/posts/:postId/comments', protect, addComment);

// Routes pour les statistiques
router.get('/stats', getCommunityStats);

module.exports = router;
