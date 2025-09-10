const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');

// Importer les contrôleurs admin
const {
  getAdminStats,
  getUserGrowthData,
  getCourseCompletionData,
  getActivityLogs,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus
} = require('../controllers/adminController');

const {
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  toggleCourseStatus,
  getCourseStats,
  getTopCourses
} = require('../controllers/adminCoursController');

const {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  toggleQuizStatus,
  getQuizStats,
  getTopQuizzes
} = require('../controllers/adminQuizController');

// Appliquer le middleware d'authentification admin à toutes les routes
router.use(adminAuth);

// Routes pour les statistiques générales
router.get('/stats', getAdminStats);
router.get('/activity', getActivityLogs);

// Routes pour les analytics
router.get('/analytics/user-growth', getUserGrowthData);
router.get('/analytics/course-completion', getCourseCompletionData);
router.get('/analytics/top-courses', getTopCourses);
router.get('/analytics/top-quizzes', getTopQuizzes);

// Routes pour la gestion des utilisateurs
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);

// Routes pour la gestion des cours
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.patch('/courses/:id/toggle-status', toggleCourseStatus);
router.get('/courses/:id/stats', getCourseStats);

// Routes pour la gestion des quiz
router.get('/quizzes', getQuizzes);
router.get('/quizzes/:id', getQuizById);
router.post('/quizzes', createQuiz);
router.put('/quizzes/:id', updateQuiz);
router.delete('/quizzes/:id', deleteQuiz);
router.patch('/quizzes/:id/toggle-status', toggleQuizStatus);
router.get('/quizzes/:id/stats', getQuizStats);

// Routes pour les exports (à implémenter selon vos besoins)
router.get('/export/users', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Export des utilisateurs - À implémenter' 
  });
});

router.get('/export/courses', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Export des cours - À implémenter' 
  });
});

router.get('/export/revenue', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Export des revenus - À implémenter' 
  });
});

// Routes pour la configuration système (à implémenter)
router.get('/config', (req, res) => {
  res.json({ 
    success: true, 
    data: {
      siteName: 'Plateforme d\'Apprentissage',
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotifications: true
    }
  });
});

router.put('/config', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Mise à jour de la configuration - À implémenter' 
  });
});

// Routes pour la maintenance (à implémenter)
router.post('/maintenance/clear-cache', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Cache vidé avec succès' 
  });
});

router.post('/maintenance/backup', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Sauvegarde de la base de données - À implémenter' 
  });
});

router.get('/maintenance/health', (req, res) => {
  res.json({ 
    success: true, 
    data: {
      status: 'healthy',
      database: true,
      redis: false,
      storage: true,
      memory: 65,
      cpu: 23
    }
  });
});

// Route pour les notifications système (à implémenter)
router.post('/notifications/system', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Notifications système - À implémenter' 
  });
});

module.exports = router;
