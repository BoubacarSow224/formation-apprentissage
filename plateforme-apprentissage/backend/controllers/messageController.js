const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { uploadFile, deleteFile } = require('../utils/fileUpload');

// @desc    Envoyer un message
// @route   POST /api/messages
// @access  Privé
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { conversationId, content, recipientId } = req.body;
  let fichier = null;

  // Vérifier que l'utilisateur a fourni du contenu ou un fichier
  if ((!content || content.trim() === '') && !req.files?.fichier) {
    return next(new ErrorResponse('Veuillez fournir un message ou un fichier', 400));
  }

  // Vérifier qu'une conversation ou un destinataire est spécifié
  if (!conversationId && !recipientId) {
    return next(
      new ErrorResponse(
        'Veuillez spécifier une conversation ou un destinataire',
        400
      )
    );
  }

  let conversation = null;
  
  // Si un ID de conversation est fourni, la récupérer
  if (conversationId) {
    conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return next(
        new ErrorResponse(
          `Conversation non trouvée avec l'ID ${conversationId}`,
          404
        )
      );
    }
  } else {
    // Sinon, créer ou récupérer une conversation avec le destinataire
    const participants = [req.user.id, recipientId];
    
    // Vérifier si une conversation existe déjà entre ces participants
    conversation = await Conversation.findOne({
      participants: { $all: participants, $size: participants.length }
    });

    // Si aucune conversation n'existe, en créer une nouvelle
    if (!conversation) {
      // Vérifier que le destinataire existe
      const recipient = await User.findById(recipientId).select('_id');
      if (!recipient) {
        return next(
          new ErrorResponse(
            `Destinataire non trouvé avec l'ID ${recipientId}`,
            404
          )
        );
      }

      conversation = await Conversation.create({
        participants,
        createdBy: req.user.id
      });
    }
  }

  // Gérer l'upload de fichier si présent
  if (req.files?.fichier) {
    try {
      fichier = await uploadFile(
        req.files.fichier,
        process.env.FILE_UPLOAD_PATH || 'uploads/messages',
        ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      );
    } catch (err) {
      return next(new ErrorResponse(`Erreur lors de l'upload du fichier: ${err.message}`, 500));
    }
  }

  // Créer le message
  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user.id,
    recipients: conversation.participants.filter(id => id.toString() !== req.user.id),
    content: content || '',
    fichier: fichier ? {
      nom: fichier.name,
      chemin: fichier.path,
      type: fichier.mimetype,
      taille: fichier.size
    } : undefined
  });

  // Mettre à jour la conversation avec le dernier message
  conversation.lastMessage = message._id;
  conversation.updatedAt = Date.now();
  
  // Incrémenter le compteur de messages non lus pour les autres participants
  conversation.participants.forEach(participantId => {
    if (participantId.toString() !== req.user.id) {
      conversation.etat.set(participantId.toString(), {
        estArchive: conversation.etat.get(participantId.toString())?.estArchive || false,
        estSupprime: conversation.etat.get(participantId.toString())?.estSupprime || false,
        estFavori: conversation.etat.get(participantId.toString())?.estFavori || false,
        nonLu: (conversation.etat.get(participantId.toString())?.nonLu || 0) + 1
      });
    }
  });

  await conversation.save();

  // Populer les données de l'expéditeur et des destinataires
  const messagePopule = await Message.findById(message._id)
    .populate('sender', 'nom prenom photoProfil')
    .populate('recipients', 'nom prenom photoProfil');

  res.status(201).json({
    success: true,
    data: messagePopule
  });
});

