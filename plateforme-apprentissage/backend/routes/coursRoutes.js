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
  publierCours,
  depublierCours
} = require('../controllers/coursController');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Cours = require('../models/Cours');

// Routes publiques
router.get('/', advancedResults(Cours, 'formateur'), getTousLesCours);
router.get('/public', getCoursPublics);
router.get('/:id', getCours);
router.get('/formateur/:id', getCoursParFormateur);

// Routes protégées (authentification requise)
router.use(protect);

// Routes pour les apprenants
router.post('/:id/inscription', authorize('apprenant'), inscriptionCours);
router.put('/:id/progression', authorize('apprenant'), mettreAJourProgression);

// Routes pour les statistiques formateur
router.get('/formateur/stats', authorize('formateur'), async (req, res) => {
  try {
    const formateurId = req.user.id;
    
    // Compter les cours créés par le formateur
    const coursCreated = await Cours.countDocuments({ formateur: formateurId });
    
    // Calculer le nombre total d'étudiants
    const cours = await Cours.find({ formateur: formateurId });
    let totalStudents = 0;
    cours.forEach(c => {
      totalStudents += c.etudiants ? c.etudiants.length : 0;
    });
    
    res.json({
      success: true,
      data: {
        coursCreated,
        totalStudents,
        averageRating: 4.2,
        totalRevenue: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des statistiques'
    });
  }
});

router.get('/formateur/recents', authorize('formateur'), async (req, res) => {
  try {
    const formateurId = req.user.id;
    const cours = await Cours.find({ formateur: formateurId })
      .sort({ dateCreation: -1 })
      .limit(5)
      .select('titre description niveau prix dateCreation');
    
    const coursFormatted = cours.map(c => ({
      _id: c._id,
      titre: c.titre,
      students: 0,
      rating: 4.2,
      status: 'Publié'
    }));
    
    res.json({
      success: true,
      data: coursFormatted
    });
  } catch (error) {
    res.json([]);
  }
});

router.get('/formateur/etudiants-recents', authorize('formateur'), async (req, res) => {
  try {
    const etudiants = [
      {
        id: 1,
        name: 'Étudiant Test',
        course: 'Cours de test',
        progress: 75
      }
    ];
    
    res.json({
      success: true,
      data: etudiants
    });
  } catch (error) {
    res.json([]);
  }
});

// Routes pour les formateurs
router.post('/', authorize('formateur', 'admin'), createCours);
router.put('/:id', authorize('formateur', 'admin'), updateCours);
router.delete('/:id', authorize('formateur', 'admin'), deleteCours);
router.put('/:id/publier', authorize('formateur', 'admin'), publierCours);
router.put('/:id/depublier', authorize('formateur', 'admin'), depublierCours);

// Routes pour les administrateurs
router.put('/:id/approuver', authorize('admin'), approuverCours);

module.exports = router;
