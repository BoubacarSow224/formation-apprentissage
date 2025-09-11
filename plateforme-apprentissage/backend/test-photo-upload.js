const fs = require('fs');
const path = require('path');

// Script pour tester et créer le dossier uploads/profiles
async function testPhotoUpload() {
  try {
    console.log('🔄 Test de la configuration d\'upload de photos...');
    
    // Vérifier et créer le dossier uploads/profiles
    const uploadsDir = path.join(__dirname, 'uploads');
    const profilesDir = path.join(uploadsDir, 'profiles');
    
    console.log('📁 Vérification du dossier uploads...');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Dossier uploads créé');
    } else {
      console.log('✅ Dossier uploads existe');
    }
    
    console.log('📁 Vérification du dossier profiles...');
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
      console.log('✅ Dossier profiles créé');
    } else {
      console.log('✅ Dossier profiles existe');
    }
    
    // Créer une image de test par défaut
    const defaultImagePath = path.join(profilesDir, 'default.jpg');
    if (!fs.existsSync(defaultImagePath)) {
      // Créer un fichier placeholder pour l'image par défaut
      fs.writeFileSync(defaultImagePath, 'placeholder');
      console.log('✅ Image par défaut créée');
    }
    
    console.log('\n📋 Configuration des dossiers:');
    console.log('- Dossier uploads:', uploadsDir);
    console.log('- Dossier profiles:', profilesDir);
    console.log('- Image par défaut:', defaultImagePath);
    
    console.log('\n🌐 URLs d\'accès:');
    console.log('- Serveur statique: http://localhost:5003/uploads/');
    console.log('- Photos profil: http://localhost:5003/uploads/profiles/');
    
    console.log('\n✅ Configuration d\'upload de photos prête!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testPhotoUpload();
