const mongoose = require('mongoose');
const User = require('./models/User');
const Cours = require('./models/Cours');
require('dotenv').config();

// Script pour tester le chargement des données du dashboard
async function testDashboardData() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plateforme-apprentissage';
    await mongoose.connect(mongoUri);
    console.log('✅ Connexion MongoDB établie');
    
    // Créer un formateur de test
    console.log('\n👨‍🏫 Création d\'un formateur de test...');
    await User.deleteOne({ email: 'formateur.test@example.com' });
    
    const formateur = await User.create({
      nom: 'Formateur Dashboard Test',
      email: 'formateur.test@example.com',
      telephone: '+221777888999',
      password: 'test123',
      role: 'formateur'
    });
    
    console.log('✅ Formateur créé:', formateur._id);
    
    // Créer quelques cours de test
    console.log('\n📚 Création de cours de test...');
    await Cours.deleteMany({ formateur: formateur._id });
    
    const cours1 = await Cours.create({
      titre: 'Introduction à JavaScript',
      description: 'Cours de base en JavaScript',
      formateur: formateur._id,
      niveau: 'debutant',
      prix: 50,
      duree: 10,
      modules: [],
      etudiants: []
    });
    
    const cours2 = await Cours.create({
      titre: 'React Avancé',
      description: 'Cours avancé sur React',
      formateur: formateur._id,
      niveau: 'avance',
      prix: 100,
      duree: 20,
      modules: [],
      etudiants: []
    });
    
    console.log('✅ Cours créés:', cours1._id, cours2._id);
    
    // Test des statistiques
    console.log('\n📊 Test des statistiques formateur...');
    const coursCreated = await Cours.countDocuments({ formateur: formateur._id });
    console.log('Nombre de cours créés:', coursCreated);
    
    // Test de récupération des cours récents
    console.log('\n📋 Test des cours récents...');
    const coursRecents = await Cours.find({ formateur: formateur._id })
      .sort({ dateCreation: -1 })
      .limit(5)
      .select('titre description niveau prix dateCreation');
    
    console.log('Cours récents trouvés:', coursRecents.length);
    coursRecents.forEach((c, index) => {
      console.log(`${index + 1}. ${c.titre} - ${c.niveau} - ${c.prix}€`);
    });
    
    // Simuler les données formatées pour le dashboard
    const statsData = {
      coursCreated,
      totalStudents: 0,
      averageRating: 4.2,
      totalRevenue: coursRecents.reduce((sum, c) => sum + c.prix, 0)
    };
    
    const coursFormatted = coursRecents.map(c => ({
      _id: c._id,
      titre: c.titre,
      students: 0,
      rating: 4.2,
      status: 'Publié'
    }));
    
    const etudiantsData = [
      {
        id: 1,
        name: 'Étudiant Test 1',
        course: 'Introduction à JavaScript',
        progress: 75
      },
      {
        id: 2,
        name: 'Étudiant Test 2',
        course: 'React Avancé',
        progress: 45
      }
    ];
    
    console.log('\n🎯 Données du dashboard simulées:');
    console.log('Statistiques:', JSON.stringify(statsData, null, 2));
    console.log('Cours formatés:', JSON.stringify(coursFormatted, null, 2));
    console.log('Étudiants:', JSON.stringify(etudiantsData, null, 2));
    
    console.log('\n✅ Test du dashboard réussi!');
    console.log('📋 Informations de connexion pour tester:');
    console.log('Email: formateur.test@example.com');
    console.log('Mot de passe: test123');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Connexion fermée');
    process.exit(0);
  }
}

testDashboardData();
