const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Cours = require('../models/Cours');
const mongoose = require('mongoose');

// Obtenir la liste des quiz avec filtres pour l'admin
const getQuizzes = async (req, res) => {
  try {
    const { 
      search = '', 
      difficulty = '', 
      status = '', 
      course = '',
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
    
    if (difficulty) {
      filter.difficulte = difficulty;
    }
    
    if (status === 'active') {
      filter.actif = true;
    } else if (status === 'inactive') {
      filter.actif = false;
    }

    if (course) {
      filter.cours = course;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const quizzes = await Quiz.find(filter)
      .populate('createur', 'nom email')
      .populate('cours', 'titre')
      .sort({ dateCreation: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Quiz.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        quizzes,
        total,
        page: parseInt(page),
        totalPages
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des quiz'
    });
  }
};

// Obtenir un quiz par ID avec statistiques détaillées
const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID quiz invalide'
      });
    }

    const quiz = await Quiz.findById(id)
      .populate('createur', 'nom email photoProfil')
      .populate('cours', 'titre description');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du quiz'
    });
  }
};

// Créer un nouveau quiz
const createQuiz = async (req, res) => {
  try {
    const quizData = {
      ...req.body,
      createur: req.user._id,
      dateCreation: new Date()
    };

    const quiz = new Quiz(quizData);
    await quiz.save();

    const populatedQuiz = await Quiz.findById(quiz._id)
      .populate('createur', 'nom email')
      .populate('cours', 'titre');

    res.status(201).json({
      success: true,
      data: populatedQuiz,
      message: 'Quiz créé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création du quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du quiz'
    });
  }
};

// Mettre à jour un quiz
const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID quiz invalide'
      });
    }

    // Supprimer les champs non modifiables
    delete updates._id;
    delete updates.__v;
    delete updates.dateCreation;
    delete updates.createur;

    const quiz = await Quiz.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('createur', 'nom email')
     .populate('cours', 'titre');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    res.json({
      success: true,
      data: quiz,
      message: 'Quiz mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du quiz'
    });
  }
};

// Supprimer un quiz
const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID quiz invalide'
      });
    }

    const quiz = await Quiz.findByIdAndDelete(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Quiz supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du quiz'
    });
  }
};

// Basculer le statut d'un quiz (actif/inactif)
const toggleQuizStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID quiz invalide'
      });
    }

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    quiz.actif = !quiz.actif;
    await quiz.save();

    res.json({
      success: true,
      data: {
        _id: quiz._id,
        titre: quiz.titre,
        actif: quiz.actif
      },
      message: `Quiz ${quiz.actif ? 'activé' : 'désactivé'} avec succès`
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut'
    });
  }
};

// Obtenir les statistiques détaillées d'un quiz
const getQuizStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID quiz invalide'
      });
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    // Pour la démo, on simule les statistiques
    // Dans une vraie application, vous auriez un modèle QuizAttempt ou similaire
    const attempts = Math.floor(Math.random() * 100) + 10;
    const averageScore = Math.floor(Math.random() * 40) + 60; // Entre 60 et 100
    const passRate = Math.floor(Math.random() * 30) + 70; // Entre 70 et 100

    res.json({
      success: true,
      data: {
        attempts,
        averageScore,
        passRate
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

// Obtenir les quiz les plus populaires
const getTopQuizzes = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topQuizzes = await Quiz.find({ actif: true })
      .populate('createur', 'nom email')
      .populate('cours', 'titre')
      .sort({ dateCreation: -1 })
      .limit(parseInt(limit));

    // Ajouter des statistiques simulées
    const quizzesWithStats = topQuizzes.map(quiz => ({
      quiz: quiz.toObject(),
      attempts: Math.floor(Math.random() * 100) + 10,
      averageScore: Math.floor(Math.random() * 40) + 60,
      passRate: Math.floor(Math.random() * 30) + 70
    }));

    res.json({
      success: true,
      data: quizzesWithStats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz populaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des quiz populaires'
    });
  }
};

module.exports = {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  toggleQuizStatus,
  getQuizStats,
  getTopQuizzes
};
