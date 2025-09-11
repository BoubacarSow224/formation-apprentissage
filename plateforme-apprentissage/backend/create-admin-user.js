const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage');
    console.log('Connexion à MongoDB établie');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('✅ Utilisateur admin existe déjà:', existingAdmin.email);
      console.log('Email:', existingAdmin.email);
      console.log('Rôle:', existingAdmin.role);
      await mongoose.disconnect();
      return;
    }

    // Créer un utilisateur admin
    const adminUser = await User.create({
      nom: 'Administrateur',
      email: 'admin@example.com',
      telephone: '+221000000000',
      password: 'admin123',
      role: 'admin'
    });

    console.log('✅ Utilisateur admin créé avec succès:');
    console.log('Email:', adminUser.email);
    console.log('Mot de passe: admin123');
    console.log('Téléphone:', adminUser.telephone);
    console.log('Rôle:', adminUser.role);
    console.log('ID:', adminUser._id);

    await mongoose.disconnect();
    console.log('✅ Déconnexion réussie');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

createAdminUser();
