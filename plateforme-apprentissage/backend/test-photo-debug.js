const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Script pour déboguer le problème de photo de profil
async function debugPhotoIssue() {
  try {
    console.log('🔍 Débogage du problème de photo de profil...\n');
    
    // 1. Vérifier la connexion MongoDB
    console.log('1️⃣ Test connexion MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connecté\n');
    
    // 2. Vérifier les dossiers uploads
    console.log('2️⃣ Vérification des dossiers...');
    const uploadsDir = path.join(__dirname, 'uploads');
    const profilesDir = path.join(uploadsDir, 'profiles');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Dossier uploads créé');
    } else {
      console.log('✅ Dossier uploads existe');
    }
    
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
      console.log('📁 Dossier profiles créé');
    } else {
      console.log('✅ Dossier profiles existe');
    }
    
    // Lister les fichiers dans profiles
    const files = fs.readdirSync(profilesDir);
    console.log('📋 Fichiers dans profiles:', files.length > 0 ? files : 'Aucun fichier');
    
    // 3. Vérifier les utilisateurs avec photos
    console.log('\n3️⃣ Vérification des utilisateurs...');
    const usersWithPhotos = await User.find({ 
      photoProfil: { $ne: 'default.jpg' } 
    }).select('nom email photoProfil');
    
    console.log(`👥 Utilisateurs avec photos: ${usersWithPhotos.length}`);
    usersWithPhotos.forEach(user => {
      const photoPath = path.join(profilesDir, user.photoProfil);
      const exists = fs.existsSync(photoPath);
      console.log(`   - ${user.nom}: ${user.photoProfil} ${exists ? '✅' : '❌'}`);
    });
    
    // 4. Test d'accès aux fichiers statiques
    console.log('\n4️⃣ Test d\'accès aux fichiers statiques...');
    console.log('🌐 URL de base: http://localhost:5003/uploads/profiles/');
    console.log('📂 Chemin physique:', profilesDir);
    
    // 5. Créer un utilisateur de test avec photo
    console.log('\n5️⃣ Création d\'un utilisateur de test...');
    const testUser = await User.findOne({ email: 'test.photo@example.com' });
    
    if (!testUser) {
      const newUser = await User.create({
        nom: 'Test Photo User',
        email: 'test.photo@example.com',
        telephone: '+221777000001',
        password: 'test123',
        role: 'formateur',
        photoProfil: 'test_photo.jpg'
      });
      console.log('✅ Utilisateur de test créé:', newUser._id);
    } else {
      console.log('✅ Utilisateur de test existe:', testUser._id);
    }
    
    // 6. Créer un fichier de test
    const testPhotoPath = path.join(profilesDir, 'test_photo.jpg');
    if (!fs.existsSync(testPhotoPath)) {
      fs.writeFileSync(testPhotoPath, 'fake image data for testing');
      console.log('✅ Fichier de test créé');
    }
    
    console.log('\n🎯 Résumé du diagnostic:');
    console.log('- Dossiers: ✅ Créés et accessibles');
    console.log('- Base de données: ✅ Connectée');
    console.log('- Utilisateur test: ✅ Créé');
    console.log('- Fichier test: ✅ Créé');
    
    console.log('\n🔧 Pour tester:');
    console.log('1. Démarrez le serveur: npm start');
    console.log('2. Connectez-vous avec: test.photo@example.com / test123');
    console.log('3. Vérifiez la console du navigateur pour les logs');
    console.log('4. Testez l\'upload d\'une vraie image');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Connexion fermée');
    process.exit(0);
  }
}

debugPhotoIssue();
