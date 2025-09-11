const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage');
    console.log('Connexion à MongoDB établie');

    // Vérifier si l'utilisateur test existe déjà
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('✅ Utilisateur test existe déjà:', existingUser.email);
      await mongoose.disconnect();
      return;
    }

    // Créer un utilisateur test
    const testUser = await User.create({
      nom: 'Utilisateur Test',
      email: 'test@example.com',
      telephone: '+221123456789',
      password: 'password123',
      role: 'apprenant'
    });

    console.log('✅ Utilisateur test créé avec succès:');
    console.log('Email:', testUser.email);
    console.log('Téléphone:', testUser.telephone);
    console.log('Rôle:', testUser.role);
    console.log('ID:', testUser._id);

    await mongoose.disconnect();
    console.log('✅ Déconnexion réussie');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

createTestUser();
