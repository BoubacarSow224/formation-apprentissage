const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage';

const DEFAULT_USERS = [
  {
    nom: 'Administrateur',
    email: 'admin@example.com',
    telephone: '+221000000000',
    password: 'admin123',
    role: 'admin',
  },
  {
    nom: 'Formateur Démo',
    email: 'formateur@example.com',
    telephone: '+221000000001',
    password: 'formateur123',
    role: 'formateur',
  },
  {
    nom: 'Apprenant Démo',
    email: 'apprenant@example.com',
    telephone: '+221000000002',
    password: 'apprenant123',
    role: 'apprenant',
  },
];

async function upsertUser({ nom, email, telephone, password, role }) {
  let user = await User.findOne({ email: email.toLowerCase().trim() });
  if (user) {
    // Mettre à jour les champs de base et réinitialiser le mot de passe (hash via pre-save)
    user.nom = nom;
    user.telephone = telephone;
    user.role = role;
    user.estActif = true;
    user.password = password; // sera hashé par le pre('save')
    await user.save();
    return { action: 'updated', user };
  } else {
    user = await User.create({ nom, email, telephone, password, role });
    return { action: 'created', user };
  }
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB:', MONGODB_URI);

    for (const u of DEFAULT_USERS) {
      const { action, user } = await upsertUser(u);
      console.log(`➡️  ${action.toUpperCase()} | ${user.role} | ${user.email} | téléphone: ${user.telephone}`);
    }

    console.log('\nComptes par défaut configurés:');
    console.log('- Admin:    admin@example.com / admin123');
    console.log('- Formateur: formateur@example.com / formateur123');
    console.log('- Apprenant: apprenant@example.com / apprenant123');
  } catch (err) {
    console.error('❌ Erreur lors de la configuration des utilisateurs:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Déconnexion MongoDB');
  }
}

run();
