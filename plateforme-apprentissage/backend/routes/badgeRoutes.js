const express = require('express');
const router = express.Router();
const {
  getBadges,
  getBadge,
  createBadge,
  updateBadge,
  deleteBadge,
  attribuerBadge,
  getUtilisateursAvecBadge,
  verifierBadgeUtilisateur
} = require('../controllers/badgeController');

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Badge = require('../models/Badge');

// Routes publiques
router.get('/', advancedResults(Badge), getBadges);
router.get('/:id', getBadge);
router.get('/:id/utilisateurs', getUtilisateursAvecBadge);
router.get('/verifier/:userId/:badgeId', verifierBadgeUtilisateur);

// Routes protégées
router.use(protect);

// Routes pour les administrateurs
router.post('/', authorize('admin'), createBadge);
router.put('/:id', authorize('admin'), updateBadge);
router.delete('/:id', authorize('admin'), deleteBadge);
router.post('/:id/attribuer', authorize('admin', 'formateur'), attribuerBadge);

module.exports = router;
