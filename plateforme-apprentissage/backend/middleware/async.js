// Enveloppe pour gérer les erreurs des contrôleurs asynchrones
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
