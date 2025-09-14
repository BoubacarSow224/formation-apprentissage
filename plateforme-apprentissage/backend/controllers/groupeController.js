const Groupe = require('../models/Groupe');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Créer un groupe (formateur)
// @route   POST /api/groupes
// @access  Privé (formateur)
exports.createGroupe = asyncHandler(async (req, res, next) => {
  const { nom, description, cours } = req.body;
  const formateur = req.user.id;

  if (!nom || !nom.trim()) {
    return next(new ErrorResponse('Le nom du groupe est requis', 400));
  }

  const groupe = await Groupe.create({
    nom: nom.trim(),
    description: (description || '').trim(),
    formateur,
    cours: cours || undefined,
    membres: [],
    invitations: [],
  });

  res.status(201).json({ success: true, data: groupe });
});

// @desc    Lister mes groupes (formateur ou membre)
// @route   GET /api/groupes/mes-groupes
// @access  Privé
exports.getMesGroupes = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const groupes = await Groupe.find({
    $or: [
      { formateur: userId },
      { membres: userId },
    ],
  })
    .populate('formateur', 'nom email')
    .populate('membres', 'nom email');

  res.status(200).json({ success: true, count: groupes.length, data: groupes });
});

// @desc    Détail d'un groupe (membres seulement)
// @route   GET /api/groupes/:id
// @access  Privé (membre/formateur)
exports.getGroupe = asyncHandler(async (req, res, next) => {
  const groupe = await Groupe.findById(req.params.id)
    .populate('formateur', 'nom email')
    .populate('membres', 'nom email');
  if (!groupe) return next(new ErrorResponse('Groupe introuvable', 404));

  const userId = req.user.id;
  const isMember =
    groupe.formateur.toString() === userId ||
    groupe.membres.some((m) => m._id?.toString?.() === userId || m.toString?.() === userId);
  if (!isMember) return next(new ErrorResponse('Accès réservé aux membres du groupe', 403));

  res.status(200).json({ success: true, data: groupe });
});

// @desc    Inviter un apprenant dans un groupe (formateur)
// @route   POST /api/groupes/:id/invitations
// @access  Privé (formateur)
exports.inviterApprenant = asyncHandler(async (req, res, next) => {
  const { apprenantEmail } = req.body;
  const groupe = await Groupe.findById(req.params.id);
  if (!groupe) return next(new ErrorResponse('Groupe introuvable', 404));
  if (groupe.formateur.toString() !== req.user.id)
    return next(new ErrorResponse('Seul le formateur peut inviter', 403));

  const apprenant = await User.findOne({ email: (apprenantEmail || '').trim().toLowerCase() });
  if (!apprenant) return next(new ErrorResponse('Apprenant introuvable', 404));
  // Optionnel: n'autoriser que le rôle apprenant
  if (apprenant.role && apprenant.role !== 'apprenant') {
    return next(new ErrorResponse('Seuls les utilisateurs avec le rôle apprenant peuvent être invités dans un groupe', 400));
  }

  // déjà membre
  if (groupe.membres.some((m) => m.toString() === apprenant._id.toString())) {
    return res.status(200).json({ success: true, message: 'Cet apprenant est déjà membre du groupe' });
  }

  // Invitation existante en attente
  const exist = groupe.invitations.find(
    (i) => i.apprenant.toString() === apprenant._id.toString() && i.statut === 'en_attente'
  );
  if (exist) {
    return res.status(200).json({ success: true, message: 'Invitation déjà envoyée et en attente', invitationId: exist._id });
  }

  groupe.invitations.push({ apprenant: apprenant._id, statut: 'en_attente' });
  await groupe.save();

  res.status(201).json({ success: true, message: 'Invitation envoyée' });
});

// @desc    Lister les invitations d'un groupe (formateur)
// @route   GET /api/groupes/:id/invitations
// @access  Privé (formateur)
exports.listerInvitations = asyncHandler(async (req, res, next) => {
  const groupe = await Groupe.findById(req.params.id).populate('invitations.apprenant', 'nom email');
  if (!groupe) return next(new ErrorResponse('Groupe introuvable', 404));
  if (groupe.formateur.toString() !== req.user.id)
    return next(new ErrorResponse('Accès refusé', 403));

  res.status(200).json({ success: true, data: groupe.invitations || [] });
});

// @desc    Répondre à une invitation (apprenant)
// @route   POST /api/groupes/:id/invitations/:invId/accept
// @route   POST /api/groupes/:id/invitations/:invId/refuse
// @access  Privé (apprenant)
exports.repondreInvitation = asyncHandler(async (req, res, next) => {
  const { action } = req.body; // 'accepte' | 'refuse'
  if (!['accepte', 'refuse'].includes(action))
    return next(new ErrorResponse('Action invalide', 400));

  const groupe = await Groupe.findById(req.params.id);
  if (!groupe) return next(new ErrorResponse('Groupe introuvable', 404));

  const invitation = groupe.invitations.id(req.params.invId);
  if (!invitation) return next(new ErrorResponse('Invitation introuvable', 404));
  if (invitation.apprenant.toString() !== req.user.id)
    return next(new ErrorResponse('Vous ne pouvez répondre qu’à vos invitations', 403));
  if (invitation.statut !== 'en_attente')
    return next(new ErrorResponse('Invitation déjà traitée', 400));

  invitation.statut = action;

  if (action === 'accepte') {
    // Ajouter l’apprenant en membre si pas déjà
    if (!groupe.membres.some((m) => m.toString() === req.user.id)) {
      groupe.membres.push(req.user.id);
    }
  }

  await groupe.save();
  res.status(200).json({ success: true, message: `Invitation ${action}e` });
});

// @desc    Lister les invitations en attente pour l'utilisateur courant
// @route   GET /api/groupes/mes-invitations
// @access  Privé
exports.getMesInvitations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const groupes = await Groupe.find({ 'invitations.apprenant': userId })
    .select('nom description formateur invitations')
    .populate('formateur', 'nom email')
    .populate('invitations.apprenant', 'nom email');

  const pending = [];
  for (const g of groupes) {
    (g.invitations || []).forEach((inv) => {
      if (inv.apprenant && inv.apprenant._id?.toString?.() === userId && inv.statut === 'en_attente') {
        pending.push({
          groupeId: g._id,
          groupeNom: g.nom,
          formateur: g.formateur,
          invitationId: inv._id,
          statut: inv.statut,
          date: inv.date,
          apprenant: inv.apprenant,
        });
      }
    });
  }

  res.status(200).json({ success: true, count: pending.length, data: pending });
});
