const mongoose = require('mongoose');
const User = require('./models/User');

// Configuration simple
const createAdmin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/plateforme-apprentissage');
    console.log('✅ Connecté à MongoDB');

    // Vérifier si admin existe déjà
    const existingAdmin = await User.findOne({ email: 'admin@plateforme.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin existe déjà !');
      console.log('📧 Email: admin@plateforme.com');
      console.log('🔑 Mot de passe: SuperAdmin2024!');
      return;
    }

    // Créer directement avec le modèle User qui gère le hachage
    const adminData = {
      nom: 'Super Admin',
      email: 'admin@plateforme.com',
      telephone: '221771234567',
      password: 'SuperAdmin2024!', // Le champ correct est 'password'
      role: 'admin',
      estActif: true
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('🎉 SUPER ADMIN CRÉÉ !');
    console.log('📧 Email: admin@plateforme.com');
    console.log('🔑 Mot de passe: SuperAdmin2024!');
    console.log('👑 Rôle: admin');
    console.log('\n🚀 Vous pouvez maintenant vous connecter !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.code === 11000) {
      console.log('💡 Un utilisateur avec cet email/téléphone existe déjà');
      console.log('📧 Essayez: admin@plateforme.com / SuperAdmin2024!');
    }
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();
