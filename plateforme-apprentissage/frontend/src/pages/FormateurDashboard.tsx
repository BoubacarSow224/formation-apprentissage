import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  School,
  Add,
  VideoLibrary,
  People,
  TrendingUp,
  Star,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { coursService } from '../services/coursService';

// Formatage des montants en Franc Guinéen (GNF)
const formatGNF = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(value || 0);

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    coursCreated: 0,
    totalStudents: 0,
    averageRating: 0,
    totalRevenue: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsUpdatedAt, setStatsUpdatedAt] = useState<Date | null>(null);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentUpdatedAt, setRecentUpdatedAt] = useState<Date | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsUpdatedAt, setStudentsUpdatedAt] = useState<Date | null>(null);
  // Filtres & recherche
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState<string>('');
  const [filterNiveau, setFilterNiveau] = useState<string>('');
  // Dupliquer
  const [dupOpen, setDupOpen] = useState(false);
  const [dupSourceId, setDupSourceId] = useState<string | null>(null);
  const [dupTitre, setDupTitre] = useState('');
  const categories = ['mecanique','couture','maconnerie','informatique','cuisine','autres'];
  const niveaux = ['débutant','intermédiaire','avancé'];
  const [sortBy, setSortBy] = useState<'date'|'titre'|'students'|'rating'|'duration'>('date');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const refreshStats = async () => {
    try {
      setStatsLoading(true);
      const statsResponse = await coursService.getStatistiquesFormateur();
      if (statsResponse?.success) {
        setStats(statsResponse.data);
      }
    } catch (e) {
      console.error('Refresh stats formateur échoué:', e);
    } finally {
      setStatsLoading(false);
      setStatsUpdatedAt(new Date());
    }
  };

  const refreshRecentStudents = async () => {
    try {
      setStudentsLoading(true);
      const etudiantsResponse = await coursService.getEtudiantsRecentsFormateur();
      if (Array.isArray(etudiantsResponse)) {
        setRecentStudents(etudiantsResponse);
      } else if ((etudiantsResponse as any)?.success) {
        setRecentStudents((etudiantsResponse as any).data || []);
      } else {
        setRecentStudents([]);
      }
    } catch (e) {
      console.error('Refresh étudiants récents échoué:', e);
    } finally {
      setStudentsLoading(false);
      setStudentsUpdatedAt(new Date());
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Charger les statistiques du formateur
        try {
          setStatsLoading(true);
          const statsResponse = await coursService.getStatistiquesFormateur();
          if (statsResponse?.success) {
            setStats(statsResponse.data);
          } else {
            // Données par défaut si pas de réponse
            setStats({
              coursCreated: 0,
              totalStudents: 0,
              averageRating: 0,
              totalRevenue: 0
            });
          }
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques:', error);
          setStats({
            coursCreated: 0,
            totalStudents: 0,
            averageRating: 0,
            totalRevenue: 0
          });
        } finally {
          setStatsLoading(false);
          setStatsUpdatedAt(new Date());
        }

        // Charger les cours récents
        try {
          setRecentLoading(true);
          const coursResponse = await coursService.getCoursRecentsFormateur();
          if (Array.isArray(coursResponse)) {
            setRecentCourses(coursResponse);
          } else if ((coursResponse as any)?.success) {
            setRecentCourses((coursResponse as any).data || []);
          } else {
            setRecentCourses([]);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des cours récents:', error);
          setRecentCourses([]);
        } finally {
          setRecentLoading(false);
          setRecentUpdatedAt(new Date());
        }

        // Charger les étudiants récents
        try {
          setStudentsLoading(true);
          const etudiantsResponse = await coursService.getEtudiantsRecentsFormateur();
          if (Array.isArray(etudiantsResponse)) {
            setRecentStudents(etudiantsResponse);
          } else if ((etudiantsResponse as any)?.success) {
            setRecentStudents((etudiantsResponse as any).data || []);
          } else {
            setRecentStudents([]);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des étudiants récents:', error);
          setRecentStudents([]);
        } finally {
          setStudentsLoading(false);
          setStudentsUpdatedAt(new Date());
        }

      } catch (err: any) {
        console.error('Erreur lors du chargement du dashboard:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'formateur') {
      loadDashboardData();
    }
  }, [user]);

  // Auto-refresh des stats toutes les 10 secondes quand l'onglet Vue d'ensemble est actif
  useEffect(() => {
    if (user?.role === 'formateur' && tabValue === 0) {
      const timer = setInterval(() => {
        if (!statsLoading) {
          refreshStats();
        }
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [user, tabValue, statsLoading]);

  const refreshRecentCourses = async () => {
    try {
      setRecentLoading(true);
      const coursResponse = await coursService.getCoursRecentsFormateur();
      if (Array.isArray(coursResponse)) {
        setRecentCourses(coursResponse);
      } else if ((coursResponse as any)?.success) {
        setRecentCourses((coursResponse as any).data || []);
      } else {
        setRecentCourses([]);
      }
    } catch (e) {
      console.error('Refresh cours récents échoué:', e);
    } finally {
      setRecentLoading(false);
      setRecentUpdatedAt(new Date());
    }
  };

  // Auto-refresh toutes les 5 secondes sur l'onglet "Vue d'ensemble" (cours récents)
  useEffect(() => {
    if (user?.role === 'formateur' && tabValue === 0) {
      const timer = setInterval(() => {
        // évite de déclencher si déjà en chargement
        if (!recentLoading) {
          refreshRecentCourses();
        }
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [user, tabValue, recentLoading]);

  // Auto-refresh toutes les 10 secondes sur l'onglet "Vue d'ensemble" (étudiants actifs)
  useEffect(() => {
    if (user?.role === 'formateur' && tabValue === 0) {
      const timer = setInterval(() => {
        if (!studentsLoading) {
          refreshRecentStudents();
        }
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [user, tabValue, studentsLoading]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Chargement du dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard Formateur
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>
            Bienvenue, {user?.nom} 👨‍🏫
          </Typography>
          {statsUpdatedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Statistiques mises à jour: {statsUpdatedAt.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Button variant="outlined" onClick={refreshStats} disabled={statsLoading}>
            {statsLoading ? 'Actualisation…' : 'Actualiser les stats'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
                  <Typography variant="h4">{stats.totalStudents}</Typography>
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
                  <Typography variant="h4">{stats.averageRating}</Typography>
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
                    Revenus (GNF)
                  </Typography>
                  <Typography variant="h4">{formatGNF(stats.totalRevenue)}</Typography>
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                  Cours récents
                </Typography>
                <Button size="small" startIcon={<Refresh />} onClick={refreshRecentCourses} disabled={recentLoading}>
                  Actualiser
                </Button>
              </Box>
              {recentUpdatedAt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Dernière mise à jour: {recentUpdatedAt.toLocaleTimeString()}
                </Typography>
              )}
              {recentLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : recentCourses.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Aucun cours récent.</Typography>
              ) : (
                <List>
                  {[...recentCourses]
                    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
                    .map((course) => (
                    <ListItem key={course._id}>
                      <ListItemIcon>
                        <VideoLibrary />
                      </ListItemIcon>
                      <ListItemText
                        primary={course.titre}
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
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                  Étudiants actifs
                </Typography>
                <Button size="small" startIcon={<Refresh />} onClick={refreshRecentStudents} disabled={studentsLoading}>
                  Actualiser
                </Button>
              </Box>
              {studentsUpdatedAt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Dernière mise à jour: {studentsUpdatedAt.toLocaleTimeString()}
                </Typography>
              )}
              {studentsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : recentStudents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Aucun étudiant récent.</Typography>
              ) : (
                <List>
                  {recentStudents.map((student) => (
                    <ListItem key={student.id} secondaryAction={
                      student.courseId ? (
                        <Button size="small" onClick={() => navigate(`/formateur/cours/${student.courseId}/eleves`)}>
                          Voir tous les étudiants
                        </Button>
                      ) : null
                    }>
                      <ListItemIcon>
                        <Avatar>{(student.name || '?').charAt(0)}</Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={student.name}
                        secondary={`${student.course} • Progression: ${student.progress}%`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Mes Cours */}
      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Mes Cours</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/formateur/cours/nouveau')}>
            Nouveau Cours
          </Button>
        </Box>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Rechercher" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField select fullWidth label="Catégorie" value={filterCategorie} onChange={(e) => setFilterCategorie(e.target.value)}>
              <MenuItem value="">Toutes</MenuItem>
              {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField select fullWidth label="Niveau" value={filterNiveau} onChange={(e) => setFilterNiveau(e.target.value)}>
              <MenuItem value="">Tous</MenuItem>
              {niveaux.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Trier par" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <MenuItem value="date">Date récente</MenuItem>
              <MenuItem value="titre">Titre (A→Z)</MenuItem>
              <MenuItem value="students">Nombre d'étudiants</MenuItem>
              <MenuItem value="rating">Note</MenuItem>
              <MenuItem value="duration">Durée totale</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        {(() => {
          const filtered = recentCourses.filter((course) => {
            const okSearch = !search || (course.titre || '').toLowerCase().includes(search.toLowerCase());
            const okCat = !filterCategorie || course.categorie === filterCategorie;
            const okLvl = !filterNiveau || course.niveau === filterNiveau;
            return okSearch && okCat && okLvl;
          });
          const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
              case 'titre':
                return (a.titre || '').localeCompare(b.titre || '');
              case 'students':
                return (b.students || 0) - (a.students || 0);
              case 'rating':
                return (b.rating || 0) - (a.rating || 0);
              case 'duration':
                return (b.dureeTotale || 0) - (a.dureeTotale || 0);
              case 'date':
              default:
                const da = new Date(a.createdAt || a.dateCreation || 0).getTime();
                const db = new Date(b.createdAt || b.dateCreation || 0).getTime();
                return db - da;
            }
          });
          return (
        <Grid container spacing={3}>
          {sorted.map((course) => (
            <Grid item xs={12} md={4} key={course._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {course.titre}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {course.categorie && <Chip size="small" label={course.categorie} />}
                    {course.niveau && <Chip size="small" color="info" label={course.niveau} />}
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary" gutterBottom>
                      {course.students || 0} étudiants inscrits
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(course.dureeTotale || 0)} min
                    </Typography>
                  </Box>
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
                    <Button size="small" sx={{ mr: 1 }} onClick={() => navigate(`/formateur/cours/${course._id}/modifier`)}>Modifier</Button>
                    <Button size="small" sx={{ mr: 1 }} onClick={() => { setDupSourceId(course._id); setDupTitre(`${course.titre} (copie)`); setDupOpen(true); }}>Dupliquer</Button>
                    <Button size="small" sx={{ mr: 1 }} onClick={() => navigate(`/formateur/cours/${course._id}/eleves`)}>Voir détails</Button>
                    <Button size="small" variant="outlined" onClick={() => navigate(`/formateur/cours/${course._id}/historique-badges`)}>Historique badges</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
          );
        })()}

        <Dialog open={dupOpen} onClose={() => setDupOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Dupliquer le cours</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Nouveau titre" value={dupTitre} onChange={(e) => setDupTitre(e.target.value)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDupOpen(false)}>Annuler</Button>
            <Button variant="contained" onClick={async () => {
              if (!dupSourceId || !dupTitre.trim()) return;
              try {
                const nouveau = await coursService.dupliquerCours(dupSourceId, dupTitre.trim());
                setDupOpen(false);
                setDupSourceId(null);
                setDupTitre('');
                // Recharger la liste
                const coursResponse = await coursService.getCoursRecentsFormateur();
                if (Array.isArray(coursResponse)) setRecentCourses(coursResponse);
                else if ((coursResponse as any)?.success) setRecentCourses((coursResponse as any).data || []);
                navigate(`/formateur/cours/${nouveau._id}/modifier`);
              } catch (e) {
                console.error('Duplication échouée', e);
              }
            }}>Dupliquer</Button>
          </DialogActions>
        </Dialog>
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
