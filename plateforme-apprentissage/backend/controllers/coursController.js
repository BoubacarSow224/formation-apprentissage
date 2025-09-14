const Cours = require('../models/Cours');
const Badge = require('../models/Badge');
const Certificat = require('../models/Certificat');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Récupérer tous les cours
// @route   GET /api/cours
// @access  Public
exports.getTousLesCours = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obtenir tous les cours d'un formateur (ses propres cours)
// @route   GET /api/cours/formateur/mes-cours
// @access  Privé (Formateur/Admin)
exports.getMesCoursFormateur = asyncHandler(async (req, res, next) => {
  const formateurId = req.user.id;

  if (req.user.role !== 'formateur' && req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès refusé', 403));
  }

  const cours = await Cours.find({ formateur: formateurId })
    .sort('-createdAt')
    .select('titre estApprouve estPublic statutModeration createdAt');

  // Ajouter le nombre d'étudiants par cours
  const withStudents = await Promise.all(
    cours.map(async (c) => {
      const count = await User.countDocuments({ 'coursSuivis.cours': c._id });
      return {
        _id: c._id,
        titre: c.titre,
        estApprouve: c.estApprouve,
        estPublic: c.estPublic,
        statutModeration: c.statutModeration,
        createdAt: c.createdAt,
        students: count
      };
    })
  );

  res.status(200).json({ success: true, data: withStudents });
});

// @desc    Récupérer les cours publics (approuvés & publiés)
// @route   GET /api/cours/public
// @access  Public
exports.getCoursPublics = asyncHandler(async (req, res, next) => {
  // Ne retourner que les cours approuvés & publics ET dont le formateur est actif et de rôle 'formateur'
  const EXCLUDED_TITLES = [
    'Couture - Techniques de Base',
    'Mécanique Automobile - Niveau Débutant',
    'Introduction au Développement Web'
  ];

  const raw = await Cours.find({
      estApprouve: true,
      estPublic: true,
      titre: { $nin: EXCLUDED_TITLES }
    })
    .sort('-createdAt')
    .populate({ path: 'formateur', select: 'nom photoProfil role estActif', match: { role: 'formateur', estActif: true } });

  const cours = raw.filter(c => !!c.formateur);

  res.status(200).json({
    success: true,
    count: cours.length,
    data: cours
  });
});

