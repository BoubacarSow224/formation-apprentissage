const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Créer ou récupérer une conversation
// @route   POST /api/conversations
// @access  Privé
exports.createOrGetConversation = asyncHandler(async (req, res, next) => {
  const { participants } = req.body;

  // Vérifier que l'utilisateur actuel fait partie des participants
  if (!participants.includes(req.user.id)) {
    participants.push(req.user.id);
  }

  // Vérifier qu'il y a au moins 2 participants
  if (participants.length < 2) {
    return next(
      new ErrorResponse('Une conversation doit avoir au moins 2 participants', 400)
    );
  }

  // Vérifier si une conversation existe déjà entre ces participants
  let conversation = await Conversation.findOne({
    participants: { $all: participants, $size: participants.length }
  })
    .populate('participants', 'nom prenom photoProfil role')
    .populate('lastMessage');

  // Si aucune conversation n'existe, en créer une nouvelle
  if (!conversation) {
    // Vérifier que tous les participants existent
    const existingUsers = await User.find({
      _id: { $in: participants }
    }).select('_id');

    if (existingUsers.length !== participants.length) {
      return next(new ErrorResponse('Un ou plusieurs utilisateurs sont introuvables', 404));
    }

    // Créer une nouvelle conversation
    conversation = await Conversation.create({
      participants,
      createdBy: req.user.id
    });

    // Récupérer les détails complets des participants
    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'nom prenom photoProfil role')
      .populate('lastMessage');
  }

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Récupérer les conversations d'un utilisateur
// @route   GET /api/conversations
// @access  Privé
exports.getUserConversations = asyncHandler(async (req, res, next) => {
  const conversations = await Conversation.find({
    participants: req.user.id
  })
    .populate('participants', 'nom prenom photoProfil role')
    .populate('lastMessage')
    .sort('-updatedAt');

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations
  });
});

// @desc    Récupérer une conversation spécifique
// @route   GET /api/conversations/:id
// @access  Privé
exports.getConversation = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user.id
  })
    .populate('participants', 'nom prenom photoProfil role')
    .populate('lastMessage');

  if (!conversation) {
    return next(
      new ErrorResponse(
        `Conversation non trouvée avec l'ID ${req.params.id}`,
        404
      )
    );
  }

  // Marquer les messages comme lus
  await Message.updateMany(
    {
      conversation: conversation._id,
      recipient: req.user.id,
      lu: false
    },
    { $set: { lu: true, dateLecture: Date.now() } }
  );

  // Mettre à jour le nombre de messages non lus dans la conversation
  conversation.nonLu = 0;
  await conversation.save();

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Mettre à jour une conversation
// @route   PUT /api/conversations/:id
// @access  Privé
exports.updateConversation = asyncHandler(async (req, res, next) => {
  const { estArchive, estSupprime, estFavori } = req.body;
  const updateFields = {};

  if (typeof estArchive === 'boolean') {
    updateFields[`etat.${req.user.id}.estArchive`] = estArchive;
  }
  
  if (typeof estSupprime === 'boolean') {
    updateFields[`etat.${req.user.id}.estSupprime`] = estSupprime;
  }
  
  if (typeof estFavori === 'boolean') {
    updateFields[`etat.${req.user.id}.estFavori`] = estFavori;
  }

  const conversation = await Conversation.findOneAndUpdate(
    {
      _id: req.params.id,
      participants: req.user.id
    },
    { $set: updateFields },
    { new: true, runValidators: true }
  )
    .populate('participants', 'nom prenom photoProfil role')
    .populate('lastMessage');

  if (!conversation) {
    return next(
      new ErrorResponse(
        `Conversation non trouvée avec l'ID ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Supprimer une conversation
// @route   DELETE /api/conversations/:id
// @access  Privé
exports.deleteConversation = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user.id
  });

  if (!conversation) {
    return next(
      new ErrorResponse(
        `Conversation non trouvée avec l'ID ${req.params.id}`,
        404
      )
    );
  }

  // Marquer la conversation comme supprimée pour l'utilisateur actuel
  conversation.etat.set(req.user.id, { estSupprime: true });
  await conversation.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Rechercher des utilisateurs pour démarrer une conversation
// @route   GET /api/conversations/search-users?q=query
// @access  Privé
exports.searchUsers = asyncHandler(async (req, res, next) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return next(new ErrorResponse('Veuillez fournir un terme de recherche d\'au moins 2 caractères', 400));
  }

  const users = await User.find({
    $and: [
      { _id: { $ne: req.user.id } }, // Exclure l'utilisateur actuel
      {
        $or: [
          { nom: { $regex: q, $options: 'i' } },
          { prenom: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      }
    ]
  }).select('nom prenom email photoProfil role');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});
