const Cours = require('../models/Cours');
const Badge = require('../models/Badge');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Récupérer tous les cours
// @route   GET /api/cours
// @access  Public
exports.getTousLesCours = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Récupérer un seul cours
// @route   GET /api/cours/:id
// @access  Public
exports.getCours = asyncHandler(async (req, res, next) => {
  const cours = await Cours.findById(req.params.id)
    .populate('formateur', 'nom photoProfil')
    .populate('badge');

  if (!cours) {
    return next(
      new ErrorResponse(`Cours non trouvé avec l'ID ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: cours
  });
});

// @desc    Créer un cours
// @route   POST /api/cours
// @access  Privé (Formateur/Admin)
exports.createCours = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est un formateur ou un admin
  if (req.user.role !== 'formateur' && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `L'utilisateur avec le rôle ${req.user.role} n'est pas autorisé à créer un cours`,
        403
      )
    );
  }

  // Ajouter l'utilisateur comme formateur
  req.body.formateur = req.user.id;

  // Si l'utilisateur est admin, le cours est automatiquement approuvé
  if (req.user.role === 'admin') {
    req.body.estApprouve = true;
  }

  const cours = await Cours.create(req.body);

  // Mettre à jour la liste des cours créés par le formateur
  await User.findByIdAndUpdate(
    req.user.id,
    { $addToSet: { coursCrees: cours._id } },
    { new: true, runValidators: true }
  );

  res.status(201).json({
    success: true,
    data: cours
  });
});

// @desc    Mettre à jour un cours
// @route   PUT /api/cours/:id
// @access  Privé (Formateur/Admin)
exports.updateCours = asyncHandler(async (req, res, next) => {
  let cours = await Cours.findById(req.params.id);

  if (!cours) {
    return next(
      new ErrorResponse(`Cours non trouvé avec l'ID ${req.params.id}`, 404)
    );
  }

  // Vérifier si l'utilisateur est le propriétaire du cours ou un admin
  if (cours.formateur.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `L'utilisateur ${req.user.id} n'est pas autorisé à mettre à jour ce cours`,
        401
      )
    );
  }

  // Si le cours est approuvé, seul un admin peut le modifier
  if (cours.estApprouve && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        'Seul un administrateur peut modifier un cours approuvé',
        401
      )
    );
  }

  cours = await Cours.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: cours
  });
});

// @desc    Supprimer un cours
// @route   DELETE /api/cours/:id
// @access  Privé (Formateur/Admin)
exports.deleteCours = asyncHandler(async (req, res, next) => {
  const cours = await Cours.findById(req.params.id);

  if (!cours) {
    return next(
      new ErrorResponse(`Cours non trouvé avec l'ID ${req.params.id}`, 404)
    );
  }

  // Vérifier si l'utilisateur est le propriétaire du cours ou un admin
  if (cours.formateur.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `L'utilisateur ${req.user.id} n'est pas autorisé à supprimer ce cours`,
        401
      )
    );
  }

  await cours.remove();

  // Retirer le cours de la liste des cours créés par le formateur
  await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { coursCrees: cours._id } },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    S'inscrire à un cours
// @route   POST /api/cours/:id/inscription
// @access  Privé (Apprenant)
exports.inscriptionCours = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est un apprenant
  if (req.user.role !== 'apprenant') {
    return next(
      new ErrorResponse(
        `Seuls les apprenants peuvent s'inscrire à un cours`,
        403
      )
    );
  }

  const cours = await Cours.findById(req.params.id);

  if (!cours) {
    return next(
      new ErrorResponse(`Cours non trouvé avec l'ID ${req.params.id}`, 404)
    );
  }

  // Vérifier si le cours est approuvé
  if (!cours.estApprouve) {
    return next(
      new ErrorResponse(
        'Impossible de s\'inscrire à un cours non approuvé',
        400
      )
    );
  }

  // Vérifier si l'utilisateur est déjà inscrit
  const dejaInscrit = await User.findOne({
    _id: req.user.id,
    'coursSuivis.cours': req.params.id
  });

  if (dejaInscrit) {
    return next(
      new ErrorResponse('Vous êtes déjà inscrit à ce cours', 400)
    );
  }

  // Ajouter l'utilisateur aux participants du cours
  await User.findByIdAndUpdate(
    req.user.id,
    {
      $addToSet: {
        coursSuivis: {
          cours: req.params.id,
          progression: 0,
          termine: false
        }
      }
    },
    { new: true, runValidators: true }
  );

  // Incrémenter le nombre de participants du cours
  await Cours.findByIdAndUpdate(
    req.params.id,
    { $inc: { nombreParticipants: 1 } },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Inscription au cours réussie'
  });
});

// @desc    Mettre à jour la progression d'un cours
// @route   PUT /api/cours/:id/progression
// @access  Privé (Apprenant)
exports.mettreAJourProgression = asyncHandler(async (req, res, next) => {
  const { etapeTerminee } = req.body;
  const coursId = req.params.id;
  const userId = req.user.id;

  // Vérifier si l'utilisateur est inscrit au cours
  const utilisateur = await User.findOne({
    _id: userId,
    'coursSuivis.cours': coursId
  });

  if (!utilisateur) {
    return next(
      new ErrorResponse("Vous n'êtes pas inscrit à ce cours", 400)
    );
  }

  // Mettre à jour la progression
  const coursSuivi = utilisateur.coursSuivis.find(
    cs => cs.cours.toString() === coursId
  );

  // Logique pour mettre à jour la progression en fonction de l'étape terminée
  // À adapter selon votre structure de données

  await utilisateur.save();

  res.status(200).json({
    success: true,
    data: coursSuivi
  });
});

