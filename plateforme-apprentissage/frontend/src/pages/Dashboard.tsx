import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  Avatar,
  Chip
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { coursService } from '../services/coursService';
import { Cours } from '../types';
import { School, EmojiEvents, TrendingUp } from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [coursInscrits, setCoursInscrits] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (user?.coursSuivis) {
        try {
          // Simuler la récupération des cours inscrits
          setLoading(false);
        } catch (error) {
          console.error('Erreur lors du chargement des cours:', error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserCourses();
  }, [user]);

  if (!user) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h5">Veuillez vous connecter pour accéder au dashboard</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header avec informations utilisateur */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar sx={{ width: 80, height: 80 }}>
              {user.nom ? user.nom.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                Bienvenue, {user.nom || 'Utilisateur'}
              </Typography>
              <Chip 
                label={user.role || 'Utilisateur'} 
                color="primary" 
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Membre depuis: {new Date(user.dateInscription || Date.now()).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <School sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {user.coursSuivis?.length || 0}
              </Typography>
              <Typography color="text.secondary">
                Cours inscrits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {user.coursSuivis?.filter((cours: any) => cours.termine).length || 0}
              </Typography>
              <Typography color="text.secondary">
                Cours terminés
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {user.badgesObtenus?.length || 0}
              </Typography>
              <Typography color="text.secondary">
                Badges obtenus
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cours en cours */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Mes cours en cours
          </Typography>
          {coursInscrits.length > 0 ? (
            <Grid container spacing={2}>
              {coursInscrits.map((cours) => (
                <Grid item xs={12} md={6} key={cours._id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {cours.titre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {cours.description.substring(0, 100)}...
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.random() * 100} 
                        sx={{ mb: 2 }}
                      />
                      <Button 
                        variant="contained" 
                        size="small"
                        component={Link}
                        to={`/courses/${cours._id}`}
                      >
                        Continuer
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary" paragraph>
                Vous n'êtes inscrit à aucun cours pour le moment.
              </Typography>
              <Button 
                variant="contained" 
                component={Link} 
                to="/courses"
              >
                Explorer les cours
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Actions rapides
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                component={Link}
                to="/courses"
                sx={{ py: 2 }}
              >
                Parcourir les cours
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                component={Link}
                to="/community"
                sx={{ py: 2 }}
              >
                Rejoindre la communauté
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                component={Link}
                to="/jobs"
                sx={{ py: 2 }}
              >
                Voir les emplois
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                component={Link}
                to="/profile"
                sx={{ py: 2 }}
              >
                Modifier le profil
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
