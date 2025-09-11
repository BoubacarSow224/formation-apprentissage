const User = require('../models/User');
const path = require('path');
const fs = require('fs').promises;

// Upload photo de profil
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.files || !req.files.photo) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const photo = req.files.photo;
    
    // Vérifier le type de fichier
    if (!photo.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Le fichier doit être une image'
      });
    }

    // Vérifier la taille (max 5MB)
    if (photo.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'La taille de l\'image ne doit pas dépasser 5MB'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Créer le dossier uploads/profiles s'il n'existe pas
    const uploadsDir = path.join(__dirname, '../uploads/profiles');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Supprimer l'ancienne photo si elle existe
    if (user.photoProfil && user.photoProfil !== 'default.jpg') {
      const oldPhotoPath = path.join(uploadsDir, user.photoProfil);
      try {
        await fs.unlink(oldPhotoPath);
      } catch (error) {
        console.log('Ancienne photo non trouvée:', error.message);
      }
    }

    // Générer un nom unique pour le fichier
    const fileExtension = path.extname(photo.name);
    const fileName = `${user._id}_${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Sauvegarder le fichier
    await photo.mv(filePath);

    // Mettre à jour l'utilisateur
    user.photoProfil = fileName;
    await user.save();

    res.json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      photoProfil: fileName,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        photoProfil: fileName
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de la photo',
      error: error.message
    });
  }
};

// Supprimer photo de profil
exports.deletePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Supprimer le fichier physique si ce n'est pas la photo par défaut
    if (user.photoProfil && user.photoProfil !== 'default.jpg') {
      const photoPath = path.join(__dirname, '../uploads/profiles', user.photoProfil);
      try {
        await fs.unlink(photoPath);
      } catch (error) {
        console.log('Fichier photo non trouvé:', error.message);
      }
    }

    // Remettre la photo par défaut
    user.photoProfil = 'default.jpg';
    await user.save();

    res.json({
      success: true,
      message: 'Photo de profil supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la photo',
      error: error.message
    });
  }
};
