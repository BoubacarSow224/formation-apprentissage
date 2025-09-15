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

// @desc    Rechercher les candidats d'une offre filtrés par badge requis (présenté)
// @route   GET /api/offres-emploi/:id/candidatures
// @access  Privé (Entreprise/Admin)
exports.rechercherCandidatsParBadgeDansOffre = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { badgeId } = req.query;

  const offre = await OffreEmploi.findById(id).populate('candidats.utilisateur', 'nom email photoProfil').lean();
  if (!offre) {
    return next(new ErrorResponse(`Offre d'emploi non trouvée avec l'ID ${id}`, 404));
  }
  // Autorisation: propriétaire entreprise ou admin
  if (String(offre.entreprise) !== String(req.user.id) && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Vous n'êtes pas autorisé à consulter ces candidatures`, 401));
  }

  let candidats = offre.candidats || [];
  if (badgeId) {
    const bid = String(badgeId);
    candidats = candidats.filter(c => (c.badgesPresentes || []).some(b => String(b) === bid));
  }

  const data = candidats.map(c => ({
    candidatureId: c._id,
    utilisateur: c.utilisateur,
    statut: c.statut,
    dateCandidature: c.dateCandidature,
    badgesPresentes: c.badgesPresentes || [],
    offreId: offre._id
  }));

  return res.status(200).json({ success: true, count: data.length, data });
});

// @desc    Rechercher tous les candidats aux offres d'une entreprise filtrés par badge
// @route   GET /api/offres-emploi/entreprise/:entrepriseId/candidats
// @access  Privé (Entreprise/Admin)
exports.rechercherCandidatsEntrepriseParBadge = asyncHandler(async (req, res, next) => {
  const { entrepriseId } = req.params;
  const { badgeId } = req.query;

  // Autorisation: l'entreprise elle-même ou admin
  if (String(entrepriseId) !== String(req.user.id) && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Vous n'êtes pas autorisé à accéder à ces données`, 401));
  }

  const filtreOffres = { entreprise: entrepriseId };
  const offres = await OffreEmploi.find(filtreOffres).select('candidats').lean();

  const bid = badgeId ? String(badgeId) : null;
  const candidats = [];

  for (const off of offres) {
    for (const c of (off.candidats || [])) {
      if (!bid || (c.badgesPresentes || []).some(b => String(b) === bid)) {
        candidats.push({
          offreId: off._id,
          candidatureId: c._id,
          utilisateur: c.utilisateur,
          statut: c.statut,
          dateCandidature: c.dateCandidature,
          badgesPresentes: c.badgesPresentes || []
        });
      }
    }
  }

  // Option: peupler les utilisateurs en un seul appel
  // Récupérer les IDs uniques
  const userIds = [...new Set(candidats.map(c => String(c.utilisateur)))];
  const users = await User.find({ _id: { $in: userIds } }).select('nom email photoProfil').lean();
  const usersMap = new Map(users.map(u => [String(u._id), u]));

  const enriched = candidats.map(c => ({
    ...c,
    utilisateur: usersMap.get(String(c.utilisateur)) || { _id: c.utilisateur }
  }));

  return res.status(200).json({ success: true, count: enriched.length, data: enriched });
});

