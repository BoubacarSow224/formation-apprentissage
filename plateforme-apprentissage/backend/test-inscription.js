const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Script pour tester l'inscription directe en base de données
async function testInscription() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage';
    await mongoose.connect(mongoUri);
    console.log('✅ Connexion à MongoDB réussie');
    
    // Données d'inscription test
    const userData = {
      nom: 'Utilisateur Test',
      email: 'test.inscription@example.com',
      telephone: '+221987654321',
      password: 'motdepasse123',
      role: 'apprenant'
    };
    
    console.log('\n📝 Test d\'inscription avec les données:');
    console.log('Nom:', userData.nom);
    console.log('Email:', userData.email);
    console.log('Téléphone:', userData.telephone);
    console.log('Rôle:', userData.role);
    
    // Supprimer l'utilisateur s'il existe déjà
    await User.deleteOne({ email: userData.email });
    console.log('🧹 Nettoyage des données existantes...');
    
    // Test d'inscription
    console.log('\n🚀 Création de l\'utilisateur...');
    const newUser = await User.create(userData);
    
    console.log('✅ Utilisateur créé avec succès!');
    console.log('ID:', newUser._id);
    console.log('Nom:', newUser.nom);
    console.log('Email:', newUser.email);
    console.log('Téléphone:', newUser.telephone);
    console.log('Rôle:', newUser.role);
    console.log('Date d\'inscription:', newUser.dateInscription);
    console.log('Compte actif:', newUser.estActif);
    
    // Vérifier le hachage du mot de passe
    console.log('\n🔐 Test de vérification du mot de passe...');
    const isPasswordValid = await newUser.comparePassword('motdepasse123');
    console.log('Mot de passe correct:', isPasswordValid ? '✅' : '❌');
    
    // Test de recherche
    console.log('\n🔍 Test de recherche utilisateur...');
    const foundUser = await User.findOne({ email: userData.email });
    console.log('Utilisateur trouvé:', foundUser ? '✅' : '❌');
    
    // Afficher tous les utilisateurs
    console.log('\n👥 Liste de tous les utilisateurs:');
    const allUsers = await User.find({}).select('nom email role dateInscription');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nom} (${user.email}) - ${user.role} - ${user.dateInscription.toLocaleDateString()}`);
    });
    
    console.log('\n🎉 Test d\'inscription réussi!');
    console.log('L\'utilisateur a été enregistré directement dans la base de données MongoDB.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'inscription:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('Erreurs de validation:');
      Object.values(error.errors).forEach(err => {
        console.error(`- ${err.path}: ${err.message}`);
      });
    }
    
    if (error.code === 11000) {
      console.error('Erreur de duplication:', Object.keys(error.keyValue));
    }
    
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Connexion fermée');
    process.exit(0);
  }
}

// Fonction pour tester l'API d'inscription
async function testInscriptionAPI() {
  const axios = require('axios');
  
  try {
    console.log('\n🌐 Test de l\'API d\'inscription...');
    
    const userData = {
      nom: 'Test API User',
      email: 'test.api@example.com',
      telephone: '+221123456789',
      password: 'password123',
      role: 'apprenant'
    };
    
    const response = await axios.post('http://localhost:5003/api/auth/register', userData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ Réponse API reçue:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    console.log('Utilisateur créé:', response.data.user);
    
  } catch (error) {
    console.error('❌ Erreur API:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Le serveur backend n\'est pas démarré sur le port 5003');
      console.error('   Démarrez le serveur avec: npm start dans le dossier backend');
    }
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Exécuter les tests
console.log('🧪 TESTS D\'INSCRIPTION');
console.log('====================');

testInscription().then(() => {
  testInscriptionAPI();
});
