const User = require('../models/User');
const Cours = require('../models/Cours');
const Quiz = require('../models/Quiz');
const Badge = require('../models/Badge');
const Certificat = require('../models/Certificat');
const Job = require('../models/Job');
const Language = require('../models/Language');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Obtenir les statistiques générales du dashboard admin
const getAdminStats = async (req, res) => {
  try {
    // Statistiques des utilisateurs
    const totalUsers = await User.countDocuments();
    // Utilisateurs actifs en ligne (dernière activité < 5 minutes)
    const ACTIVE_WINDOW_MINUTES = 5;
    const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000);
    const activeUsers = await User.countDocuments({ enLigne: true, derniereActiviteAt: { $gte: activeSince } });
    
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

    // Statistiques des emplois
    const totalJobs = await Job.countDocuments();
    const jobsEnAttente = await Job.countDocuments({ statutModeration: 'en_attente' });
    const jobsApprouves = await Job.countDocuments({ statutModeration: 'approuve' });
    
    // Statistiques des badges et certificats
    const totalBadges = await Badge.countDocuments();
    const badgesActifs = await Badge.countDocuments({ estActif: true });
    const totalCertificats = await Certificat.countDocuments();
    const certificatsValides = await Certificat.countDocuments({ estValide: true, estRevoque: false });
    
    // Revenue fictif pour la démo (à calculer depuis les inscriptions payantes)
    const revenue = 15420;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCourses: publishedCourses,
        totalQuizzes: activeQuizzes,
        totalJobs,
        jobsEnAttente,
        jobsApprouves,
        totalBadges,
        badgesActifs,
        totalCertificats,
        certificatsValides,
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
    
    // Filtre de statut (actif/inactif) basé sur enLigne + derniereActiviteAt
    if (status === 'active' || status === 'inactive') {
      const ACTIVE_WINDOW_MINUTES = 5;
      const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000);
      if (status === 'active') {
        filter.enLigne = true;
        filter.derniereActiviteAt = { $gte: activeSince };
      } else {
        // Inactif: soit pas enLigne, soit pas d'activité récente
        filter.$or = [
          { enLigne: { $ne: true } },
          { derniereActiviteAt: { $lt: activeSince } }
        ];
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const usersRaw = await User.find(filter)
      .select('-password')
      .sort({ dateInscription: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Ajouter un champ 'actif' calculé pour compatibilité avec le frontend
    const ACTIVE_WINDOW_MINUTES = 5;
    const activeSinceCalc = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000);
    const users = usersRaw.map(u => {
      const obj = u.toObject();
      const isActive = !!obj.enLigne && obj.derniereActiviteAt && new Date(obj.derniereActiviteAt) >= activeSinceCalc;
      obj.actif = isActive;
      return obj;
    });

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

// Gestion des cours - Liste avec filtres
const getCourses = async (req, res) => {
  try {
    const { 
      search = '', 
      status = '', 
      creator = '',
      page = 1, 
      limit = 10 
    } = req.query;

    let filter = {};
    
    if (search) {
      filter.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.statut = status;
    }
    
    if (creator) {
      filter.createur = creator;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const courses = await Cours.find(filter)
      .populate('createur', 'nom email')
      .sort({ dateCreation: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Cours.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        courses,
        total,
        page: parseInt(page),
        totalPages
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des cours'
    });
  }
};

// Modérer un cours
const moderateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve', 'reject'
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID cours invalide'
      });
    }

    const course = await Cours.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    if (action === 'approve') {
      course.statutModeration = 'approuve';
      course.statut = 'publie';
    } else if (action === 'reject') {
      course.statutModeration = 'rejete';
      course.raisonRejet = reason;
    }

    course.dateModeration = new Date();
    course.moderateur = req.user._id;
    await course.save();

    res.json({
      success: true,
      data: course,
      message: `Cours ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`
    });
  } catch (error) {
    console.error('Erreur lors de la modération:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modération'
    });
  }
};

