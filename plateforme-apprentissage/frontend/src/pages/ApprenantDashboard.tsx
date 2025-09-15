import React, { useEffect, useMemo, useState } from 'react';
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
import api from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

type EnrolledCourseItem = {
  id: string | number;
  title: string;
  progress: number;
  instructor: string;
  nextLesson: string;
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<any | null>(null);
  const [studyStats, setStudyStats] = useState<{ totalHours: number; weekHours: number; active: boolean; activeSince: string | null } | null>(null);
  const [studyBusy, setStudyBusy] = useState(false);
  const [history, setHistory] = useState<{ date: string; hours: number }[] | null>(null);
  const [byCourse, setByCourse] = useState<{ courseId: string; courseTitle: string; hours: number }[] | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Charger les données dynamiques de l'apprenant
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/auth/me');
        if (!mounted) return;
        setMe(res.data?.user || null);
        // charger stats d'étude
        try {
          const s = await api.get('/study/stats');
          if (mounted) setStudyStats(s.data || null);
        } catch (e) {
          if (mounted) setStudyStats(null);
        }
        // charger historique et répartition par cours
        try {
          const [h, bc] = await Promise.all([
            api.get('/study/history?days=14'),
            api.get('/study/by-course')
          ]);
          if (mounted) setHistory(h.data?.series || null);
          if (mounted) setByCourse(bc.data?.items || null);
        } catch (e) {
          if (mounted) {
            setHistory(null);
            setByCourse(null);
          }
        }
        // charger cours publics (Découvrir)
        try {
          setRecLoading(true);
          setRecError(null);
          const c = await api.get('/cours/public');
          if (mounted) setRecommendedCourses(Array.isArray(c.data?.data) ? c.data.data : (Array.isArray(c.data) ? c.data : []));
        } catch (e: any) {
          if (mounted) setRecError(e?.response?.data?.message || 'Impossible de charger les cours recommandés');
        } finally {
          if (mounted) setRecLoading(false);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || 'Impossible de charger vos données.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  // Statistiques dynamiques (calcul côté front)
  const stats = useMemo(() => {
    const suivis = Array.isArray(me?.coursSuivis) ? me.coursSuivis : [];
    const badges = Array.isArray(me?.badgesObtenus) ? me.badgesObtenus : [];
    const coursesEnrolled = suivis.length;
    const coursesCompleted = suivis.filter((c: any) => c?.termine === true).length;
    const badgesEarned = badges.length;
    // Heures d'étude: si non disponible, on l'estime à 0 pour l'instant (peut être ajouté côté backend plus tard)
    const totalHours = typeof me?.totalHours === 'number' ? me.totalHours : (studyStats?.totalHours || 0);
    return { coursesEnrolled, coursesCompleted, badgesEarned, totalHours };
  }, [me, studyStats]);

  // Cours inscrits dynamiques (à partir de me.coursSuivis)
  const enrolledCourses: EnrolledCourseItem[] = useMemo<EnrolledCourseItem[]>(() => {
    const suivis = Array.isArray(me?.coursSuivis) ? me.coursSuivis : [];
    return suivis.map((item: any, idx: number) => ({
      id: item?.cours?._id || idx,
      title: item?.cours?.titre || 'Cours',
      progress: typeof item?.progression === 'number' ? item.progression : 0,
      instructor: item?.cours?.formateur?.nom || 'Formateur',
      nextLesson: item?.prochaineLecon || 'À continuer',
    }));
  }, [me]);

  // Badges dynamiques (à partir de me.badgesObtenus)
  const recentBadges = useMemo(() => {
    const badges = Array.isArray(me?.badgesObtenus) ? me.badgesObtenus : [];
    return badges.map((b: any, idx: number) => ({
      id: b?._id || idx,
      name: b?.badge?.nom || 'Badge',
      description: b?.badge?.niveau ? `Niveau ${b.badge.niveau}` : 'Badge obtenu',
      icon: '🏅',
    }));
  }, [me]);

  // Contrôles de session d'étude
  const refreshStudy = async () => {
    try {
      const [meRes, sRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/study/stats')
      ]);
      setMe(meRes.data?.user || null);
      setStudyStats(sRes.data || null);
    } catch {}
  };

  const startStudy = async () => {
    if (studyBusy) return;
    setStudyBusy(true);
    try {
      await api.post('/study/start');
      await refreshStudy();
    } catch (e) {
      console.error(e);
    } finally {
      setStudyBusy(false);
    }
  };

  const stopStudy = async () => {
    if (studyBusy) return;
    setStudyBusy(true);
    try {
      await api.post('/study/stop');
      await refreshStudy();
    } catch (e) {
      console.error(e);
    } finally {
      setStudyBusy(false);
    }
  };

  // Données pour graphe simple: max des heures pour normaliser les barres
  const maxHours = useMemo(() => {
    if (!history || history.length === 0) return 0;
    return history.reduce((m, d) => Math.max(m, d.hours), 0);
  }, [history]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Mon Espace d'Apprentissage
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>
            Bienvenue, {user?.nom}
          </Typography>
        </Box>
      </Box>

      {loading && (
        <Box>
          <Typography>Chargement de vos données...</Typography>
        </Box>
      )}
      {error && (
        <Box>
          <Typography color="error">{error}</Typography>
        </Box>
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
                  <Typography variant="h4">{stats.totalHours}h</Typography>
                  {typeof studyStats?.weekHours === 'number' && (
                    <Typography variant="caption" color="text.secondary">
                      Dont cette semaine: {studyStats.weekHours}h
                    </Typography>
                  )}
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
          {recentBadges.map((badge: any) => (
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
        {recLoading && <Typography>Chargement des cours...</Typography>}
        {recError && <Typography color="error">{recError}</Typography>}
        {!recLoading && !recError && (
          <Grid container spacing={3}>
            {recommendedCourses.map((c: any) => (
              <Grid item xs={12} md={4} key={c._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {c.titre}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      Par {c.formateur?.nom || 'Formateur'}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2">
                        ⭐ {typeof c.noteMoyenne === 'number' ? c.noteMoyenne.toFixed(1) : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {c.nbEtudiants || 0} étudiants
                      </Typography>
                    </Box>
                    <Button variant="outlined" fullWidth startIcon={<BookmarkBorder />}>
                      S'inscrire
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {recommendedCourses.length === 0 && (
              <Grid item xs={12}>
                <Typography color="text.secondary">Aucun cours public disponible pour le moment.</Typography>
              </Grid>
            )}
          </Grid>
        )}
      </TabPanel>

      {/* Progression */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Votre Progression
          </Typography>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <Button variant="contained" color="primary" onClick={startStudy} disabled={studyBusy || studyStats?.active === true}>
              {studyStats?.active ? 'Session en cours' : 'Démarrer une session'}
            </Button>
            <Button variant="outlined" color="inherit" onClick={stopStudy} disabled={studyBusy || studyStats?.active !== true}>
              Arrêter la session
            </Button>
            {studyStats?.active && (
              <Typography variant="caption" color="text.secondary">
                Démarrée: {new Date(studyStats.activeSince as any).toLocaleString()}
              </Typography>
            )}
          </Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Activité (14 derniers jours)
              </Typography>
              {!history && <Typography color="text.secondary">Aucune donnée pour le moment.</Typography>}
              {history && (
                <Box>
                  <Box display="flex" gap={1} alignItems="end" sx={{ height: 160, mb: 1 }}>
                    {history.map((d) => {
                      const pct = maxHours > 0 ? (d.hours / maxHours) : 0;
                      return (
                        <Box key={d.date} sx={{ width: 10, backgroundColor: 'rgba(33,150,243,0.2)', borderRadius: 1, display: 'flex', alignItems: 'flex-end' }}>
                          <Box sx={{ width: '100%', height: `${Math.max(4, Math.round(pct * 150))}px`, backgroundColor: 'primary.main', borderRadius: 1 }} />
                        </Box>
                      );
                    })}
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    {history.map((d, i) => (
                      <Typography key={d.date} variant="caption" color="text.secondary">
                        {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })[0]}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Heures par cours
              </Typography>
              {!byCourse && <Typography color="text.secondary">Aucune donnée pour le moment.</Typography>}
              {byCourse && byCourse.length > 0 && (
                <List>
                  {byCourse.map((it) => (
                    <ListItem key={String(it.courseId)}>
                      <ListItemText primary={it.courseTitle || 'Cours'} secondary={`${it.hours} h étudiées`} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default ApprenantDashboard;
