const express = require('express');
const router = express.Router();
const {
  getOffresEmploi,
  getOffreEmploi,
  createOffreEmploi,
  updateOffreEmploi,
  deleteOffreEmploi,
  postulerOffreEmploi,
  mettreAJourCandidature,
  getOffresParEntreprise
} = require('../controllers/offreEmploiController');

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const OffreEmploi = require('../models/OffreEmploi');

// Routes publiques
router.get('/', advancedResults(OffreEmploi, 'entreprise'), getOffresEmploi);
router.get('/:id', getOffreEmploi);
router.get('/entreprise/:entrepriseId', getOffresParEntreprise);

// Routes protégées
router.use(protect);

// Routes pour les apprenants et formateurs
router.post('/:id/postuler', authorize('apprenant', 'formateur'), postulerOffreEmploi);

// Routes pour les entreprises
router.post('/', authorize('entreprise', 'admin'), createOffreEmploi);
router.put('/:id', authorize('entreprise', 'admin'), updateOffreEmploi);
router.delete('/:id', authorize('entreprise', 'admin'), deleteOffreEmploi);
router.put('/:id/candidatures/:candidatureId', authorize('entreprise', 'admin'), mettreAJourCandidature);

module.exports = router;