// @desc    Obtenir les cours d'un formateur
// @route   GET /api/cours/formateur/:id
// @access  Public
exports.getCoursParFormateur = asyncHandler(async (req, res, next) => {
  const formateurId = req.params.id;
  
  // Vérifier si le formateur existe
  const formateur = await User.findById(formateurId);
  
  if (!formateur) {
    return next(
      new ErrorResponse(`Utilisateur non trouvé avec l'ID ${formateurId}`, 404)
    );
  }

  const cours = await Cours.find({ formateur: formateurId, estApprouve: true })
    .sort('-dateCreation')
    .populate('badge', 'nom image');

  res.status(200).json({
    success: true,
    count: cours.length,
    data: cours
  });
});

// @desc    Obtenir les statistiques d'un formateur
// @route   GET /api/cours/formateur/stats
// @access  Privé (Formateur)
exports.getStatistiquesFormateur = asyncHandler(async (req, res, next) => {
  const formateurId = req.user.id;
  
  // Vérifier si l'utilisateur est un formateur
  if (req.user.role !== 'formateur' && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Accès refusé', 403)
    );
  }

  // Obtenir tous les cours du formateur
  const cours = await Cours.find({ formateur: formateurId });
  
  // Calculer les statistiques
  const stats = {
    coursCreated: cours.length,
    totalStudents: 0,
    averageRating: 0,
    totalRevenue: 0,
    coursPublies: cours.filter(c => c.estApprouve && c.estPublic).length,
    coursEnAttente: cours.filter(c => !c.estApprouve).length
  };

  // Calculer le nombre total d'étudiants et la note moyenne
  if (cours.length > 0) {
    const totalRatings = cours.reduce((sum, c) => sum + (c.noteMoyenne || 0), 0);
    const totalStudents = await User.countDocuments({
      'coursSuivis.cours': { $in: cours.map(c => c._id) }
    });
    
    stats.totalStudents = totalStudents;
    stats.averageRating = Math.round((totalRatings / cours.length) * 10) / 10;
    stats.totalRevenue = Math.floor(Math.random() * 5000) + 1000; // Simulation
  }

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Obtenir les cours récents d'un formateur
// @route   GET /api/cours/formateur/recents
// @access  Privé (Formateur)
exports.getCoursRecentsFormateur = asyncHandler(async (req, res, next) => {
  const formateurId = req.user.id;
  
  if (req.user.role !== 'formateur' && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Accès refusé', 403)
    );
  }

  const cours = await Cours.find({ formateur: formateurId })
    .sort('-createdAt')
    .limit(5)
    .select('titre nombreVues noteMoyenne nombreAvis statutModeration estApprouve estPublic createdAt');

  // Calculer le nombre d'étudiants pour chaque cours
  const coursAvecStats = await Promise.all(
    cours.map(async (c) => {
      const nombreEtudiants = await User.countDocuments({
        'coursSuivis.cours': c._id
      });
      
      return {
        _id: c._id,
        titre: c.titre,
        students: nombreEtudiants,
        status: c.estApprouve ? 'Publié' : c.statutModeration === 'en_attente' ? 'En attente' : 'En cours',
        rating: c.noteMoyenne || 0,
        createdAt: c.createdAt
      };
    })
  );

  res.status(200).json({
    success: true,
    data: coursAvecStats
  });
});

// @desc    Obtenir les étudiants récents d'un formateur
// @route   GET /api/cours/formateur/etudiants-recents
// @access  Privé (Formateur)
exports.getEtudiantsRecentsFormateur = asyncHandler(async (req, res, next) => {
  const formateurId = req.user.id;
  
  if (req.user.role !== 'formateur' && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Accès refusé', 403)
    );
  }

  // Obtenir les cours du formateur
  const cours = await Cours.find({ formateur: formateurId }).select('_id titre');
  const coursIds = cours.map(c => c._id);

  // Obtenir les étudiants inscrits aux cours du formateur
  const etudiants = await User.find({
    'coursSuivis.cours': { $in: coursIds },
    role: 'apprenant'
  })
  .select('nom coursSuivis')
  .sort('-coursSuivis.dateInscription')
  .limit(10);

  const etudiantsAvecProgression = etudiants.map(etudiant => {
    const coursSuivi = etudiant.coursSuivis.find(cs => 
      coursIds.some(id => id.toString() === cs.cours.toString())
    );
    
    const coursInfo = cours.find(c => c._id.toString() === coursSuivi?.cours.toString());
    
    return {
      id: etudiant._id,
      name: etudiant.nom,
      course: coursInfo?.titre || 'Cours inconnu',
      progress: coursSuivi?.progression || 0
    };
  }).slice(0, 5);

  res.status(200).json({
    success: true,
    data: etudiantsAvecProgression
  });
});

// @desc    Approuver un cours (Admin)
// @route   PUT /api/cours/:id/approuver
// @access  Privé (Admin)
exports.approuverCours = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est un admin
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `Seul un administrateur peut approuver un cours`,
        403
      )
    );
  }

  const cours = await Cours.findByIdAndUpdate(
    req.params.id,
    { estApprouve: true },
    {
      new: true,
      runValidators: true
    }
  );

  if (!cours) {
    return next(
      new ErrorResponse(`Cours non trouvé avec l'ID ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: cours
  });
});
