const express = require('express');
const router = express.Router();
const {
  getCoursEnAttente,
  approuverCours,
  rejeterCours,
  suspendreCours,
  supprimerCours,
  getHistoriqueModeration,
  getStatistiquesModeration
} = require('../controllers/moderationController');
const { protect, adminOnly } = require('../middleware/auth');

// Toutes les routes de modération sont protégées et réservées aux admins
router.use(protect);
router.use(adminOnly);

// Routes de modération
router.get('/cours/en-attente', getCoursEnAttente);
router.get('/cours/historique', getHistoriqueModeration);
router.get('/cours/statistiques', getStatistiquesModeration);

router.put('/cours/:id/approuver', approuverCours);
router.put('/cours/:id/rejeter', rejeterCours);
router.put('/cours/:id/suspendre', suspendreCours);
router.delete('/cours/:id/supprimer', supprimerCours);

module.exports = router;
