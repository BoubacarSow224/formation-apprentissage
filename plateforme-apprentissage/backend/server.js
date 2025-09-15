console.log('Démarrage du serveur...');
console.log('Chargement des dépendances...');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const fileupload = require('express-fileupload');
console.log('Dépendances chargées avec succès.');

// Charger les variables d'environnement
console.log('Chargement des variables d\'environnement...');
dotenv.config({ path: path.join(__dirname, '.env') });
console.log('Variables d\'environnement chargées.');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Importer les routes
console.log('Chargement des routes...');
const authRoutes = require('./routes/authRoutes');
console.log('Route authRoutes chargée');
const coursRoutes = require('./routes/coursRoutes');
console.log('Route coursRoutes chargée');
const badgeRoutes = require('./routes/badgeRoutes');
console.log('Route badgeRoutes chargée');
const offreEmploiRoutes = require('./routes/offreEmploiRoutes');
console.log('Route offreEmploiRoutes chargée');
const conversationRoutes = require('./routes/conversationRoutes');
console.log('Route conversationRoutes chargée');
const messageRoutes = require('./routes/messageRoutes');
console.log('Route messageRoutes chargée');
const quizRoutes = require('./routes/quizRoutes');
console.log('Route quizRoutes chargée');

// Importer les middlewares d'erreur
const { errorHandler, notFound } = require('./middleware/error');

// Initialiser l'application Express
console.log('Initialisation de l\'application Express...');
const app = express();
console.log('Application Express initialisée');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, process.env.UPLOAD_PATH || 'uploads');
if (!require('fs').existsSync(uploadDir)) {
  require('fs').mkdirSync(uploadDir, { recursive: true });
}

// Middleware de sécurité
console.log('Configuration CORS...');
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:60695'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
})); // Active CORS avec configuration spécifique
console.log('CORS configuré');
app.use(helmet()); // Sécurise les en-têtes HTTP
console.log('Helmet configuré');
app.use(express.json({ limit: '10mb' })); // Limite la taille du corps des requêtes
console.log('Middleware JSON configuré');
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('Middleware URL-encoded configuré');
app.use(mongoSanitize()); // Évite l'injection NoSQL
console.log('Mongo Sanitize configuré');
app.use(xss()); // Protège contre les attaques XSS
console.log('XSS Clean configuré');
app.use(hpp()); // Protège contre la pollution des paramètres HTTP
console.log('HPP configuré');

// Middleware pour le téléchargement de fichiers
console.log('Configuration du middleware de téléchargement de fichiers...');
app.use(fileupload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
  abortOnLimit: true,
  responseOnLimit: 'La taille du fichier dépasse la limite autorisée (10MB)'
}));
console.log('Middleware de téléchargement de fichiers configuré');

// Middleware pour servir les fichiers statiques
console.log('Configuration du middleware pour servir les fichiers statiques...');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Service de fichiers statiques configuré');

// Limiter le nombre de requêtes (désactivé en développement, appliqué sélectivement en production)
console.log('Configuration du rate limiting...');
const isDev = (process.env.NODE_ENV || 'development') === 'development';
let limiter;
if (!isDev) {
  limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // augmente la limite pour les endpoints publics
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.'
  });
  // Appliquer le limiter uniquement sur des routes sensibles
  app.use('/api/auth', limiter);
  app.use('/api/admin', limiter);
  app.use('/api/messages', limiter);
  app.use('/api/conversations', limiter);
  console.log('Rate limiting activé (production)');
} else {
  console.log('Rate limiting désactivé en développement');
}

// Connexion à la base de données
console.log('Connexion à la base de données...');
const connectDB = require('./config/db');
connectDB().then(() => {
  console.log('Connexion à la base de données établie');
}).catch(err => {
  console.error('Erreur de connexion à la base de données:', err);
});

// Routes
console.log('Configuration des routes...');
app.get('/', (req, res) => {
  console.log('Requête reçue sur la route /');
  res.send('Bienvenue sur l\'API de la plateforme d\'apprentissage communautaire');
});

// Utiliser les routes
console.log('Configuration de la route /api/auth...');
app.use('/api/auth', authRoutes);
console.log('Route /api/auth configurée');

console.log('Configuration de la route /api/cours...');
app.use('/api/cours', coursRoutes);
console.log('Route /api/cours configurée');

console.log('Configuration de la route /api/badges...');
app.use('/api/badges', badgeRoutes);
console.log('Route /api/badges configurée');

console.log('Configuration de la route /api/offres-emploi...');
app.use('/api/offres-emploi', offreEmploiRoutes);
console.log('Route /api/offres-emploi configurée');

console.log('Configuration de la route /api/conversations...');
app.use('/api/conversations', conversationRoutes);
console.log('Route /api/conversations configurée');

console.log('Configuration de la route /api/messages...');
app.use('/api/messages', messageRoutes);
console.log('Route /api/messages configurée');

console.log('Configuration de la route /api/community...');
const communityRoutes = require('./routes/communityRoutes');
app.use('/api/community', communityRoutes);
console.log('Route /api/community configurée');

console.log('Configuration de la route /api/quiz...');
app.use('/api/quiz', quizRoutes);
console.log('Route /api/quiz configurée');

console.log('Configuration de la route /api/admin...');
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
console.log('Route /api/admin configurée');

console.log('Configuration de la route /api/moderation...');
const moderationRoutes = require('./routes/moderationRoutes');
app.use('/api/moderation', moderationRoutes);
console.log('Route /api/moderation configurée');

console.log('Configuration de la route /api/certificats...');
const certificatRoutes = require('./routes/certificatRoutes');
app.use('/api/certificats', certificatRoutes);
console.log('Route /api/certificats configurée');

console.log('Configuration de la route /api/groupes...');
const groupeRoutes = require('./routes/groupeRoutes');
app.use('/api/groupes', groupeRoutes);
console.log('Route /api/groupes configurée');

console.log('Configuration de la route /api/study...');
const studyRoutes = require('./routes/studyRoutes');
app.use('/api/study', studyRoutes);
console.log('Route /api/study configurée');

// Gestion des erreurs
console.log('Configuration des gestionnaires d\'erreurs...');
app.use(notFound); // Gestion des routes non trouvées
console.log('Middleware notFound configuré');
app.use(errorHandler); // Gestion des erreurs globales
console.log('Middleware errorHandler configuré');

// Configuration du port
const PORT = process.env.PORT || 5006;
console.log('Port du serveur:', PORT);

// Démarrer le serveur
console.log('Démarrage du serveur...');
const server = app.listen(PORT, () => {
  console.log(`Serveur démarré en mode ${process.env.NODE_ENV} sur le port ${PORT}`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err, promise) => {
  console.error(`Erreur: ${err.message}`);
  // Fermer le serveur et quitter le processus
  server.close(() => process.exit(1));
});
