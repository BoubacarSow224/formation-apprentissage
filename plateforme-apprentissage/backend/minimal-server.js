require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware de base
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.send('API de test fonctionnelle');
});

// Connexion à la base de données
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage')
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur de test démarré sur le port ${PORT}`);
});
