const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Un administrateur existe déjà:', existingAdmin.email || existingAdmin.telephone);
      process.exit(0);
    }

    // Créer un compte administrateur
    const adminData = {
      nom: 'Administrateur Principal',
      email: 'admin@plateforme.com',
      telephone: '+221123456789',
      password: 'admin123456',
      role: 'admin',
      bio: 'Compte administrateur principal de la plateforme',
      langues: ['fr', 'en']
    };

    const admin = await User.create(adminData);
    console.log('Administrateur créé avec succès !');
    console.log('Email:', admin.email);
    console.log('Téléphone:', admin.telephone);
    console.log('Mot de passe: admin123456');
    console.log('ID:', admin._id);

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
    process.exit(1);
  }
};

// Exécuter le script
createAdmin();
