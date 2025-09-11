const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Test de connexion à l\'API...');
    
    // Test de connexion simple
    const healthResponse = await axios.get('http://localhost:5003/');
    console.log('✅ Serveur accessible:', healthResponse.status);
    
    // Test de login admin
    console.log('\n🔐 Test de connexion admin...');
    const loginData = {
      email: 'admin@plateforme.com',
      password: 'SuperAdmin2024!'
    };
    
    const loginResponse = await axios.post('http://localhost:5003/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Connexion réussie:', loginResponse.data);
    
    // Test de register avec un email unique
    console.log('\n📝 Test d\'inscription utilisateur...');
    const timestamp = Date.now();
    const registerData = {
      nom: 'Test User',
      email: `test${timestamp}@example.com`,
      telephone: `22177${timestamp.toString().slice(-7)}`,
      password: 'test123456',
      role: 'apprenant'
    };
    
    const registerResponse = await axios.post('http://localhost:5003/api/auth/register', registerData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Inscription réussie:', registerResponse.data);
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

testAPI();
