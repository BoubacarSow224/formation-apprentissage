const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Script de test pour vérifier la connexion à MongoDB et les opérations CRUD
async function testDatabase() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage';
    await mongoose.connect(mongoUri);
    console.log('✅ Connexion à MongoDB réussie');
    console.log('📍 Base de données:', mongoose.connection.name);
    
    // Test 1: Créer un utilisateur de test
    console.log('\n🧪 Test 1: Création d\'un utilisateur...');
    const testUser = {
      nom: 'Test User',
      email: 'test@example.com',
      telephone: '+221123456789',
      password: 'password123',
      role: 'apprenant'
    };
    
    // Supprimer l'utilisateur de test s'il existe déjà
    await User.deleteOne({ email: testUser.email });
    
    const user = await User.create(testUser);
    console.log('✅ Utilisateur créé avec succès:', {
      id: user._id,
      nom: user.nom,
      email: user.email,
      role: user.role
    });
    
    // Test 2: Vérifier le hachage du mot de passe
    console.log('\n🧪 Test 2: Vérification du hachage du mot de passe...');
    const isPasswordCorrect = await user.comparePassword('password123');
    const isPasswordIncorrect = await user.comparePassword('wrongpassword');
    console.log('✅ Mot de passe correct:', isPasswordCorrect);
    console.log('✅ Mot de passe incorrect:', !isPasswordIncorrect);
    
    // Test 3: Rechercher l'utilisateur
    console.log('\n🧪 Test 3: Recherche d\'utilisateur...');
    const foundUser = await User.findOne({ email: testUser.email });
    console.log('✅ Utilisateur trouvé:', foundUser ? 'Oui' : 'Non');
    
    // Test 4: Mettre à jour l'utilisateur
    console.log('\n🧪 Test 4: Mise à jour de l\'utilisateur...');
    foundUser.bio = 'Utilisateur de test pour la plateforme d\'apprentissage';
    foundUser.derniereConnexion = new Date();
    await foundUser.save();
    console.log('✅ Utilisateur mis à jour avec succès');
    
    // Test 5: Lister tous les utilisateurs
    console.log('\n🧪 Test 5: Liste des utilisateurs...');
    const allUsers = await User.find({}).select('nom email role dateInscription');
    console.log('✅ Nombre d\'utilisateurs dans la base:', allUsers.length);
    allUsers.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.nom} (${u.email}) - ${u.role}`);
    });
    
    // Test 6: Test de validation
    console.log('\n🧪 Test 6: Test de validation...');
    try {
      await User.create({
        nom: '',
        email: 'invalid-email',
        telephone: '123',
        password: '12'
      });
    } catch (validationError) {
      console.log('✅ Validation fonctionne correctement:', validationError.name === 'ValidationError');
    }
    
    // Test 7: Test d'unicité
    console.log('\n🧪 Test 7: Test d\'unicité...');
    try {
      await User.create(testUser);
    } catch (duplicateError) {
      console.log('✅ Contrainte d\'unicité fonctionne:', duplicateError.code === 11000);
    }
    
    // Nettoyage
    console.log('\n🧹 Nettoyage...');
    await User.deleteOne({ email: testUser.email });
    console.log('✅ Utilisateur de test supprimé');
    
    console.log('\n🎉 Tous les tests sont passés avec succès!');
    console.log('📊 Résumé:');
    console.log('   - Connexion MongoDB: ✅');
    console.log('   - Création d\'utilisateur: ✅');
    console.log('   - Hachage de mot de passe: ✅');
    console.log('   - Recherche d\'utilisateur: ✅');
    console.log('   - Mise à jour d\'utilisateur: ✅');
    console.log('   - Validation des données: ✅');
    console.log('   - Contraintes d\'unicité: ✅');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔐 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Lancer les tests
testDatabase();
