const StudySession = require('../models/StudySession');
const mongoose = require('mongoose');

// Démarrer une session d'étude (une seule active par utilisateur)
exports.start = async (req, res) => {
  try {
    const userId = req.user.id;
    // S'il existe déjà une session non terminée, la renvoyer
    const existing = await StudySession.findOne({ user: userId, endedAt: { $exists: false } }).sort({ startedAt: -1 });
    if (existing) {
      return res.json({ success: true, session: existing, message: 'Session déjà en cours' });
    }

    const { course, context } = req.body || {};
    const session = await StudySession.create({ user: userId, course: course || undefined, context: context || undefined, startedAt: new Date() });
    return res.status(201).json({ success: true, session });
  } catch (error) {
    console.error('Erreur start study session:', error);
    return res.status(500).json({ success: false, message: 'Erreur démarrage session', error: error.message });
  }
};

// Arrêter la session d'étude active
exports.stop = async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await StudySession.findOne({ user: userId, endedAt: { $exists: false } }).sort({ startedAt: -1 });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Aucune session active' });
    }
    session.endedAt = new Date();
    session.durationMs = Math.max(0, session.endedAt.getTime() - new Date(session.startedAt).getTime());
    await session.save();
    return res.json({ success: true, session });
  } catch (error) {
    console.error('Erreur stop study session:', error);
    return res.status(500).json({ success: false, message: 'Erreur arrêt session', error: error.message });
  }
};

// Statistiques d'étude (total heures, semaine en cours)
exports.stats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total global (sessions terminées)
    const totalAgg = await StudySession.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), endedAt: { $exists: true } } },
      { $group: { _id: null, totalMs: { $sum: '$durationMs' } } }
    ]);
    const totalMs = totalAgg?.[0]?.totalMs || 0;

    // Semaine en cours
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // lundi comme début de semaine
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekAgg = await StudySession.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), startedAt: { $gte: startOfWeek }, endedAt: { $exists: true } } },
      { $group: { _id: null, totalMs: { $sum: '$durationMs' } } }
    ]);
    const weekMs = weekAgg?.[0]?.totalMs || 0;

    // Session active ?
    const active = await StudySession.findOne({ user: userId, endedAt: { $exists: false } }).select('_id startedAt');

    return res.json({ success: true, totalHours: Math.round((totalMs / 3600000) * 100) / 100, weekHours: Math.round((weekMs / 3600000) * 100) / 100, active: !!active, activeSince: active?.startedAt || null });
  } catch (error) {
    console.error('Erreur stats study session:', error);
    return res.status(500).json({ success: false, message: 'Erreur récupération stats', error: error.message });
  }
};

// Historique des N derniers jours (par défaut 14) - heures par jour
exports.history = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = Number(req.query.days || 14);
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const pipeline = [
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), endedAt: { $exists: true }, startedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } }, totalMs: { $sum: '$durationMs' } } },
      { $project: { _id: 0, date: '$_id', hours: { $round: [{ $divide: ['$totalMs', 3600000] }, 2] } } },
      { $sort: { date: 1 } }
    ];

    const data = await StudySession.aggregate(pipeline);
    const map = new Map(data.map(d => [d.date, d.hours]));
    const out = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, hours: map.get(key) || 0 });
    }

    return res.json({ success: true, days, series: out });
  } catch (error) {
    console.error('Erreur history study session:', error);
    return res.status(500).json({ success: false, message: 'Erreur historique', error: error.message });
  }
};

// Répartition des heures par cours
exports.byCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const pipeline = [
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), endedAt: { $exists: true } } },
      { $group: { _id: '$course', totalMs: { $sum: '$durationMs' } } },
      { $lookup: { from: 'cours', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      { $project: { courseId: '$_id', courseTitle: '$course.titre', hours: { $round: [{ $divide: ['$totalMs', 3600000] }, 2] } } },
      { $sort: { hours: -1 } }
    ];
    const data = await StudySession.aggregate(pipeline);
    return res.json({ success: true, items: data });
  } catch (error) {
    console.error('Erreur byCourse study session:', error);
    return res.status(500).json({ success: false, message: 'Erreur répartition par cours', error: error.message });
  }
};
