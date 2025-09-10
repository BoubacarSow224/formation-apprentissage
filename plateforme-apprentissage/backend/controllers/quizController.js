const Quiz = require('../models/Quiz');
const Cours = require('../models/Cours');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Créer un nouveau quiz
// @route   POST /api/quiz
// @access  Private (Formateur/Admin)
exports.creerQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const quiz = await Quiz.create({
      ...req.body,
      createur: req.user.id
    });

    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Erreur lors de la création du quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du quiz'
    });
  }
};

// @desc    Obtenir tous les quiz
// @route   GET /api/quiz
// @access  Public
exports.obtenirQuiz = async (req, res) => {
  try {
    const { page = 1, limit = 10, cours, niveau, langue } = req.query;
    
    const query = { publie: true };
    if (cours) query.cours = cours;
    if (niveau) query.niveau = niveau;
    if (langue) query.langue = langue;

    const quiz = await Quiz.find(query)
      .populate('createur', 'nom prenom')
      .populate('cours', 'titre')
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quiz.countDocuments(query);

    res.status(200).json({
      success: true,
      count: quiz.length,
      total,
      data: quiz
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des quiz'
    });
  }
};

// @desc    Obtenir un quiz par ID
// @route   GET /api/quiz/:id
// @access  Public
exports.obtenirQuizParId = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createur', 'nom prenom')
      .populate('cours', 'titre description');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du quiz'
    });
  }
};

// @desc    Mettre à jour un quiz
// @route   PUT /api/quiz/:id
// @access  Private (Créateur/Admin)
exports.mettreAJourQuiz = async (req, res) => {
  try {
    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    // Vérifier si l'utilisateur est le créateur ou admin
    if (quiz.createur.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier ce quiz'
      });
    }

    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du quiz'
    });
  }
};

// @desc    Supprimer un quiz
// @route   DELETE /api/quiz/:id
// @access  Private (Créateur/Admin)
exports.supprimerQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    // Vérifier si l'utilisateur est le créateur ou admin
    if (quiz.createur.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer ce quiz'
      });
    }

    await Quiz.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Quiz supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du quiz'
    });
  }
};

// @desc    Soumettre les réponses à un quiz
// @route   POST /api/quiz/:id/soumettre
// @access  Private
exports.soumettreReponses = async (req, res) => {
  try {
    const { reponses } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    // Calculer le score
    let score = 0;
    let totalPoints = 0;
    const resultatsDetailles = [];

    quiz.questions.forEach((question, index) => {
      const reponseUtilisateur = reponses[index];
      let correct = false;
      let pointsObtenus = 0;

      totalPoints += question.points || 1;

      switch (question.type) {
        case 'choix_multiple':
        case 'choix_unique':
          const bonnesReponses = question.options
            .filter(opt => opt.correct)
            .map(opt => opt.texte);
          
          if (Array.isArray(reponseUtilisateur)) {
            correct = bonnesReponses.length === reponseUtilisateur.length &&
                     bonnesReponses.every(rep => reponseUtilisateur.includes(rep));
          } else {
            correct = bonnesReponses.includes(reponseUtilisateur);
          }
          break;

        case 'vrai_faux':
          correct = question.reponseCorrecte === reponseUtilisateur;
          break;

        case 'texte_libre':
          // Pour les questions ouvertes, on accepte la réponse (à corriger manuellement)
          correct = true;
          break;
      }

      if (correct) {
        pointsObtenus = question.points || 1;
        score += pointsObtenus;
      }

      resultatsDetailles.push({
        question: question.question,
        reponseUtilisateur,
        correct,
        pointsObtenus,
        pointsMax: question.points || 1
      });
    });

    const pourcentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    // Enregistrer le résultat
    const resultat = {
      utilisateur: req.user.id,
      quiz: quiz._id,
      score,
      totalPoints,
      pourcentage,
      reponses: resultatsDetailles,
      dateCompletion: new Date()
    };

    // Ajouter aux statistiques du quiz
    quiz.statistiques.tentatives += 1;
    quiz.statistiques.scoreMoyen = 
      (quiz.statistiques.scoreMoyen * (quiz.statistiques.tentatives - 1) + pourcentage) / 
      quiz.statistiques.tentatives;
    
    await quiz.save();

    // Mettre à jour les statistiques utilisateur
    await User.findByIdAndUpdate(req.user.id, {
      $push: { quizCompletes: resultat }
    });

    res.status(200).json({
      success: true,
      data: {
        score,
        totalPoints,
        pourcentage,
        resultats: resultatsDetailles,
        reussi: pourcentage >= (quiz.scoreMinimal || 60)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la soumission du quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la soumission du quiz'
    });
  }
};

// @desc    Obtenir les statistiques d'un quiz
// @route   GET /api/quiz/:id/statistiques
// @access  Private (Créateur/Admin)
exports.obtenirStatistiques = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz non trouvé'
      });
    }

    // Vérifier les permissions
    if (quiz.createur.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à voir ces statistiques'
      });
    }

    res.status(200).json({
      success: true,
      data: quiz.statistiques
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
};
