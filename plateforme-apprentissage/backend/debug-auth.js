const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
require('dotenv').config();

// Script de débogage pour tester l'authentification complète
const app = express();

// Configuration middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connexion MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur MongoDB:', error.message);
    process.exit(1);
  }
}

// Route de test d'inscription
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Données d\'inscription reçues:', req.body);
    
    const { nom, email, telephone, password, role } = req.body;
    
    // Validation
    if (!nom || !email || !telephone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires'
      });
    }
    
    // Vérifier si l'utilisateur existe
    const userExists = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { telephone }] 
    });
    
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email ou téléphone existe déjà'
      });
    }
    
    // Créer l'utilisateur
    const user = await User.create({
      nom: nom.trim(),
      email: email.toLowerCase().trim(),
      telephone: telephone.trim(),
      password,
      role: role || 'apprenant'
    });
    
    console.log('✅ Utilisateur créé:', user._id);
    
    // Générer un token simple pour le test
    const token = `test-token-${user._id}`;
    
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
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      error: error.message
    });
  }
});

// Route de test de connexion
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Tentative de connexion:', req.body.email);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }
    
    // Chercher l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase().trim() });
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
    
    // Mettre à jour la dernière connexion
    user.derniereConnexion = new Date();
    await user.save();
    
    const token = `test-token-${user._id}`;
    
    console.log('✅ Connexion réussie pour:', user.email);
    
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
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion',
      error: error.message
    });
  }
});

// Route de test pour lister les utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}).select('nom email role dateInscription estActif');
    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
});

// Route de test de base
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur de débogage fonctionnel',
    timestamp: new Date().toISOString()
  });
});

// Démarrer le serveur
async function startServer() {
  await connectDB();
  
  const PORT = 5003;
  app.listen(PORT, () => {
    console.log(`🚀 Serveur de débogage démarré sur le port ${PORT}`);
    console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
    console.log('\n🧪 Routes de test disponibles:');
    console.log('- POST /api/auth/register - Test d\'inscription');
    console.log('- POST /api/auth/login - Test de connexion');
    console.log('- GET /api/users - Liste des utilisateurs');
    console.log('- GET /api/test - Test de base');
    console.log('\n📋 Utilisateurs de test disponibles:');
    console.log('- admin@test.com / admin123');
    console.log('- formateur@test.com / formateur123');
    console.log('- apprenant@test.com / apprenant123');
  });
}

startServer().catch(console.error);