// @desc    Récupérer les offres auxquelles l'utilisateur a postulé
// @route   GET /api/offres-emploi/mes-candidatures
// @access  Privé (Apprenant/Formateur)
exports.getMesCandidatures = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const candidatures = await OffreEmploi.find({ 'candidats.utilisateur': userId })
    .select('titre entreprise typeContrat salaire description candidats dateCreation')
    .populate('entreprise', 'nom logo')
    .lean();

  const items = (candidatures || []).map(offre => {
    const c = (offre.candidats || []).find(x => String(x.utilisateur) === String(userId));
    return {
      _id: offre._id,
      titre: offre.titre,
      entreprise: offre.entreprise,
      typeContrat: offre.typeContrat,
      salaire: offre.salaire,
      description: offre.description,
      dateCreation: offre.dateCreation,
      candidature: c ? { statut: c.statut, dateCandidature: c.dateCandidature, commentaire: c.commentaire } : null,
    };
  });

  res.status(200).json({ success: true, count: items.length, data: items });
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

  // Normalisation du payload depuis le frontend
  const {
    titre,
    description,
    typeContrat,
    salaire,
    lieu,
    localisation,
    dateExpiration,
    competencesRequises,
    badgesRequis
  } = req.body || {};

  const ville = (localisation && typeof localisation === 'string') ? localisation : (lieu || undefined);
  const parsedSalaire = (() => {
    if (typeof salaire === 'string') {
      const digits = salaire.replace(/[^0-9]/g, '');
      const n = Number(digits);
      if (!Number.isNaN(n) && n > 0) return { min: n, devise: 'GNF', periode: 'mois' };
    } else if (salaire && typeof salaire === 'object') {
      return salaire; // déjà structuré
    }
    return undefined;
  })();

  const payload = {
    titre,
    description,
    typeContrat,
    entreprise: req.user && req.user.id ? req.user.id : (req.body && req.body.entreprise),
    localisation: {
      ville: ville || 'Conakry',
      pays: 'Guinée',
    },
    competencesRequises: Array.isArray(competencesRequises) ? (competencesRequises.length ? competencesRequises : ['Général']) : ['Général'],
    badgesRequis: Array.isArray(badgesRequis) ? badgesRequis : [],
    salaire: parsedSalaire,
    dateLimite: dateExpiration ? new Date(dateExpiration) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // par défaut +7 jours
    statut: 'en_attente'
  };

  // Logs DEBUG
  try {
    console.log('[OffreEmploi][create] user:', { id: req.user && req.user.id, role: req.user && req.user.role });
  } catch (e) {}
  try {
    console.log('[OffreEmploi][create] raw body:', req.body);
  } catch (e) {}
  try {
    console.log('[OffreEmploi][create] normalized payload:', payload);
  } catch (e) {}

  let offre;
  try {
    offre = await OffreEmploi.create(payload);
  } catch (err) {
    console.error('[OffreEmploi][create] error:', err && err.message ? err.message : err);
    if (err && err.errors) {
      try {
        const details = {};
        for (const k in err.errors) {
          if (Object.prototype.hasOwnProperty.call(err.errors, k)) {
            details[k] = err.errors[k] && err.errors[k].message ? err.errors[k].message : String(err.errors[k]);
          }
        }
        console.error('[OffreEmploi][create] validation errors:', details);
      } catch (e) {}
    }
    return next(err);
  }

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

  // Normaliser certains champs du body
  const upd = { ...req.body };
  // Traduire les statuts front vers l'enum du schéma
  if (typeof upd.statut === 'string') {
    const mapStatut = {
      'ouverte': 'publiee',
      'ouvert': 'publiee',
      'rejete': 'annulee',
      'rejetee': 'annulee',
    };
    const lower = upd.statut.toLowerCase();
    upd.statut = mapStatut[lower] || upd.statut;
  }
  if (upd.dateExpiration) {
    upd.dateLimite = new Date(upd.dateExpiration);
    delete upd.dateExpiration;
  }
  if (typeof upd.lieu === 'string') {
    upd.localisation = Object.assign({}, offre.localisation?.toObject?.() || offre.localisation || {}, { ville: upd.lieu });
    delete upd.lieu;
  } else if (typeof upd.localisation === 'string') {
    upd.localisation = { ville: upd.localisation, pays: 'Guinée' };
  }
  if (typeof upd.salaire === 'string') {
    const digits = upd.salaire.replace(/[^0-9]/g, '');
    const n = Number(digits);
    upd.salaire = !Number.isNaN(n) && n > 0 ? { min: n, devise: 'GNF', periode: 'mois' } : undefined;
  }

  // Mise à jour de l'offre
  offre = await OffreEmploi.findByIdAndUpdate(req.params.id, upd, {
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

  // Vérifier si l'offre est toujours ouverte/publiée
  const statutOuvert = ['ouverte', 'publiee'];
  if (!statutOuvert.includes(offre.statut)) {
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

// @desc    Récupérer les offres d'emploi d'une entreprise (avec pagination)
// @route   GET /api/offres-emploi/entreprise/:entrepriseId?page=&limit=
// @access  Public
exports.getOffresParEntreprise = asyncHandler(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {
    entreprise: req.params.entrepriseId,
    statut: { $in: ['ouverte', 'active', 'en_attente'] }
  };

  const [items, total] = await Promise.all([
    OffreEmploi.find(filter)
      .sort('-dateCreation')
      .skip(skip)
      .limit(limit),
    OffreEmploi.countDocuments(filter)
  ]);

  const pagination = {};
  const endIndex = page * limit;
  if (endIndex < total) {
    pagination.next = { page: page + 1, limit };
  }
  if (skip > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  res.status(200).json({
    success: true,
    count: items.length,
    total,
    pagination,
    data: items
  });
});
