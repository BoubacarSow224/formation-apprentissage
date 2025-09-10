const OffreEmploi = require('../models/OffreEmploi');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Récupérer toutes les offres d'emploi
// @route   GET /api/offres-emploi
// @access  Public
exports.getOffresEmploi = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Récupérer une offre d'emploi spécifique
// @route   GET /api/offres-emploi/:id
// @access  Public
exports.getOffreEmploi = asyncHandler(async (req, res, next) => {
  const offre = await OffreEmploi.findById(req.params.id)
    .populate('entreprise', 'nom description logo')
    .populate('candidats.utilisateur', 'nom email photoProfil');

  if (!offre) {
    return next(
      new ErrorResponse(`Offre d'emploi non trouvée avec l'ID ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: offre
  });
});

// @desc    Créer une nouvelle offre d'emploi
// @route   POST /api/offres-emploi
// @access  Privé (Entreprise/Admin)
exports.createOffreEmploi = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur est une entreprise ou un admin
  if (req.user.role !== 'entreprise' && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `L'utilisateur avec le rôle ${req.user.role} n'est pas autorisé à créer une offre d'emploi`,
        403
      )
    );
  }

  // Si l'utilisateur est une entreprise, l'ajouter comme entreprise de l'offre
  if (req.user.role === 'entreprise') {
    req.body.entreprise = req.user.id;
  }

  // Si l'utilisateur est admin, vérifier que l'entreprise est spécifiée
  if (req.user.role === 'admin' && !req.body.entreprise) {
    return next(
      new ErrorResponse(
        'Veuillez spécifier une entreprise pour cette offre d\'emploi',
        400
      )
    );
  }

  const offre = await OffreEmploi.create(req.body);

  res.status(201).json({
    success: true,
    data: offre
  });
});

// @desc    Mettre à jour une offre d'emploi
// @route   PUT /api/offres-emploi/:id
// @access  Privé (Entreprise/Admin)
exports.updateOffreEmploi = asyncHandler(async (req, res, next) => {
  let offre = await OffreEmploi.findById(req.params.id);

  if (!offre) {
    return next(
      new ErrorResponse(`Offre d'emploi non trouvée avec l'ID ${req.params.id}`, 404)
    );
  }

  // Vérifier si l'utilisateur est le propriétaire de l'offre ou un admin
  if (offre.entreprise.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `L'utilisateur ${req.user.id} n'est pas autorisé à mettre à jour cette offre d'emploi`,
        401
      )
    );
  }

  // Mise à jour de l'offre
  offre = await OffreEmploi.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: offre
  });
});

// @desc    Supprimer une offre d'emploi
// @route   DELETE /api/offres-emploi/:id
// @access  Privé (Entreprise/Admin)
exports.deleteOffreEmploi = asyncHandler(async (req, res, next) => {
  const offre = await OffreEmploi.findById(req.params.id);

  if (!offre) {
    return next(
      new ErrorResponse(`Offre d'emploi non trouvée avec l'ID ${req.params.id}`, 404)
    );
  }

  // Vérifier si l'utilisateur est le propriétaire de l'offre ou un admin
  if (offre.entreprise.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `L'utilisateur ${req.user.id} n'est pas autorisé à supprimer cette offre d'emploi`,
        401
      )
    );
  }

  await offre.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Postuler à une offre d'emploi
// @route   POST /api/offres-emploi/:id/postuler
// @access  Privé (Apprenant/Formateur)
exports.postulerOffreEmploi = asyncHandler(async (req, res, next) => {
  // Vérifier si l'utilisateur peut postuler (apprenant ou formateur)
  if (req.user.role !== 'apprenant' && req.user.role !== 'formateur') {
    return next(
      new ErrorResponse(
        `Seuls les apprenants et les formateurs peuvent postuler à une offre d'emploi`,
        403
      )
    );
  }

  const offre = await OffreEmploi.findById(req.params.id);

  if (!offre) {
    return next(
      new ErrorResponse(`Offre d'emploi non trouvée avec l'ID ${req.params.id}`, 404)
    );
  }

  // Vérifier si l'offre est toujours ouverte
  if (offre.statut !== 'ouverte') {
    return next(
      new ErrorResponse(
        `Cette offre d'emploi n'est plus disponible pour les candidatures`,
        400
      )
    );
  }

  // Vérifier si l'utilisateur a déjà postulé
  const dejaPostule = offre.candidats.some(
    candidat => candidat.utilisateur.toString() === req.user.id
  );

  if (dejaPostule) {
    return next(
      new ErrorResponse(
        'Vous avez déjà postulé à cette offre d\'emploi',
        400
      )
    );
  }

  // Ajouter la candidature
  offre.candidats.push({
    utilisateur: req.user.id,
    dateCandidature: Date.now(),
    statut: 'en_attente'
  });

  await offre.save();

  res.status(200).json({
    success: true,
    data: offre.candidats
  });
});

// @desc    Mettre à jour le statut d'une candidature
// @route   PUT /api/offres-emploi/:id/candidatures/:candidatureId
// @access  Privé (Entreprise/Admin)
exports.mettreAJourCandidature = asyncHandler(async (req, res, next) => {
  const { statut, commentaire } = req.body;
  const { id, candidatureId } = req.params;

  const offre = await OffreEmploi.findById(id);

  if (!offre) {
    return next(
      new ErrorResponse(`Offre d'emploi non trouvée avec l'ID ${id}`, 404)
    );
  }

  // Vérifier si l'utilisateur est le propriétaire de l'offre ou un admin
  if (offre.entreprise.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `Vous n'êtes pas autorisé à modifier cette candidature`,
        401
      )
    );
  }

  // Trouver la candidature
  const candidature = offre.candidats.id(candidatureId);

  if (!candidature) {
    return next(
      new ErrorResponse(`Candidature non trouvée avec l'ID ${candidatureId}`, 404)
    );
  }

  // Mettre à jour le statut
  if (statut) {
    candidature.statut = statut;
  }
  
  if (commentaire) {
    candidature.commentaire = commentaire;
  }
  
  candidature.dateMiseAJour = Date.now();

  await offre.save();

  res.status(200).json({
    success: true,
    data: candidature
  });
});

// @desc    Récupérer les offres d'emploi d'une entreprise
// @route   GET /api/offres-emploi/entreprise/:entrepriseId
// @access  Public
exports.getOffresParEntreprise = asyncHandler(async (req, res, next) => {
  const offres = await OffreEmploi.find({
    entreprise: req.params.entrepriseId,
    statut: 'ouverte'
  }).sort('-dateCreation');

  res.status(200).json({
    success: true,
    count: offres.length,
    data: offres
  });
});
