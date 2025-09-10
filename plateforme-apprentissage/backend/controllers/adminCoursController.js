const Cours = require('../models/Cours');
const User = require('../models/User');
const mongoose = require('mongoose');

// Obtenir la liste des cours avec filtres pour l'admin
const getCourses = async (req, res) => {
  try {
    const { 
      search = '', 
      category = '', 
      level = '', 
      status = '', 
      page = 1, 
      limit = 10 
    } = req.query;

    // Construire le filtre de recherche
    let filter = {};
    
    if (search) {
      filter.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter.categorie = category;
    }
    
    if (level) {
      filter.niveau = level;
    }
    
    if (status) {
      filter.statut = status;
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

// Obtenir un cours par ID avec statistiques détaillées
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID cours invalide'
      });
    }

    const course = await Cours.findById(id)
      .populate('createur', 'nom email photoProfil')
      .populate('modules.lecons.quiz', 'titre questions');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    // Calculer les statistiques du cours
    const enrollments = await User.countDocuments({
      'coursSuivis.cours': id
    });

    const completions = await User.countDocuments({
      'coursSuivis.cours': id,
      'coursSuivis.termine': true
    });

    // Calculer la note moyenne (simulation pour la démo)
    const averageRating = course.evaluations && course.evaluations.length > 0 
      ? course.evaluations.reduce((sum, eval) => sum + eval.note, 0) / course.evaluations.length
      : 0;

    res.json({
      success: true,
      data: {
        ...course.toObject(),
        stats: {
          enrollments,
          completions,
          averageRating: Math.round(averageRating * 10) / 10,
          completionRate: enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du cours'
    });
  }
};

// Mettre à jour un cours
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID cours invalide'
      });
    }

    // Supprimer les champs non modifiables
    delete updates._id;
    delete updates.__v;
    delete updates.dateCreation;
    delete updates.createur;

    const course = await Cours.findByIdAndUpdate(
      id,
      { 
        $set: {
          ...updates,
          dateModification: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('createur', 'nom email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    res.json({
      success: true,
      data: course,
      message: 'Cours mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du cours'
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

    // Vérifier si des utilisateurs suivent ce cours
    const enrolledUsers = await User.countDocuments({
      'coursSuivis.cours': id
    });

    if (enrolledUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce cours. ${enrolledUsers} utilisateur(s) y sont inscrits.`
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

// Basculer le statut d'un cours (publié/brouillon/archivé)
const toggleCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID cours invalide'
      });
    }

    const validStatuses = ['brouillon', 'publie', 'archive'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Utilisez: brouillon, publie, ou archive'
      });
    }

    const course = await Cours.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    // Si aucun statut spécifié, basculer entre publié et brouillon
    if (!status) {
      course.statut = course.statut === 'publie' ? 'brouillon' : 'publie';
    } else {
      course.statut = status;
    }

    course.dateModification = new Date();
    await course.save();

    res.json({
      success: true,
      data: {
        _id: course._id,
        titre: course.titre,
        statut: course.statut
      },
      message: `Cours ${course.statut === 'publie' ? 'publié' : course.statut === 'archive' ? 'archivé' : 'mis en brouillon'} avec succès`
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut'
    });
  }
};

// Obtenir les statistiques détaillées d'un cours
const getCourseStats = async (req, res) => {
  try {
    const { id } = req.params;
    
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

    // Statistiques d'inscription
    const enrollments = await User.countDocuments({
      'coursSuivis.cours': id
    });

    const completions = await User.countDocuments({
      'coursSuivis.cours': id,
      'coursSuivis.termine': true
    });

    // Progression moyenne
    const usersWithProgress = await User.find({
      'coursSuivis.cours': id
    }).select('coursSuivis');

    let totalProgress = 0;
    let progressCount = 0;

    usersWithProgress.forEach(user => {
      const courseProgress = user.coursSuivis.find(c => c.cours.toString() === id);
      if (courseProgress) {
        totalProgress += courseProgress.progression || 0;
        progressCount++;
      }
    });

    const averageProgress = progressCount > 0 ? Math.round(totalProgress / progressCount) : 0;

    // Note moyenne
    const averageRating = course.evaluations && course.evaluations.length > 0 
      ? course.evaluations.reduce((sum, eval) => sum + eval.note, 0) / course.evaluations.length
      : 0;

    // Revenus simulés (à adapter selon votre modèle de prix)
    const revenue = enrollments * (course.prix || 0);

    res.json({
      success: true,
      data: {
        enrollments,
        completions,
        averageRating: Math.round(averageRating * 10) / 10,
        revenue,
        completionRate: enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0,
        averageProgress
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Obtenir les cours les plus populaires
const getTopCourses = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Agrégation pour obtenir les cours avec le plus d'inscriptions
    const topCourses = await User.aggregate([
      { $unwind: '$coursSuivis' },
      {
        $group: {
          _id: '$coursSuivis.cours',
          enrollments: { $sum: 1 },
          completions: {
            $sum: { $cond: ['$coursSuivis.termine', 1, 0] }
          }
        }
      },
      { $sort: { enrollments: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'cours',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $lookup: {
          from: 'users',
          localField: 'course.createur',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      { $unwind: '$instructor' },
      {
        $project: {
          course: {
            _id: '$course._id',
            titre: '$course.titre',
            description: '$course.description',
            prix: '$course.prix',
            image: '$course.image',
            createur: {
              nom: '$instructor.nom',
              email: '$instructor.email'
            }
          },
          enrollments: 1,
          revenue: { $multiply: ['$enrollments', { $ifNull: ['$course.prix', 0] }] },
          rating: { $ifNull: ['$course.noteGlobale', 0] }
        }
      }
    ]);

    res.json({
      success: true,
      data: topCourses
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des cours populaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des cours populaires'
    });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  toggleCourseStatus,
  getCourseStats,
  getTopCourses
};
