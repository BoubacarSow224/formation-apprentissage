const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const PORT = 5001;
const MONGODB_URI = 'mongodb+srv://boubacar:tontonsow@cluster0.lrzxpgc.mongodb.net/plateforme-apprentissage-wist';
const JWT_SECRET = 'votre_super_secret_jwt_pour_la_plateforme';

// Modèle User simplifié
const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telephone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'apprenant' },
  dateInscription: { type: Date, default: Date.now }
});

// Hash password avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API Plateforme d\'apprentissage - Serveur actif' });
});

// Route d'inscription
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Inscription - Données reçues:', req.body);
    const { nom, email, telephone, password, role } = req.body;

    // Vérifier si l'utilisateur existe
    const userExists = await User.findOne({ 
      $or: [{ email }, { telephone }] 
    });
    
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Un utilisateur avec cet email ou téléphone existe déjà' 
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      nom,
      email,
      telephone,
      password,
      role: role || 'apprenant'
    });

    // Générer le token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    console.log('Utilisateur créé avec succès:', user.email);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message 
    });
  }
});

// Route de connexion
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Connexion - Données reçues:', req.body);
    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Générer le token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    console.log('Connexion réussie pour:', user.email);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message 
    });
  }
});

// Route pour lister les utilisateurs (pour debug)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message 
    });
  }
});

// Connexion à MongoDB et démarrage du serveur
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connexion à MongoDB réussie');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log('📝 Routes disponibles:');
      console.log('   GET  / - Page d\'accueil API');
      console.log('   POST /api/auth/register - Inscription');
      console.log('   POST /api/auth/login - Connexion');
      console.log('   GET  /api/users - Liste des utilisateurs');
    });
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
    console.log('💡 Assurez-vous que MongoDB est installé et démarré:');
    console.log('   - Windows: Démarrer le service MongoDB');
    console.log('   - Mac/Linux: mongod');
  });
