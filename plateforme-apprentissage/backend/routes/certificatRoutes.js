const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { downloadCertificat } = require('../controllers/certificatController');

// Toutes les routes certificats nécessitent authentification
router.use(protect);

// Télécharger/générer le PDF d'un certificat
// GET /api/certificats/:id/download
router.get('/:id/download', downloadCertificat);

module.exports = router;
