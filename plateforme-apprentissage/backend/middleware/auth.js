const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// Middleware pour protéger les routes
exports.protect = async (req, res, next) => {
  let token;

  // Vérifier si le token est présent dans les en-têtes
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extraire le token du header
      token = req.headers.authorization.split(' ')[1];

      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_tres_secret');

      // Récupérer l'utilisateur à partir du token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Mettre à jour le statut en ligne et la dernière activité
      try {
        await User.findByIdAndUpdate(decoded.id, {
          $set: { enLigne: true, derniereActiviteAt: new Date() }
        });
      } catch (e) {
        console.error('Erreur lors de la mise à jour du statut en ligne:', e);
      }

      next();
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      return res.status(401).json({
        success: false,
        message: 'Non autorisé, token invalide'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé, pas de token'
    });
  }
};

// Middleware pour vérifier le rôle de l'utilisateur
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource`
      });
    }
    next();
  };
};

// Middleware spécifique pour les admins uniquement
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource.'
    });
  }
  
  next();
};
