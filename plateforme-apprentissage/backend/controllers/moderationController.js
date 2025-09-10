const Cours = require('../models/Cours');
const User = require('../models/User');

// Obtenir tous les cours en attente de modération
exports.getCoursEnAttente = async (req, res) => {
  try {
    const cours = await Cours.find({ 
      statutModeration: 'en_attente' 
    })
    .populate('formateur', 'nom email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: cours.length,
      data: cours
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des cours en attente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des cours en attente',
      error: error.message
    });
  }
};

// Approuver un cours
exports.approuverCours = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;

    const cours = await Cours.findByIdAndUpdate(
      id,
      {
        statutModeration: 'approuve',
        estApprouve: true,
        estPublic: true,
        commentaireModeration: commentaire,
        moderePar: req.user.id,
        dateModeration: new Date()
      },
      { new: true }
    ).populate('formateur', 'nom email');

    if (!cours) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Cours approuvé avec succès',
      data: cours
    });
  } catch (error) {
    console.error('Erreur lors de l\'approbation du cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation du cours',
      error: error.message
    });
  }
};

// Rejeter un cours
exports.rejeterCours = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;

    if (!commentaire) {
      return res.status(400).json({
        success: false,
        message: 'Un commentaire est requis pour rejeter un cours'
      });
    }

    const cours = await Cours.findByIdAndUpdate(
      id,
      {
        statutModeration: 'rejete',
        estApprouve: false,
        estPublic: false,
        commentaireModeration: commentaire,
        moderePar: req.user.id,
        dateModeration: new Date()
      },
      { new: true }
    ).populate('formateur', 'nom email');

    if (!cours) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Cours rejeté avec succès',
      data: cours
    });
  } catch (error) {
    console.error('Erreur lors du rejet du cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet du cours',
      error: error.message
    });
  }
};

// Suspendre un cours
exports.suspendreCours = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;

    const cours = await Cours.findByIdAndUpdate(
      id,
      {
        statutModeration: 'suspendu',
        estApprouve: false,
        estPublic: false,
        commentaireModeration: commentaire,
        moderePar: req.user.id,
        dateModeration: new Date()
      },
      { new: true }
    ).populate('formateur', 'nom email');

    if (!cours) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Cours suspendu avec succès',
      data: cours
    });
  } catch (error) {
    console.error('Erreur lors de la suspension du cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suspension du cours',
      error: error.message
    });
  }
};

// Supprimer définitivement un cours
exports.supprimerCours = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;

    const cours = await Cours.findById(id);
    if (!cours) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }

    // Enregistrer l'action de suppression dans les logs
    console.log(`Cours supprimé par admin ${req.user.id}: ${cours.titre} - Raison: ${commentaire}`);

    await Cours.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Cours supprimé définitivement'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du cours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du cours',
      error: error.message
    });
  }
};

// Obtenir l'historique de modération
exports.getHistoriqueModeration = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut } = req.query;
    
    const filter = {};
    if (statut && statut !== 'tous') {
      filter.statutModeration = statut;
    }

    const cours = await Cours.find(filter)
      .populate('formateur', 'nom email')
      .populate('moderePar', 'nom email')
      .sort({ dateModeration: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Cours.countDocuments(filter);

    res.json({
      success: true,
      data: cours,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
};

// Obtenir les statistiques de modération
exports.getStatistiquesModeration = async (req, res) => {
  try {
    const stats = await Cours.aggregate([
      {
        $group: {
          _id: '$statutModeration',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsFormatees = {
      en_attente: 0,
      approuve: 0,
      rejete: 0,
      suspendu: 0
    };

    stats.forEach(stat => {
      if (statsFormatees.hasOwnProperty(stat._id)) {
        statsFormatees[stat._id] = stat.count;
      }
    });

    const total = Object.values(statsFormatees).reduce((sum, count) => sum + count, 0);

    res.json({
      success: true,
      data: {
        ...statsFormatees,
        total
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};
