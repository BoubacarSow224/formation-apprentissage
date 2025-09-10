const User = require('../models/User');
const Cours = require('../models/Cours');
const Quiz = require('../models/Quiz');
const mongoose = require('mongoose');

// Obtenir les statistiques générales du dashboard admin
const getAdminStats = async (req, res) => {
  try {
    // Statistiques des utilisateurs
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ actif: true });
    
    // Nouveaux utilisateurs ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({
      dateInscription: { $gte: startOfMonth }
    });

    // Statistiques des cours
    const totalCourses = await Cours.countDocuments();
    const publishedCourses = await Cours.countDocuments({ statut: 'publie' });
    const pendingModeration = await Cours.countDocuments({ statutModeration: 'en_attente' });

    // Statistiques des quiz
    const totalQuizzes = await Quiz.countDocuments();
    const activeQuizzes = await Quiz.countDocuments({ actif: true });

    // Calcul du taux de complétion des cours
    const usersWithCourses = await User.find({ 
      'coursSuivis.0': { $exists: true } 
    }).select('coursSuivis');
    
    let coursesCompleted = 0;
    usersWithCourses.forEach(user => {
      coursesCompleted += user.coursSuivis.filter(cours => cours.termine).length;
    });

    // Statistiques fictives pour la démo (à remplacer par de vraies données)
    const totalJobs = 45; // À implémenter avec le modèle Job
    const revenue = 15420; // À calculer depuis les inscriptions payantes

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCourses: publishedCourses,
        totalQuizzes: activeQuizzes,
        totalJobs,
        activeUsers,
        newUsersThisMonth,
        coursesCompleted,
        revenue,
        pendingModeration
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Obtenir les données de croissance des utilisateurs
const getUserGrowthData = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let dateRange, groupFormat;

    const now = new Date();
    
    switch (period) {
      case 'week':
        dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$dateInscription" } };
        break;
      case 'year':
        dateRange = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$dateInscription" } };
        break;
      default: // month
        dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$dateInscription" } };
    }

    const growthData = await User.aggregate([
      {
        $match: {
          dateInscription: { $gte: dateRange }
        }
      },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const labels = growthData.map(item => item._id);
    const data = growthData.map(item => item.count);

    res.json({
      success: true,
      data: { labels, data }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données de croissance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données de croissance'
    });
  }
};

// Obtenir les données de complétion des cours
const getCourseCompletionData = async (req, res) => {
  try {
    const users = await User.find({ 'coursSuivis.0': { $exists: true } }).select('coursSuivis');
    
    let completed = 0;
    let inProgress = 0;
    let abandoned = 0;

    users.forEach(user => {
      user.coursSuivis.forEach(cours => {
        if (cours.termine) {
          completed++;
        } else if (cours.progression > 50) {
          inProgress++;
        } else {
          abandoned++;
        }
      });
    });

    res.json({
      success: true,
      data: { completed, inProgress, abandoned }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données de complétion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données de complétion'
    });
  }
};

// Obtenir les logs d'activité récents
const getActivityLogs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Récupérer les utilisateurs récemment inscrits
    const recentUsers = await User.find()
      .sort({ dateInscription: -1 })
      .limit(parseInt(limit) / 2)
      .select('nom email dateInscription');

    // Récupérer les cours récemment créés
    const recentCourses = await Cours.find()
      .sort({ dateCreation: -1 })
      .limit(parseInt(limit) / 2)
      .populate('createur', 'nom')
      .select('titre createur dateCreation');

    // Combiner et formater les activités
    const activities = [];
    
    recentUsers.forEach(user => {
      activities.push({
        id: user._id,
        type: 'user',
        action: 'Nouvel utilisateur inscrit',
        user: user.nom,
        target: user.email,
        timestamp: user.dateInscription,
        details: { userId: user._id }
      });
    });

    recentCourses.forEach(cours => {
      activities.push({
        id: cours._id,
        type: 'course',
        action: 'Nouveau cours créé',
        user: cours.createur?.nom || 'Utilisateur inconnu',
        target: cours.titre,
        timestamp: cours.dateCreation,
        details: { courseId: cours._id }
      });
    });

    // Trier par date décroissante
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: activities.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des logs d\'activité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs d\'activité'
    });
  }
};

// Gestion des utilisateurs - Liste avec filtres
const getUsers = async (req, res) => {
  try {
    const { 
      search = '', 
      role = '', 
      status = '', 
      page = 1, 
      limit = 10 
    } = req.query;

    // Construire le filtre de recherche
    let filter = {};
    
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { telephone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (status === 'active') {
      filter.actif = true;
    } else if (status === 'inactive') {
      filter.actif = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ dateInscription: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        total,
        page: parseInt(page),
        totalPages
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};

// Obtenir un utilisateur par ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('coursSuivis.cours', 'titre');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
};

// Mettre à jour un utilisateur
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    // Supprimer les champs sensibles des mises à jour
    delete updates.password;
    delete updates._id;
    delete updates.__v;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur'
    });
  }
};

// Supprimer un utilisateur
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    // Vérifier que l'utilisateur n'essaie pas de se supprimer lui-même
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
};

// Basculer le statut d'un utilisateur (actif/inactif)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    user.actif = !user.actif;
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        actif: user.actif
      },
      message: `Utilisateur ${user.actif ? 'activé' : 'désactivé'} avec succès`
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut'
    });
  }
};

module.exports = {
  getAdminStats,
  getUserGrowthData,
  getCourseCompletionData,
  getActivityLogs,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus
};
