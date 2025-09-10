const express = require('express');
const {
  creerQuiz,
  obtenirQuiz,
  obtenirQuizParId,
  mettreAJourQuiz,
  supprimerQuiz,
  soumettreReponses,
  obtenirStatistiques
} = require('../controllers/quizController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes publiques
router.get('/', obtenirQuiz);
router.get('/:id', obtenirQuizParId);

// Routes protégées
router.use(protect); // Toutes les routes suivantes nécessitent une authentification

router.post('/', authorize('formateur', 'admin'), creerQuiz);
router.put('/:id', authorize('formateur', 'admin'), mettreAJourQuiz);
router.delete('/:id', authorize('formateur', 'admin'), supprimerQuiz);
router.post('/:id/soumettre', soumettreReponses);
router.get('/:id/statistiques', authorize('formateur', 'admin'), obtenirStatistiques);

module.exports = router;
