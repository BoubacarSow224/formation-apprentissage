const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5003;

// Middleware
app.use(cors());
app.use(express.json());

// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Serveur backend fonctionnel !', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Route de test pour l'authentification
app.post('/api/auth/login', (req, res) => {
  console.log('Tentative de connexion:', req.body);
  res.json({
    success: true,
    token: 'test-token-123',
    user: {
      _id: '123',
      nom: 'Test User',
      email: req.body.email,
      role: 'admin'
    }
  });
});

// Route de test pour l'inscription
app.post('/api/auth/register', (req, res) => {
  console.log('Tentative d\'inscription:', req.body);
  res.json({
    success: true,
    token: 'test-token-456',
    user: {
      _id: '456',
      nom: req.body.nom,
      email: req.body.email,
      role: req.body.role || 'apprenant'
    }
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🔗 Test: http://localhost:${PORT}/api/test`);
});

// Gestion des erreurs
process.on('uncaughtException', (err) => {
  console.error('Erreur non gérée:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse rejetée:', reason);
});