// @desc    Récupérer les messages d'une conversation
// @route   GET /api/messages/conversation/:conversationId
// @access  Privé
exports.getMessages = asyncHandler(async (req, res, next) => {
  // Vérifier que l'utilisateur fait partie de la conversation
  const conversation = await Conversation.findOne({
    _id: req.params.conversationId,
    participants: req.user.id
  });

  if (!conversation) {
    return next(
      new ErrorResponse(
        `Conversation non trouvée avec l'ID ${req.params.conversationId}`,
        404
      )
    );
  }

  // Construire la requête de recherche
  const query = {
    conversation: req.params.conversationId
  };

  // Si l'utilisateur a supprimé la conversation, ne pas afficher les anciens messages
  if (conversation.etat?.get(req.user.id)?.estSupprime) {
    query.createdAt = { $gte: conversation.etat.get(req.user.id).dateSuppression || new Date() };
  }

  const messages = await Message.find(query)
    .populate('sender', 'nom prenom photoProfil')
    .populate('recipients', 'nom prenom photoProfil')
    .sort('-createdAt')
    .limit(50); // Limiter à 50 messages par requête pour des raisons de performance

  // Marquer les messages comme lus
  await Message.updateMany(
    {
      _id: { $in: messages.filter(m => !m.lu && m.sender._id.toString() !== req.user.id).map(m => m._id) }
    },
    { $set: { lu: true, dateLecture: Date.now() } }
  );

  // Réinitialiser le compteur de messages non lus
  if (conversation.etat?.get(req.user.id)?.nonLu > 0) {
    conversation.etat.set(req.user.id, {
      ...conversation.etat.get(req.user.id),
      nonLu: 0
    });
    await conversation.save();
  }

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages.reverse() // Inverser pour avoir les plus anciens en premier
  });
});

// @desc    Marquer un message comme lu
// @route   PUT /api/messages/:id/read
// @access  Privé
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const message = await Message.findOneAndUpdate(
    {
      _id: req.params.id,
      recipients: req.user.id,
      lu: false
    },
    {
      $set: { lu: true, dateLecture: Date.now() }
    },
    { new: true }
  );

  if (!message) {
    return next(
      new ErrorResponse(
        `Message non trouvé avec l'ID ${req.params.id} ou déjà marqué comme lu`,
        404
      )
    );
  }

  // Mettre à jour le compteur de messages non lus dans la conversation
  await Conversation.updateOne(
    {
      _id: message.conversation,
      'etat.userId': req.user.id
    },
    {
      $inc: { 'etat.$.nonLu': -1 }
    }
  );

  res.status(200).json({
    success: true,
    data: message
  });
});

// @desc    Supprimer un message
// @route   DELETE /api/messages/:id
// @access  Privé
exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findOne({
    _id: req.params.id,
    $or: [
      { sender: req.user.id },
      { recipients: req.user.id }
    ]
  });

  if (!message) {
    return next(
      new ErrorResponse(
        `Message non trouvé avec l'ID ${req.params.id}`,
        404
      )
    );
  }

  // Si l'utilisateur est l'expéditeur, supprimer pour tout le monde
  if (message.sender.toString() === req.user.id) {
    // Supprimer le fichier associé s'il existe
    if (message.fichier?.chemin) {
      await deleteFile(message.fichier.chemin);
    }
    await message.remove();
  } else {
    // Sinon, simplement retirer l'utilisateur des destinataires
    message.recipients = message.recipients.filter(
      recipient => recipient.toString() !== req.user.id
    );
    
    // S'il ne reste plus de destinataires, supprimer le message
    if (message.recipients.length === 0) {
      if (message.fichier?.chemin) {
        await deleteFile(message.fichier.chemin);
      }
      await message.remove();
    } else {
      await message.save();
    }
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Rechercher des messages
// @route   GET /api/messages/search?q=query
// @access  Privé
exports.searchMessages = asyncHandler(async (req, res, next) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return next(new ErrorResponse('Veuillez fournir un terme de recherche d\'au moins 2 caractères', 400));
  }

  // Trouver les conversations de l'utilisateur
  const conversations = await Conversation.find({
    participants: req.user.id,
    'etat.userId': {
      $ne: { $elemMatch: { userId: req.user.id, estSupprime: true } }
    }
  }).select('_id');

  const conversationIds = conversations.map(c => c._id);

  // Rechercher les messages correspondants
  const messages = await Message.find({
    conversation: { $in: conversationIds },
    $or: [
      { content: { $regex: q, $options: 'i' } },
      { 'fichier.nom': { $regex: q, $options: 'i' } }
    ]
  })
    .populate('sender', 'nom prenom photoProfil')
    .populate('recipients', 'nom prenom photoProfil')
    .sort('-createdAt')
    .limit(50);

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});
