const ErrorResponse = require('../utils/errorResponse');

// Gestionnaire d'erreurs global
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log pour le débogage
  console.error(err.stack);

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  // Erreur de duplication de clé (ex: email ou téléphone déjà utilisé)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} est déjà utilisé`;
    error = new ErrorResponse(message, 400);
  }

  // Erreur de cast (ex: ID invalide)
  if (err.name === 'CastError') {
    const message = `Ressource non trouvée avec l'ID ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Réponse d'erreur
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erreur serveur'
  });
};

// Gestion des routes non trouvées
const notFound = (req, res, next) => {
  const error = new ErrorResponse(`Route non trouvée - ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
