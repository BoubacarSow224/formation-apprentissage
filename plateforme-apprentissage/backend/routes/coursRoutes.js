const express = require('express');
const router = express.Router();
const {
  getTousLesCours,
  getCours,
  getCoursPublics,
  createCours,
  updateCours,
  deleteCours,
  inscriptionCours,
  mettreAJourProgression,
  getCoursParFormateur,
  approuverCours,
  getStatistiquesFormateur,
  getCoursRecentsFormateur,
  getEtudiantsRecentsFormateur,
  getMesCoursFormateur,
  publierCours,
  depublierCours,
  demarrerCours,
  terminerEtape,
  terminerCours,
  attribuerBadge,
  delivrerCertificat,
  getElevesCours,
  getProgressionEleve,
  getHistoriqueBadges,
  getBadgesCours,
  getCertificatEleve
} = require('../controllers/coursController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Cours = require('../models/Cours');

// Routes publiques
router.get('/', advancedResults(Cours, 'formateur'), getTousLesCours);
router.get('/public', getCoursPublics);
// IMPORTANT: définir la route spécifique avant la route dynamique /formateur/:id
router.get('/formateur/mes-cours', protect, authorize('formateur', 'admin'), getMesCoursFormateur);
// Important: routes spécifiques en premier
// Ne faire correspondre que des ObjectId valides pour éviter de capturer 'stats', 'recents', etc.
router.get('/formateur/:id([0-9a-fA-F]{24})', getCoursParFormateur);
router.get('/:id', getCours);

// Routes protégées (authentification requise)
router.use(protect);

// Routes pour les apprenants
router.post('/:id/inscription', authorize('apprenant'), inscriptionCours);
router.put('/:id/progression', authorize('apprenant'), mettreAJourProgression);
router.post('/:id/demarrer', authorize('apprenant'), demarrerCours);
router.patch('/:id/etapes/:index/terminer', authorize('apprenant'), terminerEtape);
router.patch('/:id/terminer', authorize('apprenant'), terminerCours);

// Routes pour les statistiques formateur
router.get('/formateur/stats', authorize('formateur'), getStatistiquesFormateur);

// (supprimé - déjà déclaré avant, avec protect)

router.get('/formateur/recents', authorize('formateur'), getCoursRecentsFormateur);

router.get('/formateur/etudiants-recents', authorize('formateur'), getEtudiantsRecentsFormateur);

// Routes pour les formateurs
router.post('/', authorize('formateur', 'admin'), createCours);
router.put('/:id', authorize('formateur', 'admin'), updateCours);
router.delete('/:id', authorize('formateur', 'admin'), deleteCours);
router.put('/:id/publier', authorize('formateur', 'admin'), publierCours);
router.put('/:id/depublier', authorize('formateur', 'admin'), depublierCours);
router.post('/:id/attribuer-badge', authorize('formateur', 'admin'), attribuerBadge);
router.post('/:id/delivrer-certificat', authorize('formateur', 'admin'), delivrerCertificat);
router.get('/:id/eleves', authorize('formateur', 'admin'), getElevesCours);
router.get('/:id/eleves/:apprenantId', authorize('formateur', 'admin'), getProgressionEleve);
router.get('/:id/historique-badges', authorize('formateur', 'admin'), getHistoriqueBadges);
router.get('/:id/badges', authorize('formateur', 'admin'), getBadgesCours);
router.get('/:id/certificat', authorize('formateur', 'admin'), getCertificatEleve);

// Routes pour les administrateurs
router.put('/:id/approuver', authorize('admin'), approuverCours);

module.exports = router;
