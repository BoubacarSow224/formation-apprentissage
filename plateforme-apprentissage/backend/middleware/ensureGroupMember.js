const Groupe = require('../models/Groupe');

// Vérifie que l'utilisateur courant est formateur OU membre du groupe
module.exports = async function ensureGroupMember(req, res, next) {
  try {
    const groupId = req.params.id || req.params.groupId || req.body.groupId;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId requis' });

    const groupe = await Groupe.findById(groupId).select('formateur membres');
    if (!groupe) return res.status(404).json({ success: false, message: 'Groupe introuvable' });

    const userId = req.user.id;
    const isMember =
      groupe.formateur.toString() === userId ||
      groupe.membres.some((m) => m.toString() === userId);

    if (!isMember) return res.status(403).json({ success: false, message: 'Accès réservé aux membres du groupe' });

    req.groupe = groupe; // attacher pour usage ultérieur
    next();
  } catch (err) {
    console.error('ensureGroupMember error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}