// Supprimer un cours
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID cours invalide'
      });
    }

    const course = await Cours.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Cours supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du cours'
    });
  }
};

// Gestion des posts de la communauté
const getPosts = async (req, res) => {
  try {
    const { 
      search = '', 
      status = 'active',
      page = 1, 
      limit = 10 
    } = req.query;

    const Post = require('../models/Post');
    let filter = {};
    
    if (search) {
      filter.contenu = { $regex: search, $options: 'i' };
    }
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'deleted') {
      filter.isActive = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await Post.find(filter)
      .populate('auteur', 'nom email photoProfil')
      .sort({ dateCreation: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        posts,
        total,
        page: parseInt(page),
        totalPages
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des posts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des posts'
    });
  }
};

// Supprimer un post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID post invalide'
      });
    }

    const Post = require('../models/Post');
    const post = await Post.findByIdAndUpdate(
      id,
      { isActive: false, dateModeration: new Date(), moderateur: req.user._id },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Post supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du post'
    });
  }
};

// Obtenir les statistiques complètes du système
const getSystemStats = async (req, res) => {
  try {
    const Post = require('../models/Post');
    
    // Stats utilisateurs
    const totalUsers = await User.countDocuments();
    const ACTIVE_WINDOW_MINUTES = 5;
    const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000);
    const activeUsers = await User.countDocuments({ enLigne: true, derniereActiviteAt: { $gte: activeSince } });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const formateurUsers = await User.countDocuments({ role: 'formateur' });
    const apprenantUsers = await User.countDocuments({ role: 'apprenant' });
    
    // Stats cours
    const totalCourses = await Cours.countDocuments();
    const publishedCourses = await Cours.countDocuments({ statut: 'publie' });
    const pendingCourses = await Cours.countDocuments({ statutModeration: 'en_attente' });
    
    // Stats communauté
    const totalPosts = await Post.countDocuments({ isActive: true });
    const totalLikes = await Post.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: { $size: '$likes' } } } }
    ]);
    
    // Stats quiz
    const totalQuizzes = await Quiz.countDocuments();
    const activeQuizzes = await Quiz.countDocuments({ actif: true });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: {
            admin: adminUsers,
            formateur: formateurUsers,
            apprenant: apprenantUsers
          }
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          pending: pendingCourses
        },
        community: {
          posts: totalPosts,
          likes: totalLikes[0]?.total || 0
        },
        quizzes: {
          total: totalQuizzes,
          active: activeQuizzes
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques système:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques système'
    });
  }
};

// Créer un nouvel administrateur (seul admin peut créer admin)
const createAdmin = async (req, res) => {
  try {
    console.log('Tentative de création d\'admin par:', req.user.email);
    const { nom, email, telephone, password } = req.body;

    // Validation des champs requis
    if (!nom || !email || !telephone || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Tous les champs sont obligatoires (nom, email, telephone, password)' 
      });
    }

    // Vérifier que seul un admin peut créer un admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Seuls les administrateurs peuvent créer d\'autres administrateurs' 
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Veuillez entrer une adresse email valide' 
      });
    }

    // Validation du téléphone
    if (telephone.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Le numéro de téléphone doit contenir au moins 8 caractères' 
      });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { telephone }] 
    });
    
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Un utilisateur avec cet email ou ce téléphone existe déjà' 
      });
    }

    // Créer le nouvel admin
    const newAdmin = await User.create({
      nom: nom.trim(),
      email: email.toLowerCase().trim(),
      telephone: telephone.trim(),
      password,
      role: 'admin',
      estActif: true
    });

    console.log('Nouvel admin créé avec succès:', newAdmin._id, 'par:', req.user.email);

    res.status(201).json({
      success: true,
      message: 'Administrateur créé avec succès',
      data: {
        admin: {
          _id: newAdmin._id,
          nom: newAdmin.nom,
          email: newAdmin.email,
          telephone: newAdmin.telephone,
          role: newAdmin.role,
          dateInscription: newAdmin.dateInscription
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'admin:', error);
    
    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ')
      });
    }

    // Gestion des erreurs de duplication MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        success: false,
        message: `Un utilisateur avec ce ${field} existe déjà`
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la création de l\'administrateur', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// ===== GESTION DES BADGES =====

