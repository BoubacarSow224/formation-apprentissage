const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createGroupe,
  getMesGroupes,
  getGroupe,
  inviterApprenant,
  listerInvitations,
  repondreInvitation,
  getMesInvitations,
} = require('../controllers/groupeController');
const ensureGroupMember = require('../middleware/ensureGroupMember');

// Toutes les routes requièrent une authentification
router.use(protect);

// Créer un groupe (formateur)
router.post('/', authorize('formateur', 'admin'), createGroupe);

// Mes groupes (formateur ou membre)
router.get('/mes-groupes', getMesGroupes);
// Mes invitations en attente (apprenant)
router.get('/mes-invitations', getMesInvitations);

// Détails du groupe (réservé aux membres)
router.get('/:id', ensureGroupMember, getGroupe);

// Invitations (formateur)
router.post('/:id/invitations', authorize('formateur', 'admin'), inviterApprenant);
router.get('/:id/invitations', authorize('formateur', 'admin'), listerInvitations);

// Répondre invitation (apprenant)
router.post('/:id/invitations/:invId/repondre', authorize('apprenant', 'formateur', 'admin'), repondreInvitation);

module.exports = router;
