import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  School,
  PlayArrow,
  Assignment,
  EmojiEvents,
  TrendingUp,
  BookmarkBorder,
  WorkspacePremium,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`apprenant-tabpanel-${index}`}
      aria-labelledby={`apprenant-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ApprenantDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Données simulées pour l'apprenant
  const stats = {
    coursesEnrolled: 3,
    coursesCompleted: 1,
    badgesEarned: 5,
    totalHours: 24
  };

  const enrolledCourses = [
    { id: 1, title: 'Couture moderne', progress: 75, instructor: 'Marie Diallo', nextLesson: 'Techniques de finition' },
    { id: 2, title: 'Mécanique automobile', progress: 45, instructor: 'Amadou Ba', nextLesson: 'Diagnostic moteur' },
    { id: 3, title: 'Broderie traditionnelle', progress: 20, instructor: 'Aissatou Diop', nextLesson: 'Points de base' }
  ];

  const recentBadges = [
    { id: 1, name: 'Premier Cours', description: 'Terminé votre premier cours', icon: '🎓' },
    { id: 2, name: 'Assidu', description: '7 jours consécutifs d\'apprentissage', icon: '📅' },
    { id: 3, name: 'Quiz Master', description: '10 quiz réussis', icon: '🧠' }
  ];

  const recommendedCourses = [
    { id: 4, title: 'Design graphique', instructor: 'Ousmane Fall', rating: 4.8, students: 156 },
    { id: 5, title: 'Cuisine sénégalaise', instructor: 'Bineta Sarr', rating: 4.9, students: 203 },
    { id: 6, title: 'Photographie', instructor: 'Cheikh Ndiaye', rating: 4.7, students: 89 }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Mon Espace d'Apprentissage
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>
            Bienvenue, {user?.nom} 👨‍🏫
          </Typography>
        </Box>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <School sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Cours suivis
                  </Typography>
                  <Typography variant="h4">
                    {stats.coursesEnrolled}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WorkspacePremium sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Cours terminés
                  </Typography>
                  <Typography variant="h4">
                    {stats.coursesCompleted}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Badges obtenus
                  </Typography>
                  <Typography variant="h4">
                    {stats.badgesEarned}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Schedule sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Heures d'étude
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalHours}h
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Mes Cours" />
          <Tab label="Badges" />
          <Tab label="Découvrir" />
          <Tab label="Progression" />
        </Tabs>
      </Box>

      {/* Mes Cours */}
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Continuer l'apprentissage
        </Typography>
        <Grid container spacing={3}>
          {enrolledCourses.map((course) => (
            <Grid item xs={12} md={6} key={course.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {course.title}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    Par {course.instructor}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Progression</Typography>
                      <Typography variant="body2">{course.progress}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={course.progress} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Prochaine leçon: {course.nextLesson}
                  </Typography>
                  <Button variant="contained" startIcon={<PlayArrow />} fullWidth>
                    Continuer
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Badges */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Mes Badges
        </Typography>
        <Grid container spacing={3}>
          {recentBadges.map((badge) => (
            <Grid item xs={12} sm={6} md={4} key={badge.id}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ mb: 2 }}>
                    {badge.icon}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {badge.name}
                  </Typography>
                  <Typography color="text.secondary">
                    {badge.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Découvrir */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Cours recommandés
        </Typography>
        <Grid container spacing={3}>
          {recommendedCourses.map((course) => (
            <Grid item xs={12} md={4} key={course.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {course.title}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    Par {course.instructor}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2">
                      ⭐ {course.rating}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {course.students} étudiants
                    </Typography>
                  </Box>
                  <Button variant="outlined" fullWidth startIcon={<BookmarkBorder />}>
                    S'inscrire
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Progression */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Votre Progression
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Objectifs du mois
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Assignment />
                  </ListItemIcon>
                  <ListItemText
                    primary="Terminer 2 cours"
                    secondary="1/2 terminés"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmojiEvents />
                  </ListItemIcon>
                  <ListItemText
                    primary="Obtenir 3 nouveaux badges"
                    secondary="2/3 obtenus"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp />
                  </ListItemIcon>
                  <ListItemText
                    primary="Étudier 30 heures"
                    secondary="24/30 heures"
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Statistiques
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Temps d'étude cette semaine: 8h
                </Typography>
                <LinearProgress variant="determinate" value={67} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Quiz réussis: 85%
                </Typography>
                <LinearProgress variant="determinate" value={85} color="success" />
              </Box>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Assiduité: 12 jours consécutifs
                </Typography>
                <LinearProgress variant="determinate" value={100} color="warning" />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default ApprenantDashboard;
