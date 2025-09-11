const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Script pour créer des utilisateurs de test directement en base
async function createTestUsers() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage';
    await mongoose.connect(mongoUri);
    console.log('✅ Connexion MongoDB établie');
    
    // Utilisateurs de test
    const testUsers = [
      {
        nom: 'Admin Test',
        email: 'admin@test.com',
        telephone: '+221111111111',
        password: 'admin123',
        role: 'admin'
      },
      {
        nom: 'Formateur Test',
        email: 'formateur@test.com',
        telephone: '+221222222222',
        password: 'formateur123',
        role: 'formateur'
      },
      {
        nom: 'Apprenant Test',
        email: 'apprenant@test.com',
        telephone: '+221333333333',
        password: 'apprenant123',
        role: 'apprenant'
      },
      {
        nom: 'Entreprise Test',
        email: 'entreprise@test.com',
        telephone: '+221444444444',
        password: 'entreprise123',
        role: 'entreprise'
      }
    ];
    
    console.log('\n🧹 Suppression des utilisateurs de test existants...');
    for (const userData of testUsers) {
      await User.deleteOne({ email: userData.email });
    }
    
    console.log('\n👥 Création des utilisateurs de test...');
    for (const userData of testUsers) {
      try {
        const user = await User.create(userData);
        console.log(`✅ ${user.role.toUpperCase()}: ${user.email} (ID: ${user._id})`);
      } catch (error) {
        console.error(`❌ Erreur pour ${userData.email}:`, error.message);
      }
    }
    
    // Vérification
    console.log('\n📊 Vérification des utilisateurs créés:');
    const allUsers = await User.find({}).select('nom email role dateInscription estActif');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nom} (${user.email}) - ${user.role} - Actif: ${user.estActif}`);
    });
    
    console.log('\n🎉 Utilisateurs de test créés avec succès!');
    console.log('\n📋 Informations de connexion:');
    console.log('Admin: admin@test.com / admin123');
    console.log('Formateur: formateur@test.com / formateur123');
    console.log('Apprenant: apprenant@test.com / apprenant123');
    console.log('Entreprise: entreprise@test.com / entreprise123');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Connexion fermée');
    process.exit(0);
  }
}

createTestUsers();
