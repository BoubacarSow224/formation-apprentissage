const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { start, stop, stats, history, byCourse } = require('../controllers/studyController');

router.use(protect);

// Démarrer/Arrêter une session d'étude
router.post('/start', start);
router.post('/stop', stop);

// Statistiques d'étude
router.get('/stats', stats);

// Analytics
router.get('/history', history);
router.get('/by-course', byCourse);

module.exports = router;