// @desc    Récupérer un seul cours
// @route   GET /api/cours/:id
// @access  Public
exports.getCours = asyncHandler(async (req, res, next) => {
  const cours = await Cours.findById(req.params.id)
    .populate('formateur', 'nom photoProfil');

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

// @desc    Publier un cours (Formateur/Admin) - nécessite estApprouve = true
// @route   PUT /api/cours/:id/publier
// @access  Privé (Formateur/Admin)
exports.publierCours = asyncHandler(async (req, res, next) => {
  const cours = await Cours.findById(req.params.id);

  if (!cours) {
    return next(new ErrorResponse(`Cours non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Autorisation: propriétaire ou admin
  if (cours.formateur.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès refusé', 403));
  }

  if (!cours.estApprouve) {
    return next(new ErrorResponse('Le cours doit être approuvé avant publication', 400));
  }

  cours.estPublic = true;
  await cours.save();

  res.status(200).json({ success: true, data: cours });
});

// @desc    Dépublier un cours (Formateur/Admin)
// @route   PUT /api/cours/:id/depublier
// @access  Privé (Formateur/Admin)
exports.depublierCours = asyncHandler(async (req, res, next) => {
  const cours = await Cours.findById(req.params.id);

  if (!cours) {
    return next(new ErrorResponse(`Cours non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Autorisation: propriétaire ou admin
  if (cours.formateur.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès refusé', 403));
  }

  cours.estPublic = false;
  await cours.save();

  res.status(200).json({ success: true, data: cours });
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
    // un admin peut aussi définir explicitement estPublic selon besoin, sinon reste par défaut
  } else {
    // Sécuriser les champs envoyés par le client pour un formateur
    req.body.estApprouve = false;
    req.body.estPublic = false;
    req.body.statutModeration = 'en_attente';
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
        403
      )
    );
  }

  // Si le cours est approuvé et que l'utilisateur est formateur (pas admin),
  // on autorise la modification mais on remet le cours en modération.
  if (cours.estApprouve && req.user.role !== 'admin') {
    req.body.estApprouve = false;
    req.body.estPublic = false;
    req.body.statutModeration = 'en_attente';
  }

  // Sécurité: empêcher la modification arbitraire du propriétaire côté client
  if (req.body.formateur && req.body.formateur.toString() !== cours.formateur.toString()) {
    delete req.body.formateur;
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

  // Vérifier si le cours est approuvé et publié
  if (!cours.estApprouve || !cours.estPublic) {
    return next(
      new ErrorResponse(
        'Impossible de s\'inscrire à un cours non disponible (non approuvé ou non publié)',
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
  const { etapeTerminee } = req.body; // index d'étape (0-based) facultatif
  const coursId = req.params.id;
  const userId = req.user.id;

  // Vérifier l'existence du cours et récupérer le nombre d'étapes
  const cours = await Cours.findById(coursId).select('etapes formateur');
  if (!cours) {
    return next(new ErrorResponse(`Cours non trouvé avec l'ID ${coursId}`, 404));
  }

  const totalEtapes = Array.isArray(cours.etapes) ? cours.etapes.length : 0;

  // Vérifier si l'utilisateur est inscrit au cours
  const utilisateur = await User.findOne({
    _id: userId,
    'coursSuivis.cours': coursId
  });

  if (!utilisateur) {
    return next(new ErrorResponse("Vous n'êtes pas inscrit à ce cours", 400));
  }

  const coursSuivi = utilisateur.coursSuivis.find(
    cs => cs.cours.toString() === coursId
  );

  // Calculer la progression
  let nouvelleProgression = coursSuivi.progression || 0;
  if (typeof etapeTerminee === 'number' && totalEtapes > 0) {
    const progressionCalculee = Math.min(100, Math.round(((etapeTerminee + 1) / totalEtapes) * 100));
    nouvelleProgression = Math.max(nouvelleProgression, progressionCalculee);
  }

  coursSuivi.progression = nouvelleProgression;
  if (nouvelleProgression >= 100) {
    coursSuivi.termine = true;
  }

  await utilisateur.save();

  res.status(200).json({
    success: true,
    data: coursSuivi
  });
});

// @desc    Démarrer un cours (inscription si nécessaire)
// @route   POST /api/cours/:id/demarrer
// @access  Privé (Apprenant)
exports.demarrerCours = asyncHandler(async (req, res, next) => {
  const coursId = req.params.id;

  const cours = await Cours.findById(coursId).select('estApprouve estPublic');
  if (!cours) {
    return next(new ErrorResponse(`Cours non trouvé avec l'ID ${coursId}`, 404));
  }

  if (!cours.estApprouve || !cours.estPublic) {
    return next(new ErrorResponse("Ce cours n'est pas disponible actuellement", 400));
  }

  const dejaInscrit = await User.findOne({ _id: req.user.id, 'coursSuivis.cours': coursId });
  if (!dejaInscrit) {
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { coursSuivis: { cours: coursId, progression: 0, termine: false } } },
      { new: true, runValidators: true }
    );
  }

  return res.status(200).json({ success: true, message: 'Cours démarré' });
});

// @desc    Marquer une étape comme terminée (met à jour la progression)
// @route   PATCH /api/cours/:id/etapes/:index/terminer
// @access  Privé (Apprenant)
exports.terminerEtape = asyncHandler(async (req, res, next) => {
  const index = parseInt(req.params.index, 10);
  if (Number.isNaN(index)) {
    return next(new ErrorResponse("Index d'étape invalide", 400));
  }

  // Réutiliser la logique de mise à jour via mettreAJourProgression
  req.body.etapeTerminee = index;
  return exports.mettreAJourProgression(req, res, next);
});

// @desc    Terminer un cours (force progression 100%)
// @route   PATCH /api/cours/:id/terminer
// @access  Privé (Apprenant)
exports.terminerCours = asyncHandler(async (req, res, next) => {
  const coursId = req.params.id;
  const userId = req.user.id;

  const utilisateur = await User.findOne({ _id: userId, 'coursSuivis.cours': coursId });
  if (!utilisateur) {
    return next(new ErrorResponse("Vous n'êtes pas inscrit à ce cours", 400));
  }

  const coursSuivi = utilisateur.coursSuivis.find(cs => cs.cours.toString() === coursId);
  coursSuivi.progression = 100;
  coursSuivi.termine = true;
  await utilisateur.save();

  res.status(200).json({ success: true, data: coursSuivi });
});

// @desc    Attribuer un badge à un apprenant pour un cours complété
// @route   POST /api/cours/:id/attribuer-badge
// @access  Privé (Formateur/Admin)
exports.attribuerBadge = asyncHandler(async (req, res, next) => {
  const coursId = req.params.id;
  const { apprenantId, badgeId } = req.body;

  const cours = await Cours.findById(coursId).select('formateur');
  if (!cours) {
    return next(new ErrorResponse(`Cours non trouvé avec l'ID ${coursId}`, 404));
  }

  // Autorisation: formateur du cours ou admin
  if (cours.formateur.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès refusé', 403));
  }

  if (!apprenantId || !badgeId) {
    return next(new ErrorResponse('apprenantId et badgeId sont requis', 400));
  }

  const apprenant = await User.findById(apprenantId);
  if (!apprenant) {
    return next(new ErrorResponse('Apprenant introuvable', 404));
  }

  // Vérifier complétion du cours
  const suivi = apprenant.coursSuivis.find(cs => cs.cours.toString() === coursId);
  if (!suivi || !(suivi.termine || (suivi.progression >= 100))) {
    return next(new ErrorResponse("L'apprenant n'a pas encore complété ce cours", 400));
  }

  // Vérifier que le badge existe
  const badge = await Badge.findById(badgeId);
  if (!badge) {
    return next(new ErrorResponse('Badge introuvable', 404));
  }

  // Attribuer le badge (éviter doublons)
  const dejaObtenu = (apprenant.badgesObtenus || []).some(b => b.badge.toString() === badgeId);
  if (!dejaObtenu) {
    apprenant.badgesObtenus.push({ badge: badgeId, cours: coursId, dateObtention: new Date() });
    await apprenant.save();
  }

  res.status(200).json({ success: true, message: 'Badge attribué', data: apprenant.badgesObtenus });
});

// @desc    Délivrer un certificat à un apprenant pour un cours complété
// @route   POST /api/cours/:id/delivrer-certificat
// @access  Privé (Formateur/Admin)
exports.delivrerCertificat = asyncHandler(async (req, res, next) => {
  const coursId = req.params.id;
  const { apprenantId, noteFinale = 100, competencesValidees = [] } = req.body;

  const cours = await Cours.findById(coursId).select('formateur');
  if (!cours) {
    return next(new ErrorResponse(`Cours non trouvé avec l'ID ${coursId}`, 404));
  }

  if (cours.formateur.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès refusé', 403));
  }

  const apprenant = await User.findById(apprenantId);
  if (!apprenant) {
    return next(new ErrorResponse('Apprenant introuvable', 404));
  }

  const suivi = apprenant.coursSuivis.find(cs => cs.cours.toString() === coursId);
  if (!suivi || !(suivi.termine || (suivi.progression >= 100))) {
    return next(new ErrorResponse("L'apprenant n'a pas encore complété ce cours", 400));
  }

  const certificat = await Certificat.create({
    nom: `Certificat ${coursId}`,
    description: 'Certification de complétion de cours',
    template: 'default-template',
    cours: coursId,
    utilisateur: apprenantId,
    formateur: cours.formateur,
    noteFinale,
    pourcentageCompletion: 100,
    competencesValidees
  });

  await certificat.genererQRCode();

  const downloadUrl = `/api/certificats/${certificat._id}/download`;
  res.status(201).json({ success: true, message: 'Certificat délivré', data: { ...certificat.toObject(), downloadUrl } });
});

// ====================
//       FORMATEUR
// ====================

// @desc    Liste des élèves inscrits à un cours avec progression
// @route   GET /api/cours/:id/eleves
// @access  Privé (Formateur/Admin)
exports.getElevesCours = asyncHandler(async (req, res, next) => {
  const coursId = req.params.id;
  const cours = await Cours.findById(coursId).select('formateur etapes');
  if (!cours) {
    return next(new ErrorResponse(`Cours non trouvé avec l'ID ${coursId}`, 404));
  }
  if (cours.formateur.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès refusé', 403));
  }

  // Trouver les apprenants inscrits à ce cours
  const eleves = await User.find({ 'coursSuivis.cours': coursId, role: 'apprenant' })
    .select('nom email photoProfil derniereActiviteAt coursSuivis badgesObtenus');

  const totalEtapes = Array.isArray(cours.etapes) ? cours.etapes.length : 0;

  const data = eleves.map(e => {
    const suivi = e.coursSuivis.find(cs => cs.cours.toString() === coursId);
    const progression = suivi?.progression || 0;
    const termine = !!suivi?.termine || progression >= 100;
    const badgeAttribue = (e.badgesObtenus || []).some(b => b.cours && b.cours.toString() === coursId);
    return {
      _id: e._id,
      nom: e.nom,
      email: e.email,
      photoProfil: e.photoProfil,
      progression,
      termine,
      derniereActiviteAt: e.derniereActiviteAt || e.derniereConnexion,
      totalEtapes,
      badgeAttribue
    };
  });

  res.json({ success: true, count: data.length, data });
});

// @desc    Détail de la progression d'un élève pour un cours
// @route   GET /api/cours/:id/eleves/:apprenantId
// @access  Privé (Formateur/Admin)
exports.getProgressionEleve = asyncHandler(async (req, res, next) => {
  const coursId = req.params.id;
  const { apprenantId } = req.params;

  const cours = await Cours.findById(coursId).select('formateur etapes titre');
  if (!cours) {
    return next(new ErrorResponse(`Cours non trouvé avec l'ID ${coursId}`, 404));
  }
  if (cours.formateur.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès refusé', 403));
  }

  const eleve = await User.findById(apprenantId).select('nom email photoProfil coursSuivis badgesObtenus derniereActiviteAt');
  if (!eleve) {
    return next(new ErrorResponse('Apprenant introuvable', 404));
  }

  const suivi = eleve.coursSuivis.find(cs => cs.cours.toString() === coursId);
  if (!suivi) {
    return next(new ErrorResponse("Cet apprenant n'est pas inscrit à ce cours", 400));
  }

  const totalEtapes = Array.isArray(cours.etapes) ? cours.etapes.length : 0;
  const progression = suivi.progression || 0;
  const termine = !!suivi.termine || progression >= 100;

  // Construire une vue par étape (sans persistance par-étape, estimée via progression)
  const etapes = (cours.etapes || []).map((et, idx) => {
    const seuil = Math.round(((idx + 1) / Math.max(totalEtapes, 1)) * 100);
    const completed = progression >= seuil;
    return {
      index: idx,
      titre: et.titre,
      completed,
      quiz: et.quiz || null
    };
  });

  const badge = (eleve.badgesObtenus || []).find(b => b.cours && b.cours.toString() === coursId);

  res.json({
    success: true,
    data: {
      eleve: { _id: eleve._id, nom: eleve.nom, email: eleve.email, photoProfil: eleve.photoProfil },
      cours: { _id: cours._id, titre: cours.titre },
      progression,
      termine,
      derniereActiviteAt: eleve.derniereActiviteAt,
      totalEtapes,
      etapes,
      badgeAttribue: !!badge,
      badge
    }
  });
});

// @desc    Historique des badges attribués pour un cours (formateur)
// @route   GET /api/cours/:id/historique-badges
// @access  Privé (Formateur/Admin)
exports.getHistoriqueBadges = asyncHandler(async (req, res, next) => {
  const coursId = req.params.id;
  const cours = await Cours.findById(coursId).select('formateur');
  if (!cours) {
    return next(new ErrorResponse(`Cours non trouvé avec l'ID ${coursId}`, 404));
  }
  if (cours.formateur.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès refusé', 403));
  }

  // Rechercher les utilisateurs ayant un badge lié à ce cours
  const users = await User.find({ 'badgesObtenus.cours': coursId })
    .select('nom email badgesObtenus');

  const records = [];
  users.forEach(u => {
    (u.badgesObtenus || []).forEach(b => {
      if (b.cours && b.cours.toString() === coursId.toString()) {
        records.push({
          utilisateurId: u._id,
          nom: u.nom,
          email: u.email,
          badgeId: b.badge,
          cours: b.cours,
          dateObtention: b.dateObtention
        });
      }
    });
  });

  res.json({ success: true, count: records.length, data: records });
});

// @desc    Lister les badges disponibles pour un cours
// @route   GET /api/cours/:id/badges
// @access  Privé (Formateur/Admin)
exports.getBadgesCours = asyncHandler(async (req, res, next) => {
  const coursId = req.params.id;
  const cours = await Cours.findById(coursId).select('formateur');
  if (!cours) {
    return next(new ErrorResponse(`Cours non trouvé avec l'ID ${coursId}`, 404));
  }
  if (cours.formateur.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès refusé', 403));
  }

  const badges = await Badge.find({ cours: coursId, estActif: true, estValide: true })
    .select('nom description image niveau');

  res.json({ success: true, count: badges.length, data: badges });
});

// @desc    Récupérer le certificat d'un élève pour un cours
// @route   GET /api/cours/:id/certificat?apprenantId=
// @access  Privé (Formateur/Admin)
exports.getCertificatEleve = asyncHandler(async (req, res, next) => {
  const coursId = req.params.id;
  const { apprenantId } = req.query;

  if (!apprenantId) {
    return next(new ErrorResponse('apprenantId est requis', 400));
  }

  const cours = await Cours.findById(coursId).select('formateur');
  if (!cours) {
    return next(new ErrorResponse(`Cours non trouvé avec l'ID ${coursId}`, 404));
  }
  if (cours.formateur.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Accès refusé', 403));
  }

  const certificat = await Certificat.findOne({ cours: coursId, utilisateur: apprenantId })
    .sort('-createdAt');

  if (!certificat) {
    return res.status(404).json({ success: false, message: 'Aucun certificat trouvé' });
  }

  const downloadUrl = `/api/certificats/${certificat._id}/download`;
  return res.json({ success: true, data: { ...certificat.toObject(), downloadUrl } });
});

// @desc    Obtenir les cours d'un formateur
// @route   GET /api/cours/formateur/:id
// @access  Public
exports.getCoursParFormateur = asyncHandler(async (req, res, next) => {
  const formateurId = req.params.id;

  // Vérifier si le formateur existe
  const formateur = await User.findById(formateurId);

  if (!formateur) {
    return next(new ErrorResponse(`Utilisateur non trouvé avec l'ID ${formateurId}`, 404));
  }

  // Public: ne retourner que les cours approuvés (et idéalement publiés)
  const cours = await Cours.find({ formateur: formateurId, estApprouve: true })
    .sort('-createdAt');

  res.status(200).json({ success: true, count: cours.length, data: cours });
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
    // TODO: Calculer les revenus réels quand le module de paiements sera intégré
    stats.totalRevenue = 0; // déterministe pour éviter des changements aléatoires
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

  const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
  const searchTitle = (req.query.q || '').toString().trim();
  const baseFilter = { formateur: formateurId };
  if (searchTitle) {
    baseFilter.titre = { $regex: new RegExp(searchTitle, 'i') };
  }
  const cours = await Cours.find(baseFilter)
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit)
    .select('titre categorie niveau nombreVues noteMoyenne nombreAvis statutModeration estApprouve estPublic createdAt updatedAt');

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
        status: c.estApprouve ? (c.estPublic ? 'Publié' : 'Approuvé') : (c.statutModeration === 'en_attente' ? 'En attente' : 'En cours'),
        rating: c.noteMoyenne || 0,
        createdAt: c.createdAt
      };
    })
  );

  console.log('[Formateur.getCoursRecents] user:', formateurId, 'count:', coursAvecStats.length, 'titles:', coursAvecStats.map(c=>c.titre).slice(0,10));
  if (searchTitle) {
    const found = coursAvecStats.some(c => (c.titre || '').toLowerCase().includes(searchTitle.toLowerCase()));
    console.log('[Formateur.getCoursRecents] search q=\'' + searchTitle + '\' found:', found);
  }

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
      courseId: coursSuivi?.cours,
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
    { estApprouve: true, estPublic: true, statutModeration: 'approuve' },
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
