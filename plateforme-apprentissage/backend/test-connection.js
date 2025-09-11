const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('Test de connexion à MongoDB...');
    console.log('URI MongoDB:', process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage');
    console.log('✅ Connexion à MongoDB réussie !');
    
    // Test de création d'un utilisateur simple
    const User = require('./models/User');
    console.log('✅ Modèle User chargé avec succès');
    
    await mongoose.disconnect();
    console.log('✅ Déconnexion réussie');
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  }
};

testConnection();
