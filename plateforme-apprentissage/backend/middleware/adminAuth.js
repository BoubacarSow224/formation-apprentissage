const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier l'authentification admin
const adminAuth = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Accès refusé. Token manquant.' 
      });
    }

    // Vérifier le token avec une clé par défaut si JWT_SECRET n'est pas défini
    const jwtSecret = process.env.JWT_SECRET || 'votre_cle_secrete_par_defaut';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide. Utilisateur non trouvé.' 
      });
    }

    // Vérifier si l'utilisateur est admin
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès refusé. Privilèges administrateur requis.' 
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur middleware admin:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expiré.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la vérification admin.' 
    });
  }
};

module.exports = adminAuth;
