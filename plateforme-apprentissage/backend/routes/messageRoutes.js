const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  searchMessages
} = require('../controllers/messageController');

const { protect } = require('../middleware/auth');

// Toutes les routes sont protégées
router.use(protect);

// Routes pour les messages
router.route('/')
  .post(sendMessage);

router.route('/conversation/:conversationId')
  .get(getMessages);

router.route('/search')
  .get(searchMessages);

router.route('/:id/read')
  .put(markAsRead);

router.route('/:id')
  .delete(deleteMessage);

module.exports = router;
