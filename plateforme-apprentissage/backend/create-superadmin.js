require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage';

const createSuperAdmin = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // Vérifier si un super admin existe déjà
    const existingSuperAdmin = await User.findOne({ role: 'admin', email: 'admin@plateforme.com' });
    if (existingSuperAdmin) {
      console.log('⚠️  Un administrateur existe déjà:', existingSuperAdmin.email);
      console.log('📧 Email:', existingSuperAdmin.email);
      console.log('👤 Nom:', existingSuperAdmin.nom);
      console.log('🔑 Rôle:', existingSuperAdmin.role);
      
      // Proposer de réinitialiser le mot de passe
      console.log('\n🔄 Réinitialisation du mot de passe...');
      const newPassword = 'SuperAdmin2024!';
      // IMPORTANT: définir en clair et laisser le hook pre('save') hasher
      existingSuperAdmin.password = newPassword;
      existingSuperAdmin.estActif = true;
      await existingSuperAdmin.save();
      
      console.log('✅ Mot de passe réinitialisé avec succès !');
      console.log('🔐 Nouveau mot de passe:', newPassword);
      console.log('\n📋 INFORMATIONS DE CONNEXION:');
      console.log('📧 Email:', existingSuperAdmin.email);
      console.log('🔑 Mot de passe:', newPassword);
      
      return;
    }

    // Créer un nouveau super administrateur
    const superAdminData = {
      nom: 'Super Administrateur',
      email: 'admin@plateforme.com',
      telephone: '+221771234567',
      password: 'SuperAdmin2024!',
      role: 'admin',
      estActif: true,
      bio: 'Super Administrateur de la plateforme d\'apprentissage avec tous les privilèges.',
      competences: ['Administration', 'Gestion', 'Modération', 'Analytics'],
      langues: ['Français', 'Anglais'],
      dateInscription: new Date(),
      derniereConnexion: new Date(),
      photoProfil: 'default.jpg'
    };

    // Créer l'utilisateur
    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log('🎉 Super Administrateur créé avec succès !');
    console.log('\n📋 INFORMATIONS DE CONNEXION:');
    console.log('📧 Email: admin@plateforme.com');
    console.log('🔑 Mot de passe: SuperAdmin2024!');
    console.log('👤 Nom: Super Administrateur');
    console.log('🔐 Rôle: admin');
    
    console.log('\n🚀 INSTRUCTIONS:');
    console.log('1. Démarrez le serveur backend (npm start)');
    console.log('2. Connectez-vous avec les identifiants ci-dessus');
    console.log('3. Accédez au panneau d\'administration');
    console.log('4. Vous avez maintenant un contrôle total sur la plateforme !');

  } catch (error) {
    console.error('❌ Erreur lors de la création du super admin:', error);
    
    if (error.code === 11000) {
      console.log('⚠️  Un utilisateur avec cet email existe déjà');
      console.log('💡 Essayez de vous connecter avec: admin@plateforme.com');
    }
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
    process.exit(0);
  }
};

// Créer également un utilisateur de test pour chaque rôle
const createTestUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Création des utilisateurs de test...');

    const testUsers = [
      {
        nom: 'Formateur Test',
        email: 'formateur@test.com',
        password: 'Test123!',
        role: 'formateur',
        estActif: true,
        telephone: '+221771111111',
        bio: 'Formateur de test pour la plateforme',
        competences: ['Enseignement', 'Pédagogie'],
        langues: ['Français']
      },
      {
        nom: 'Apprenant Test',
        email: 'apprenant@test.com',
        password: 'Test123!',
        role: 'apprenant',
        estActif: true,
        telephone: '+221772222222',
        bio: 'Apprenant de test pour la plateforme',
        competences: ['Apprentissage'],
        langues: ['Français']
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        userData.dateInscription = new Date();
        userData.photoProfil = 'default.jpg';
        
        const user = new User(userData);
        await user.save();
        console.log(`✅ Utilisateur ${userData.role} créé: ${userData.email}`);
      } else {
        console.log(`⚠️  ${userData.role} existe déjà: ${userData.email}`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs de test:', error);
  }
};

// Fonction principale
const main = async () => {
  console.log('🚀 Création du Super Administrateur et des utilisateurs de test...\n');
  
  await createSuperAdmin();
  await createTestUsers();
  
  console.log('\n🎯 RÉCAPITULATIF DES COMPTES CRÉÉS:');
  console.log('👑 Super Admin: admin@plateforme.com / SuperAdmin2024!');
  console.log('👨‍🏫 Formateur: formateur@test.com / Test123!');
  console.log('👨‍🎓 Apprenant: apprenant@test.com / Test123!');
  console.log('\n🔥 Votre plateforme est prête ! Connectez-vous et prenez le contrôle total !');
};

// Exécuter le script
main();
