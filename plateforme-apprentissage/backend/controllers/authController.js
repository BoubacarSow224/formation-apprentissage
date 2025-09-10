const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    // Vérifier si l'utilisateur existe déjà (par email ou téléphone)
    const userExists = await User.findOne({ 
      $or: [{ email }, { telephone }] 
    });
    
    if (userExists) {
      return res.status(400).json({ 
        message: 'Un utilisateur avec cet email ou ce téléphone existe déjà' 
      });
    }

    // Créer un nouvel utilisateur
    const user = await User.create({
      nom,
      email,
      telephone,
      password,
      role: role || 'apprenant'
    });

    console.log('Utilisateur créé:', user._id);

    // Générer le token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'inscription', 
      error: error.message 
    });
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    console.log('Tentative de connexion:', req.body);
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Générer le token
    const token = generateToken(user._id);

    console.log('Connexion réussie pour:', user.email);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la connexion', 
      error: error.message 
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
      error: error.message 
    });
  }
};
