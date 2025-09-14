const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  toggleLike,
  addComment,
  deletePost,
  getCommunityStats,
  createDiscussion,
  getDiscussions,
  addDiscussionReply,
  createGroup,
  getGroups,
  joinGroup,
  leaveGroup,
  addGroupMember,
  removeGroupMember,
  getGroupPosts,
  createGroupPost,
  addGroupPostComment
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

// Routes pour les discussions
router.get('/discussions', getDiscussions);
router.post('/discussions', protect, createDiscussion);
router.post('/discussions/:discussionId/replies', protect, addDiscussionReply);

// Routes pour les groupes
router.get('/groups', protect, getGroups);
router.post('/groups', protect, createGroup);
router.post('/groups/:groupId/join', protect, joinGroup);
router.post('/groups/:groupId/leave', protect, leaveGroup);
router.post('/groups/:groupId/members', protect, addGroupMember);
router.delete('/groups/:groupId/members', protect, removeGroupMember);

// Publications de groupe
router.get('/groups/:groupId/posts', protect, getGroupPosts);
router.post('/groups/:groupId/posts', protect, createGroupPost);
router.post('/groups/:groupId/posts/:postId/comments', protect, addGroupPostComment);

module.exports = router;
