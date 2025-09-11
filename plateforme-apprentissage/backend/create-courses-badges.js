const mongoose = require('mongoose');
const User = require('./models/User');
const Cours = require('./models/Cours');
const Badge = require('./models/Badge');
require('dotenv').config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage');
    console.log('MongoDB connecté');
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Créer des cours et badges de test
const createCoursesAndBadges = async () => {
  try {
    await connectDB();

    // Trouver un formateur (ou créer un formateur de test)
    let formateur = await User.findOne({ role: 'formateur' });
    if (!formateur) {
      // Créer un formateur de test
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('formateur123', salt);
      
      formateur = new User({
        nom: 'Jean Formateur',
        email: 'formateur@plateforme.com',
        password: hashedPassword,
        role: 'formateur',
        telephone: '+221 77 987 65 43',
        bio: 'Formateur expérimenté en développement web et mécanique',
        competences: ['JavaScript', 'React', 'Node.js', 'Mécanique automobile'],
        langues: ['Français', 'Anglais'],
        statut: 'actif'
      });
      await formateur.save();
      console.log('✅ Formateur créé: formateur@plateforme.com / formateur123');
    }

    // Données des cours
    const coursData = [
      {
        titre: 'Introduction au Développement Web',
        description: 'Apprenez les bases du développement web avec HTML, CSS et JavaScript',
        categorie: 'informatique',
        niveau: 'débutant',
        langue: 'fr',
        tags: ['html', 'css', 'javascript', 'web'],
        prerequis: ['Connaissances de base en informatique'],
        objectifs: [
          'Comprendre la structure HTML',
          'Styliser avec CSS',
          'Ajouter de l\'interactivité avec JavaScript',
          'Créer une page web complète'
        ],
        estPublic: true,
        estApprouve: true,
        statutModeration: 'approuve',
        etapes: [
          {
            titre: 'Introduction à HTML',
            description: 'Découvrez les balises HTML de base',
            contenu: {
              texte: 'HTML (HyperText Markup Language) est le langage de balisage standard pour créer des pages web...',
              images: ['html-structure.jpg']
            },
            dureeEstimee: 30,
            ordre: 1
          },
          {
            titre: 'Stylisation avec CSS',
            description: 'Apprenez à styliser vos pages web',
            contenu: {
              texte: 'CSS (Cascading Style Sheets) permet de styliser et de mettre en forme vos pages HTML...',
              images: ['css-example.jpg']
            },
            dureeEstimee: 45,
            ordre: 2
          },
          {
            titre: 'Interactivité avec JavaScript',
            description: 'Ajoutez de l\'interactivité à vos pages',
            contenu: {
              texte: 'JavaScript est un langage de programmation qui permet d\'ajouter de l\'interactivité...',
              images: ['js-example.jpg']
            },
            dureeEstimee: 60,
            ordre: 3
          }
        ]
      },
      {
        titre: 'Mécanique Automobile - Niveau Débutant',
        description: 'Apprenez les bases de la mécanique automobile',
        categorie: 'mecanique',
        niveau: 'débutant',
        langue: 'fr',
        tags: ['mécanique', 'automobile', 'moteur', 'entretien'],
        prerequis: ['Aucun prérequis'],
        objectifs: [
          'Comprendre le fonctionnement d\'un moteur',
          'Effectuer la vidange',
          'Changer les plaquettes de frein',
          'Diagnostiquer les pannes courantes'
        ],
        estPublic: true,
        estApprouve: true,
        statutModeration: 'approuve',
        etapes: [
          {
            titre: 'Fonctionnement du moteur',
            description: 'Comprendre les bases du moteur à combustion',
            contenu: {
              texte: 'Un moteur à combustion interne fonctionne selon le principe des quatre temps...',
              images: ['moteur-4temps.jpg'],
              video: 'moteur-fonctionnement.mp4'
            },
            dureeEstimee: 40,
            ordre: 1
          },
          {
            titre: 'Vidange moteur',
            description: 'Apprendre à faire la vidange',
            contenu: {
              texte: 'La vidange est une opération d\'entretien essentielle pour préserver votre moteur...',
              images: ['vidange-etapes.jpg'],
              video: 'vidange-tutorial.mp4'
            },
            dureeEstimee: 35,
            ordre: 2
          }
        ]
      },
      {
        titre: 'Couture - Techniques de Base',
        description: 'Maîtrisez les techniques fondamentales de la couture',
        categorie: 'couture',
        niveau: 'débutant',
        langue: 'fr',
        tags: ['couture', 'textile', 'machine', 'patron'],
        prerequis: ['Aucun prérequis'],
        objectifs: [
          'Utiliser une machine à coudre',
          'Lire un patron',
          'Réaliser des coutures droites',
          'Coudre un vêtement simple'
        ],
        estPublic: true,
        estApprouve: true,
        statutModeration: 'approuve',
        etapes: [
          {
            titre: 'Prise en main de la machine',
            description: 'Apprendre à utiliser une machine à coudre',
            contenu: {
              texte: 'Une machine à coudre est composée de plusieurs éléments essentiels...',
              images: ['machine-couture.jpg'],
              video: 'machine-tutorial.mp4'
            },
            dureeEstimee: 25,
            ordre: 1
          },
          {
            titre: 'Lecture de patron',
            description: 'Comprendre et utiliser les patrons de couture',
            contenu: {
              texte: 'Un patron de couture est un modèle en papier qui sert de guide...',
              images: ['patron-exemple.jpg']
            },
            dureeEstimee: 30,
            ordre: 2
          }
        ]
      }
    ];

    // Créer les cours
    const coursCreated = [];
    for (const coursInfo of coursData) {
      const existingCours = await Cours.findOne({ titre: coursInfo.titre });
      if (!existingCours) {
        const cours = new Cours({
          ...coursInfo,
          formateur: formateur._id
        });
        await cours.save();
        coursCreated.push(cours);
        console.log(`✅ Cours créé: ${cours.titre}`);
      } else {
        coursCreated.push(existingCours);
        console.log(`ℹ️  Cours existe déjà: ${existingCours.titre}`);
      }
    }

    // Données des badges
    const badgeData = [
      {
        nom: 'Développeur Web Débutant',
        description: 'Badge obtenu après avoir complété le cours d\'introduction au développement web',
        image: 'badge-web-debutant.png',
        niveau: 'bronze',
        competencesValidees: ['HTML', 'CSS', 'JavaScript'],
        criteresObtention: 'Compléter toutes les étapes du cours et réussir le quiz final avec 80% minimum',
        estActif: true,
        estValide: true
      },
      {
        nom: 'Mécanicien Automobile Novice',
        description: 'Badge obtenu après avoir maîtrisé les bases de la mécanique automobile',
        image: 'badge-mecanique-novice.png',
        niveau: 'bronze',
        competencesValidees: ['Vidange moteur', 'Diagnostic de base', 'Entretien préventif'],
        criteresObtention: 'Compléter le cours de mécanique et démontrer les compétences pratiques',
        estActif: true,
        estValide: true
      },
      {
        nom: 'Couturier Débutant',
        description: 'Badge obtenu après avoir appris les techniques de base de la couture',
        image: 'badge-couture-debutant.png',
        niveau: 'bronze',
        competencesValidees: ['Machine à coudre', 'Lecture de patron', 'Coutures droites'],
        criteresObtention: 'Réaliser un projet de couture simple et maîtriser les techniques de base',
        estActif: true,
        estValide: true
      },
      {
        nom: 'Expert Développement Web',
        description: 'Badge avancé pour les développeurs web expérimentés',
        image: 'badge-web-expert.png',
        niveau: 'or',
        competencesValidees: ['React', 'Node.js', 'Base de données', 'API REST'],
        criteresObtention: 'Compléter plusieurs cours avancés et réaliser un projet complet',
        estActif: true,
        estValide: true
      }
    ];

    // Créer les badges
    for (let i = 0; i < badgeData.length; i++) {
      const badgeInfo = badgeData[i];
      const existingBadge = await Badge.findOne({ nom: badgeInfo.nom });
      
      if (!existingBadge) {
        const badge = new Badge({
          ...badgeInfo,
          cours: coursCreated[i % coursCreated.length]._id // Associer aux cours créés
        });
        
        // Générer un QR code
        await badge.genererQRCode();
        
        console.log(`✅ Badge créé: ${badge.nom}`);
      } else {
        console.log(`ℹ️  Badge existe déjà: ${existingBadge.nom}`);
      }
    }

    console.log('\n🎉 Création des cours et badges terminée !');
    console.log('\n📚 Cours disponibles:');
    const allCours = await Cours.find().populate('formateur', 'nom email');
    allCours.forEach(cours => {
      console.log(`- ${cours.titre} (${cours.categorie}) - ${cours.etapes.length} étapes`);
    });

    console.log('\n🏆 Badges disponibles:');
    const allBadges = await Badge.find().populate('cours', 'titre');
    allBadges.forEach(badge => {
      console.log(`- ${badge.nom} (${badge.niveau}) - Cours: ${badge.cours.titre}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Exécuter le script
createCoursesAndBadges();
