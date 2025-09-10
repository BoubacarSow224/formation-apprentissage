import React, { useState, useEffect } from 'react';
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
  Avatar
} from '@mui/material';
import {
  School,
  Add,
  VideoLibrary,
  Quiz,
  People,
  TrendingUp,
  Assignment,
  Star
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
      id={`formateur-tabpanel-${index}`}
      aria-labelledby={`formateur-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FormateurDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Données simulées pour le formateur
  const stats = {
    coursCreated: 5,
    totalStudents: 127,
    averageRating: 4.6,
    totalRevenue: 2450
  };

  const recentCourses = [
    { id: 1, title: 'Couture moderne', students: 45, status: 'Publié', rating: 4.8 },
    { id: 2, title: 'Techniques avancées', students: 32, status: 'En cours', rating: 4.5 },
    { id: 3, title: 'Broderie traditionnelle', students: 28, status: 'En attente', rating: 4.7 }
  ];

  const recentStudents = [
    { id: 1, name: 'Fatou Sall', course: 'Couture moderne', progress: 85 },
    { id: 2, name: 'Amadou Ba', course: 'Techniques avancées', progress: 60 },
    { id: 3, name: 'Aissatou Diop', course: 'Broderie traditionnelle', progress: 92 }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard Formateur
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Bienvenue, {user?.nom} 👨‍🏫
          </Typography>
        </Box>
        <Button variant="outlined" onClick={logout}>
          Déconnexion
        </Button>
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
                    Cours créés
                  </Typography>
                  <Typography variant="h4">
                    {stats.coursCreated}
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
                <People sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Étudiants
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalStudents}
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
                <Star sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Note moyenne
                  </Typography>
                  <Typography variant="h4">
                    {stats.averageRating}
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
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Revenus (€)
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalRevenue}
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
          <Tab label="Vue d'ensemble" />
          <Tab label="Mes Cours" />
          <Tab label="Étudiants" />
          <Tab label="Créer un Cours" />
        </Tabs>
      </Box>

      {/* Vue d'ensemble */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Cours récents
              </Typography>
              <List>
                {recentCourses.map((course) => (
                  <ListItem key={course.id}>
                    <ListItemIcon>
                      <VideoLibrary />
                    </ListItemIcon>
                    <ListItemText
                      primary={course.title}
                      secondary={`${course.students} étudiants • Note: ${course.rating}`}
                    />
                    <Chip 
                      label={course.status} 
                      color={course.status === 'Publié' ? 'success' : course.status === 'En cours' ? 'warning' : 'default'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Étudiants actifs
              </Typography>
              <List>
                {recentStudents.map((student) => (
                  <ListItem key={student.id}>
                    <ListItemIcon>
                      <Avatar>{student.name.charAt(0)}</Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={student.name}
                      secondary={`${student.course} • Progression: ${student.progress}%`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Mes Cours */}
      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Mes Cours</Typography>
          <Button variant="contained" startIcon={<Add />}>
            Nouveau Cours
          </Button>
        </Box>
        <Grid container spacing={3}>
          {recentCourses.map((course) => (
            <Grid item xs={12} md={4} key={course.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {course.title}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {course.students} étudiants inscrits
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Chip 
                      label={course.status} 
                      color={course.status === 'Publié' ? 'success' : course.status === 'En cours' ? 'warning' : 'default'}
                    />
                    <Typography variant="body2">
                      ⭐ {course.rating}
                    </Typography>
                  </Box>
                  <Box mt={2}>
                    <Button size="small" sx={{ mr: 1 }}>Modifier</Button>
                    <Button size="small">Voir détails</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Étudiants */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Mes Étudiants
        </Typography>
        <Paper>
          <List>
            {recentStudents.map((student) => (
              <ListItem key={student.id} divider>
                <ListItemIcon>
                  <Avatar>{student.name.charAt(0)}</Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={student.name}
                  secondary={student.course}
                />
                <Box sx={{ minWidth: 100 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progression: {student.progress}%
                  </Typography>
                </Box>
                <Button size="small">Contacter</Button>
              </ListItem>
            ))}
          </List>
        </Paper>
      </TabPanel>

      {/* Créer un Cours */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Créer un nouveau cours
          </Typography>
          <Typography color="text.secondary" paragraph>
            Partagez vos connaissances avec la communauté en créant un nouveau cours.
          </Typography>
          <Button variant="contained" size="large" startIcon={<Add />}>
            Commencer la création
          </Button>
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default FormateurDashboard;
