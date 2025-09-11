const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage');
    console.log('MongoDB connecté');
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Créer un admin
const createAdmin = async () => {
  try {
    await connectDB();

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Un admin existe déjà:');
      console.log('Email:', existingAdmin.email);
      console.log('Nom:', existingAdmin.nom);
      return;
    }

    // Données de l'admin
    const adminData = {
      nom: 'Super Admin',
      email: 'admin@plateforme.com',
      password: 'admin123',
      role: 'admin',
      telephone: '+221 77 123 45 67',
      bio: 'Administrateur principal de la plateforme d\'apprentissage',
      competences: ['Gestion', 'Administration', 'Modération'],
      langues: ['Français', 'Anglais'],
      statut: 'actif'
    };

    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    // Créer l'admin
    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin créé avec succès !');
    console.log('📧 Email: admin@plateforme.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('👤 Rôle: admin');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Exécuter le script
createAdmin();
