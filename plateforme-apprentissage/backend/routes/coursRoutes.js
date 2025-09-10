const express = require('express');
const router = express.Router();
const {
  getTousLesCours,
  getCours: getCoursParId,
  createCours,
  updateCours,
  deleteCours,
  inscriptionCours,
  mettreAJourProgression,
  getCoursParFormateur,
  approuverCours
} = require('../controllers/coursController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Cours = require('../models/Cours');

// Routes publiques
router.get('/', advancedResults(Cours, 'formateur badge'), getTousLesCours);
router.get('/:id', getCoursParId);
router.get('/formateur/:id', getCoursParFormateur);

// Routes protégées (authentification requise)
router.use(protect);

// Routes pour les apprenants
router.post('/:id/inscription', authorize('apprenant'), inscriptionCours);
router.put('/:id/progression', authorize('apprenant'), mettreAJourProgression);

// Routes pour les formateurs
router.post('/', authorize('formateur', 'admin'), createCours);
router.put('/:id', authorize('formateur', 'admin'), updateCours);
router.delete('/:id', authorize('formateur', 'admin'), deleteCours);

// Routes pour les administrateurs
router.put('/:id/approuver', authorize('admin'), approuverCours);

module.exports = router;
