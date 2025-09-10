const fs = require('fs');
const path = require('path');
const ErrorResponse = require('./errorResponse');

// Créer le répertoire s'il n'existe pas
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

// Télécharger un fichier
exports.uploadFile = async (file, uploadPath, allowedMimeTypes = []) => {
  // Vérifier si un fichier a été téléchargé
  if (!file) {
    throw new Error('Aucun fichier téléchargé');
  }

  // Vérifier le type MIME du fichier
  if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`Type de fichier non autorisé. Types autorisés: ${allowedMimeTypes.join(', ')}`);
  }

  // Créer un nom de fichier personnalisé
  const fileExt = path.extname(file.name);
  const fileName = `${file.md5}-${Date.now()}${fileExt}`;
  const filePath = path.join(uploadPath, fileName);

  // Créer le répertoire s'il n'existe pas
  ensureDirectoryExistence(filePath);

  // Déplacer le fichier vers le dossier de destination
  await file.mv(filePath);

  return {
    name: file.name,
    path: filePath,
    type: file.mimetype,
    size: file.size
  };
};

// Supprimer un fichier
exports.deleteFile = async (filePath) => {
  try {
    // Vérifier si le fichier existe
    if (fs.existsSync(filePath)) {
      // Supprimer le fichier
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Erreur lors de la suppression du fichier ${filePath}:`, err);
    return false;
  }
};

// Middleware pour gérer les téléchargements de fichiers
exports.upload = (fieldName, uploadPath, allowedMimeTypes = []) => {
  return (req, res, next) => {
    if (!req.files || !req.files[fieldName]) {
      return next();
    }

    const file = req.files[fieldName];

    // Vérifier si c'est un tableau de fichiers
    if (Array.isArray(file)) {
      req.body[fieldName] = [];
      file.forEach(f => {
        try {
          const uploadedFile = uploadFile(f, uploadPath, allowedMimeTypes);
          req.body[fieldName].push(uploadedFile);
        } catch (err) {
          return next(new ErrorResponse(`Erreur lors du téléchargement du fichier: ${err.message}`, 400));
        }
      });
    } else {
      // Gérer un seul fichier
      try {
        const uploadedFile = uploadFile(file, uploadPath, allowedMimeTypes);
        req.body[fieldName] = uploadedFile;
      } catch (err) {
        return next(new ErrorResponse(`Erreur lors du téléchargement du fichier: ${err.message}`, 400));
      }
    }

    next();
  };
};
