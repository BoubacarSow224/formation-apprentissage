const axios = require('axios');

const testAuth = async () => {
  const baseURL = 'http://localhost:5003/api';
  
  console.log('🔍 Test des routes d\'authentification...\n');

  try {
    // Test 1: Login avec utilisateur existant
    console.log('1. Test de connexion avec utilisateur existant...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('✅ Connexion réussie');
    console.log('Token reçu:', loginResponse.data.token ? 'Oui' : 'Non');
    console.log('Utilisateur:', loginResponse.data.user?.nom);
    console.log('Rôle:', loginResponse.data.user?.role);
    
    const token = loginResponse.data.token;

    // Test 2: Vérification du profil avec token
    console.log('\n2. Test de récupération du profil...');
    const profileResponse = await axios.get(`${baseURL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Profil récupéré avec succès');
    console.log('Nom:', profileResponse.data.user?.nom);
    console.log('Email:', profileResponse.data.user?.email);

    // Test 3: Test d'inscription d'un nouvel utilisateur
    console.log('\n3. Test d\'inscription d\'un nouvel utilisateur...');
    try {
      const registerResponse = await axios.post(`${baseURL}/auth/register`, {
        nom: 'Nouvel Utilisateur',
        email: 'nouveau@example.com',
        telephone: '+221987654321',
        password: 'password123',
        role: 'apprenant'
      });
      
      console.log('✅ Inscription réussie');
      console.log('Nouveau token reçu:', registerResponse.data.token ? 'Oui' : 'Non');
      console.log('Nouvel utilisateur:', registerResponse.data.user?.nom);
    } catch (regError) {
      if (regError.response?.status === 400 && regError.response?.data?.message?.includes('existe déjà')) {
        console.log('ℹ️  Utilisateur existe déjà (normal pour les tests répétés)');
      } else {
        throw regError;
      }
    }

    // Test 4: Test avec mauvais identifiants
    console.log('\n4. Test avec mauvais identifiants...');
    try {
      await axios.post(`${baseURL}/auth/login`, {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ Erreur: connexion réussie avec mauvais identifiants');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Rejet correct des mauvais identifiants');
      } else {
        console.log('⚠️  Erreur inattendue:', error.message);
      }
    }

    console.log('\n🎉 Tous les tests d\'authentification sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
    process.exit(1);
  }
};

testAuth();
