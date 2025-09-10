const express = require('express');
const router = express.Router();
const {
  createOrGetConversation,
  getUserConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  searchUsers
} = require('../controllers/conversationController');

const { protect } = require('../middleware/auth');

// Toutes les routes sont protégées
router.use(protect);

// Routes pour les conversations
router.route('/')
  .post(createOrGetConversation)
  .get(getUserConversations);

router.route('/search-users')
  .get(searchUsers);

router.route('/:id')
  .get(getConversation)
  .put(updateConversation)
  .delete(deleteConversation);

module.exports = router;
