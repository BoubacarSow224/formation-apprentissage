const jwt = require('jsonwebtoken');
const User = require('../models/User');
const path = require('path');
const fs = require('fs').promises;

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'votre_secret_tres_secret', {
    expiresIn: '30d', // 30 jours
  });
};

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    console.log('Données reçues pour inscription:', req.body);
    const { nom, email, telephone, password, role } = req.body;

    // Validation des champs requis
    if (!nom || !email || !telephone || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Tous les champs sont obligatoires (nom, email, telephone, password)' 
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Veuillez entrer une adresse email valide' 
      });
    }

    // Validation du téléphone
    if (telephone.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Le numéro de téléphone doit contenir au moins 8 caractères' 
      });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Vérifier si l'utilisateur existe déjà (par email ou téléphone)
    const userExists = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { telephone }] 
    });
    
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Un utilisateur avec cet email ou ce téléphone existe déjà' 
      });
    }

    // Créer un nouvel utilisateur
    const user = await User.create({
      nom: nom.trim(),
      email: email.toLowerCase().trim(),
      telephone: telephone.trim(),
      password,
      role: role || 'apprenant'
    });

    console.log('Utilisateur créé avec succès:', user._id);

    // Générer le token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        dateInscription: user.dateInscription
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ')
      });
    }

    // Gestion des erreurs de duplication MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        success: false,
        message: `Un utilisateur avec ce ${field} existe déjà`
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de l\'inscription', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    console.log('Tentative de connexion pour:', req.body.email);
    const { email, password } = req.body;

    // Validation des champs requis
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email et mot de passe sont obligatoires' 
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Veuillez entrer une adresse email valide' 
      });
    }

    // Vérifier si l'utilisateur existe (recherche insensible à la casse)
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log('Utilisateur non trouvé pour email:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier si le compte est actif
    if (!user.estActif) {
      return res.status(401).json({ 
        success: false,
        message: 'Votre compte a été désactivé. Contactez l\'administrateur.' 
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Mot de passe incorrect pour:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Mettre à jour la dernière connexion
    user.derniereConnexion = new Date();
    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    console.log('Connexion réussie pour:', user.email, '- Rôle:', user.role);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        dateInscription: user.dateInscription,
        derniereConnexion: user.derniereConnexion
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la connexion', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Obtenir le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération du profil', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Mettre à jour le profil de l'utilisateur
exports.updateProfile = async (req, res) => {
  try {
    const { nom, email, telephone, bio, competences, langues } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Vérifier si l'email ou le téléphone sont déjà utilisés par un autre utilisateur
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (emailExists) {
        return res.status(400).json({ 
          success: false,
          message: 'Cet email est déjà utilisé par un autre utilisateur' 
        });
      }
    }

    if (telephone && telephone !== user.telephone) {
      const phoneExists = await User.findOne({ telephone, _id: { $ne: req.user.id } });
      if (phoneExists) {
        return res.status(400).json({ 
          success: false,
          message: 'Ce numéro de téléphone est déjà utilisé par un autre utilisateur' 
        });
      }
    }

    // Mettre à jour les champs
    if (nom) user.nom = nom;
    if (email) user.email = email;
    if (telephone) user.telephone = telephone;
    if (bio) user.bio = bio;
    if (competences) user.competences = competences;
    if (langues) user.langues = langues;

    await user.save();

    const updatedUser = await User.findById(req.user.id).select('-password');
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la mise à jour du profil', 
      error: error.message 
    });
  }
};

// Obtenir le profil de l'utilisateur connecté via la route /me
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération du profil', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};
