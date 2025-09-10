const Badge = require('../models/Badge');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Récupérer tous les badges
// @route   GET /api/badges
// @access  Public
exports.getBadges = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Récupérer un badge spécifique
// @route   GET /api/badges/:id
// @access  Public
exports.getBadge = asyncHandler(async (req, res, next) => {
  const badge = await Badge.findById(req.params.id);

  if (!badge) {
    return next(
      new ErrorResponse(`Badge non trouvé avec l'ID ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: badge
  });
});

// @desc    Créer un nouveau badge
// @route   POST /api/badges
// @access  Privé (Admin)
exports.createBadge = asyncHandler(async (req, res, next) => {
  // Ajouter l'utilisateur comme créateur
  req.body.createur = req.user.id;

  const badge = await Badge.create(req.body);

  res.status(201).json({
    success: true,
    data: badge
  });
});

// @desc    Mettre à jour un badge
// @route   PUT /api/badges/:id
// @access  Privé (Admin)
exports.updateBadge = asyncHandler(async (req, res, next) => {
  let badge = await Badge.findById(req.params.id);

  if (!badge) {
    return next(
      new ErrorResponse(`Badge non trouvé avec l'ID ${req.params.id}`, 404)
    );
  }

  badge = await Badge.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: badge
  });
});

// @desc    Supprimer un badge
// @route   DELETE /api/badges/:id
// @access  Privé (Admin)
exports.deleteBadge = asyncHandler(async (req, res, next) => {
  const badge = await Badge.findById(req.params.id);

  if (!badge) {
    return next(
      new ErrorResponse(`Badge non trouvé avec l'ID ${req.params.id}`, 404)
    );
  }

  await badge.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Attribuer un badge à un utilisateur
// @route   POST /api/badges/:id/attribuer
// @access  Privé (Admin/Formateur)
exports.attribuerBadge = asyncHandler(async (req, res, next) => {
  const badge = await Badge.findById(req.params.id);
  const { userId, raison } = req.body;

  if (!badge) {
    return next(
      new ErrorResponse(`Badge non trouvé avec l'ID ${req.params.id}`, 404)
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new ErrorResponse(`Utilisateur non trouvé avec l'ID ${userId}`, 404)
    );
  }

  // Vérifier si l'utilisateur a déjà ce badge
  const badgeDejaAttribue = user.badgesObtenus.some(
    b => b.badge.toString() === req.params.id
  );

  if (badgeDejaAttribue) {
    return next(
      new ErrorResponse(
        "L'utilisateur possède déjà ce badge",
        400
      )
    );
  }

  // Ajouter le badge à l'utilisateur
  user.badgesObtenus.push({
    badge: badge._id,
    dateObtention: Date.now(),
    attribuePar: req.user.id,
    raison: raison || ''
  });

  await user.save();

  res.status(200).json({
    success: true,
    data: user.badges
  });
});

// @desc    Récupérer les utilisateurs ayant un badge spécifique
// @route   GET /api/badges/:id/utilisateurs
// @access  Public
exports.getUtilisateursAvecBadge = asyncHandler(async (req, res, next) => {
  const users = await User.find(
    { 'badgesObtenus.badge': req.params.id },
    'nom email photoProfil badgesObtenus.$.dateObtention badgesObtenus.$.raison'
  );

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Vérifier si un utilisateur a un badge spécifique
// @route   GET /api/badges/verifier/:userId/:badgeId
// @access  Public
exports.verifierBadgeUtilisateur = asyncHandler(async (req, res, next) => {
  const { userId, badgeId } = req.params;

  const user = await User.findOne(
    {
      _id: userId,
      'badgesObtenus.badge': badgeId
    },
    'nom email'
  );

  res.status(200).json({
    success: true,
    possedeBadge: !!user,
    data: user
  });
});
