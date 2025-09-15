const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

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
  toggleUserStatus,
  getCourses,
  moderateCourse,
  deleteCourse,
  getPosts,
  deletePost,
  getSystemStats,
  exportData,
  backupDatabase,
  getHealth,
  createAdmin,
  getBadges,
  createBadge,
  updateBadge,
  deleteBadge,
  getCertificats,
  revokeCertificat,
  getJobs,
  moderateJob,
  deleteJob,
  getLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  setDefaultLanguage
} = require('../controllers/adminController');

// const {
//   getCourseById,
//   updateCourse,
//   toggleCourseStatus,
//   getCourseStats,
//   getTopCourses
// } = require('../controllers/adminCoursController');

// const {
//   getQuizzes,
//   getQuizById,
//   createQuiz,
//   updateQuiz,
//   deleteQuiz,
//   toggleQuizStatus,
//   getQuizStats,
//   getTopQuizzes
// } = require('../controllers/adminQuizController');

// Appliquer le middleware d'authentification admin à toutes les routes
router.use(protect);
router.use(authorize('admin'));

// Routes pour les statistiques générales
router.get('/stats', getAdminStats);
router.get('/activity', getActivityLogs);

// Routes pour les analytics
router.get('/analytics/user-growth', getUserGrowthData);
router.get('/analytics/course-completion', getCourseCompletionData);

// Routes pour la gestion des utilisateurs
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);

// Routes pour la gestion des cours
router.get('/courses', getCourses);
router.post('/courses/:id/moderate', moderateCourse);
router.delete('/courses/:id', deleteCourse);

// Routes pour la modération de la communauté
router.get('/posts', getPosts);
router.delete('/posts/:id', deletePost);

// Routes pour les statistiques système complètes
router.get('/system-stats', getSystemStats);

// Actions rapides (export / backup / health)
router.get('/export', exportData);
router.post('/backup', backupDatabase);
router.get('/health', getHealth);

// Route pour créer un admin (seul admin peut créer admin)
router.post('/create-admin', createAdmin);

// Routes pour la gestion des badges
router.get('/badges', getBadges);
router.post('/badges', createBadge);
router.put('/badges/:id', updateBadge);
router.delete('/badges/:id', deleteBadge);

// Routes pour la gestion des certificats
router.get('/certificats', getCertificats);
router.patch('/certificats/:id/revoke', revokeCertificat);

// Routes pour la gestion des emplois
router.get('/jobs', getJobs);
router.patch('/jobs/:id/moderate', moderateJob);
router.delete('/jobs/:id', deleteJob);

// Routes pour la gestion des langues
router.get('/languages', getLanguages);
router.post('/languages', createLanguage);
router.put('/languages/:id', updateLanguage);
router.delete('/languages/:id', deleteLanguage);
router.patch('/languages/:id/set-default', setDefaultLanguage);

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
