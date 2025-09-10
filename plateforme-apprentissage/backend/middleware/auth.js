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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur à partir du token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return next(new ErrorResponse('Utilisateur non trouvé', 404));
      }

      next();
    } catch (error) {
      console.error(error);
      return next(new ErrorResponse('Non autorisé, token invalide', 401));
    }
  }

  if (!token) {
    return next(new ErrorResponse('Non autorisé, pas de token', 401));
  }
};

// Middleware pour vérifier le rôle de l'utilisateur
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Utilisateur non authentifié', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource`,
          403
        )
      );
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