// Obtenir tous les badges
const getBadges = async (req, res) => {
  try {
    const badges = await Badge.find()
      .populate('cours', 'titre')
      .populate('validePar', 'nom email')
      .sort({ dateCreation: -1 });

    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des badges:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des badges',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Créer un nouveau badge
const createBadge = async (req, res) => {
  try {
    const { nom, description, image, niveau, cours, competencesValidees, criteresObtention } = req.body;

    // Validation des champs requis
    if (!nom || !description || !image || !cours || !criteresObtention) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Vérifier que le cours existe
    const coursExiste = await Cours.findById(cours);
    if (!coursExiste) {
      return res.status(404).json({
        success: false,
        message: 'Le cours spécifié n\'existe pas'
      });
    }

    const nouveauBadge = await Badge.create({
      nom,
      description,
      image,
      niveau: niveau || 'bronze',
      cours,
      competencesValidees: competencesValidees || [],
      criteresObtention,
      estValide: true,
      validePar: req.user._id,
      dateValidation: new Date()
    });

    // Générer le QR code
    await nouveauBadge.genererQRCode();

    const badgePopule = await Badge.findById(nouveauBadge._id)
      .populate('cours', 'titre')
      .populate('validePar', 'nom email');

    res.status(201).json({
      success: true,
      message: 'Badge créé avec succès',
      data: badgePopule
    });
  } catch (error) {
    console.error('Erreur lors de la création du badge:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un badge avec ce nom existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du badge',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Mettre à jour un badge
const updateBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const badge = await Badge.findByIdAndUpdate(
      id,
      { ...updates, validePar: req.user._id, dateValidation: new Date() },
      { new: true, runValidators: true }
    ).populate('cours', 'titre').populate('validePar', 'nom email');

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Badge mis à jour avec succès',
      data: badge
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du badge:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du badge',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Supprimer un badge
const deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;

    const badge = await Badge.findByIdAndDelete(id);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Badge supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du badge:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du badge',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// ===== GESTION DES CERTIFICATS =====

// Obtenir tous les certificats
const getCertificats = async (req, res) => {
  try {
    const certificats = await Certificat.find()
      .populate('utilisateur', 'nom email')
      .populate('cours', 'titre')
      .populate('formateur', 'nom email')
      .populate('revoquePar', 'nom email')
      .sort({ dateObtention: -1 });

    res.json({
      success: true,
      data: certificats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des certificats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des certificats',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Révoquer un certificat
const revokeCertificat = async (req, res) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;

    if (!raison) {
      return res.status(400).json({
        success: false,
        message: 'La raison de révocation est requise'
      });
    }

    const certificat = await Certificat.findById(id);
    if (!certificat) {
      return res.status(404).json({
        success: false,
        message: 'Certificat non trouvé'
      });
    }

    if (certificat.estRevoque) {
      return res.status(400).json({
        success: false,
        message: 'Ce certificat est déjà révoqué'
      });
    }

    await certificat.revoquer(req.user._id, raison);

    const certificatMisAJour = await Certificat.findById(id)
      .populate('utilisateur', 'nom email')
      .populate('cours', 'titre')
      .populate('revoquePar', 'nom email');

    res.json({
      success: true,
      message: 'Certificat révoqué avec succès',
      data: certificatMisAJour
    });
  } catch (error) {
    console.error('Erreur lors de la révocation du certificat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la révocation du certificat',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// ===== GESTION DES EMPLOIS =====

// Obtenir toutes les offres d'emploi
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('entreprise', 'nom email')
      .populate('moderePar', 'nom email')
      .sort({ datePublication: -1 });

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des emplois:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des emplois',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Modérer une offre d'emploi (approuver/rejeter)
const moderateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, raison } = req.body;

    if (!['approuver', 'rejeter'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action invalide. Utilisez "approuver" ou "rejeter"'
      });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Offre d\'emploi non trouvée'
      });
    }

    if (action === 'approuver') {
      await job.approuver(req.user._id);
    } else {
      if (!raison) {
        return res.status(400).json({
          success: false,
          message: 'La raison du rejet est requise'
        });
      }
      await job.rejeter(req.user._id, raison);
    }

    const jobMisAJour = await Job.findById(id)
      .populate('entreprise', 'nom email')
      .populate('moderePar', 'nom email');

    res.json({
      success: true,
      message: `Offre d'emploi ${action === 'approuver' ? 'approuvée' : 'rejetée'} avec succès`,
      data: jobMisAJour
    });
  } catch (error) {
    console.error('Erreur lors de la modération de l\'emploi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modération de l\'emploi',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Supprimer une offre d'emploi
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByIdAndDelete(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Offre d\'emploi non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Offre d\'emploi supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'emploi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de l\'emploi',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// ===== GESTION DES LANGUES =====

// Obtenir toutes les langues
const getLanguages = async (req, res) => {
  try {
    const languages = await Language.find().sort({ estParDefaut: -1, nom: 1 });

    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des langues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des langues',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Créer une nouvelle langue
const createLanguage = async (req, res) => {
  try {
    const { code, nom, nomNatif, direction, drapeau, traductions } = req.body;

    if (!code || !nom || !nomNatif) {
      return res.status(400).json({
        success: false,
        message: 'Le code, nom et nom natif sont obligatoires'
      });
    }

    const nouvelleLangue = await Language.create({
      code: code.toLowerCase(),
      nom,
      nomNatif,
      direction: direction || 'ltr',
      drapeau: drapeau || '🌐',
      traductions: traductions || {},
      estActif: true
    });

    nouvelleLangue.calculerCompletude();
    await nouvelleLangue.save();

    res.status(201).json({
      success: true,
      message: 'Langue créée avec succès',
      data: nouvelleLangue
    });
  } catch (error) {
    console.error('Erreur lors de la création de la langue:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Une langue avec ce code existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la langue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Mettre à jour une langue
const updateLanguage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const langue = await Language.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!langue) {
      return res.status(404).json({
        success: false,
        message: 'Langue non trouvée'
      });
    }

    if (updates.traductions) {
      langue.calculerCompletude();
      await langue.save();
    }

    res.json({
      success: true,
      message: 'Langue mise à jour avec succès',
      data: langue
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la langue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de la langue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Supprimer une langue
const deleteLanguage = async (req, res) => {
  try {
    const { id } = req.params;

    const langue = await Language.findById(id);
    if (!langue) {
      return res.status(404).json({
        success: false,
        message: 'Langue non trouvée'
      });
    }

    if (langue.estParDefaut) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer la langue par défaut'
      });
    }

    await Language.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Langue supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la langue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de la langue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Définir une langue par défaut
const setDefaultLanguage = async (req, res) => {
  try {
    const { id } = req.params;

    const langue = await Language.findById(id);
    if (!langue) {
      return res.status(404).json({
        success: false,
        message: 'Langue non trouvée'
      });
    }

    if (!langue.estActif) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de définir une langue inactive comme défaut'
      });
    }

    langue.estParDefaut = true;
    await langue.save();

    res.json({
      success: true,
      message: 'Langue définie comme défaut avec succès',
      data: langue
    });
  } catch (error) {
    console.error('Erreur lors de la définition de la langue par défaut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la définition de la langue par défaut',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
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
  toggleUserStatus,
  getCourses,
  moderateCourse,
  deleteCourse,
  getPosts,
  deletePost,
  getSystemStats,
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
};
