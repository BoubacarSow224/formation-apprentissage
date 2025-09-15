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
  getOffresParEntreprise,
  rechercherCandidatsParBadgeDansOffre,
  rechercherCandidatsEntrepriseParBadge
} = require('../controllers/offreEmploiController');

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const OffreEmploi = require('../models/OffreEmploi');

// Middleware: traduire des paramètres conviviaux en filtres Mongo compatibles advancedResults
function translateOffreFilters(req, res, next) {
  const { badgeId, competence, ville } = req.query || {};
  // Filtre par badge requis
  if (badgeId) {
    // Utiliser l'opérateur $in pour correspondre au tableau badgesRequis
    req.query['badgesRequis[in]'] = Array.isArray(badgeId) ? badgeId : String(badgeId);
    delete req.query.badgeId;
  }
  // Filtre par compétence requise
  if (competence) {
    req.query['competencesRequises[in]'] = Array.isArray(competence) ? competence : String(competence);
    delete req.query.competence;
  }
  // Filtre par ville
  if (ville) {
    // correspondance exacte (on peut améliorer avec regex si besoin)
    req.query['localisation.ville'] = String(ville);
    delete req.query.ville;
  }
  next();
}

// Routes publiques
router.get('/', translateOffreFilters, advancedResults(OffreEmploi, 'entreprise'), getOffresEmploi);
// IMPORTANT: placer les routes plus spécifiques AVANT les routes paramétrées génériques
router.get('/entreprise/:entrepriseId', getOffresParEntreprise);
router.get('/:id', getOffreEmploi);

// Routes protégées
router.use(protect);

// Routes pour les apprenants et formateurs
router.post('/:id/postuler', authorize('apprenant', 'formateur'), postulerOffreEmploi);
router.get('/mes-candidatures', authorize('apprenant', 'formateur'), require('../controllers/offreEmploiController').getMesCandidatures);

// Routes pour les entreprises
router.post('/', authorize('entreprise', 'admin'), createOffreEmploi);
router.put('/:id', authorize('entreprise', 'admin'), updateOffreEmploi);
router.delete('/:id', authorize('entreprise', 'admin'), deleteOffreEmploi);
router.put('/:id/candidatures/:candidatureId', authorize('entreprise', 'admin'), mettreAJourCandidature);
router.get('/:id/candidatures', authorize('entreprise', 'admin'), rechercherCandidatsParBadgeDansOffre);
router.get('/entreprise/:entrepriseId/candidats', authorize('entreprise', 'admin'), rechercherCandidatsEntrepriseParBadge);

module.exports = router;
