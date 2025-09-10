const mongoose = require('mongoose');
const User = require('../models/User');
const Cours = require('../models/Cours');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

const createTestUsers = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    // Supprimer les utilisateurs de test existants (sauf admin)
    await User.deleteMany({ 
      email: { 
        $in: ['formateur@test.com', 'apprenant@test.com', 'formateur2@test.com', 'apprenant2@test.com'] 
      } 
    });

    // Créer des utilisateurs de test
    const testUsers = [
      {
        nom: 'Marie Diallo',
        email: 'formateur@test.com',
        telephone: '+221701234567',
        password: 'formateur123',
        role: 'formateur',
        bio: 'Formatrice experte en couture traditionnelle sénégalaise',
        competences: ['Couture', 'Design', 'Formation'],
        langues: ['fr', 'wo'],
        evaluationMoyenne: 4.5
      },
      {
        nom: 'Amadou Ba',
        email: 'formateur2@test.com',
        telephone: '+221702345678',
        password: 'formateur123',
        role: 'formateur',
        bio: 'Formateur en mécanique automobile avec 10 ans d\'expérience',
        competences: ['Mécanique', 'Électronique auto', 'Diagnostic'],
        langues: ['fr', 'wo'],
        evaluationMoyenne: 4.2
      },
      {
        nom: 'Fatou Sall',
        email: 'apprenant@test.com',
        telephone: '+221703456789',
        password: 'apprenant123',
        role: 'apprenant',
        bio: 'Étudiante passionnée par l\'apprentissage de nouveaux métiers',
        competences: ['Motivation', 'Apprentissage rapide'],
        langues: ['fr', 'wo']
      },
      {
        nom: 'Ibrahima Ndiaye',
        email: 'apprenant2@test.com',
        telephone: '+221704567890',
        password: 'apprenant123',
        role: 'apprenant',
        bio: 'Jeune entrepreneur cherchant à acquérir de nouvelles compétences',
        competences: ['Entrepreneuriat', 'Commerce'],
        langues: ['fr', 'wo', 'ln']
      }
    ];

    const createdUsers = await User.insertMany(testUsers);
    console.log('Utilisateurs de test créés avec succès !');

    // Créer quelques cours de test
    const formateur1 = createdUsers.find(u => u.email === 'formateur@test.com');
    const formateur2 = createdUsers.find(u => u.email === 'formateur2@test.com');

    const testCours = [
      {
        titre: 'Initiation à la couture moderne',
        description: 'Apprenez les bases de la couture avec des techniques modernes et traditionnelles.',
        formateur: formateur1._id,
        categorie: 'couture',
        niveau: 'débutant',
        langue: 'fr',
        etapes: [
          {
            titre: 'Introduction aux outils',
            description: 'Découverte des outils de base',
            contenu: {
              texte: 'Dans cette première étape, nous allons découvrir les outils essentiels...',
              video: 'intro-outils.mp4'
            },
            dureeEstimee: 15,
            ordre: 1
          },
          {
            titre: 'Premiers points',
            description: 'Apprendre les points de base',
            contenu: {
              texte: 'Les points de base sont la fondation de tout travail de couture...',
              video: 'premiers-points.mp4'
            },
            dureeEstimee: 30,
            ordre: 2
          }
        ],
        tags: ['couture', 'débutant', 'artisanat'],
        objectifs: ['Maîtriser les outils de base', 'Réaliser des points simples'],
        statutModeration: 'en_attente'
      },
      {
        titre: 'Mécanique automobile - Diagnostic moteur',
        description: 'Formation complète sur le diagnostic des pannes moteur.',
        formateur: formateur2._id,
        categorie: 'mecanique',
        niveau: 'intermédiaire',
        langue: 'fr',
        etapes: [
          {
            titre: 'Outils de diagnostic',
            description: 'Présentation des outils de diagnostic',
            contenu: {
              texte: 'Les outils de diagnostic modernes permettent...',
              video: 'outils-diagnostic.mp4'
            },
            dureeEstimee: 20,
            ordre: 1
          }
        ],
        tags: ['mécanique', 'automobile', 'diagnostic'],
        objectifs: ['Utiliser les outils de diagnostic', 'Identifier les pannes courantes'],
        statutModeration: 'approuve',
        estApprouve: true,
        estPublic: true
      },
      {
        titre: 'Couture avancée - Robes traditionnelles',
        description: 'Création de robes traditionnelles sénégalaises.',
        formateur: formateur1._id,
        categorie: 'couture',
        niveau: 'avancé',
        langue: 'wo',
        etapes: [
          {
            titre: 'Choix des tissus',
            description: 'Sélection des tissus traditionnels',
            contenu: {
              texte: 'Le choix du tissu est crucial pour une robe traditionnelle...'
            },
            dureeEstimee: 25,
            ordre: 1
          }
        ],
        tags: ['couture', 'traditionnel', 'avancé'],
        objectifs: ['Créer une robe traditionnelle complète'],
        statutModeration: 'rejete',
        commentaireModeration: 'Contenu insuffisant, merci d\'ajouter plus d\'étapes détaillées'
      }
    ];

    await Cours.insertMany(testCours);
    console.log('Cours de test créés avec succès !');

    // Mettre à jour les formateurs avec leurs cours
    await User.findByIdAndUpdate(formateur1._id, {
      $push: { coursCrees: { $each: testCours.filter(c => c.formateur.equals(formateur1._id)).map(c => c._id) } }
    });

    await User.findByIdAndUpdate(formateur2._id, {
      $push: { coursCrees: { $each: testCours.filter(c => c.formateur.equals(formateur2._id)).map(c => c._id) } }
    });

    console.log('\n=== UTILISATEURS DE TEST CRÉÉS ===');
    console.log('👑 Admin: admin@plateforme.com / admin123456');
    console.log('👨‍🏫 Formateur 1: formateur@test.com / formateur123 (Marie Diallo)');
    console.log('👨‍🏫 Formateur 2: formateur2@test.com / formateur123 (Amadou Ba)');
    console.log('👨‍🎓 Apprenant 1: apprenant@test.com / apprenant123 (Fatou Sall)');
    console.log('👨‍🎓 Apprenant 2: apprenant2@test.com / apprenant123 (Ibrahima Ndiaye)');
    console.log('\n=== COURS DE TEST CRÉÉS ===');
    console.log('📚 3 cours avec différents statuts de modération');
    console.log('✅ Données prêtes pour tester le dashboard admin !');

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création des utilisateurs de test:', error);
    process.exit(1);
  }
};

// Exécuter le script
createTestUsers();
