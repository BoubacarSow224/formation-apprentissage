import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Dashboard,
  People,
  School,
  Quiz,
  Work,
  TrendingUp,
  TrendingDown,
  Add,
  Edit,
  Delete,
  Visibility,
  Block,
  CheckCircle,
  Cancel,
  Analytics,
  Download,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import UserManagement from '../../components/admin/UserManagement';
import CourseManagement from '../../components/admin/CourseManagement';
import QuizManagement from '../../components/admin/QuizManagement';
import ModerationPanel from '../../components/admin/ModerationPanel';
import adminService from '../../services/adminService';
// Temporairement commenté pour éviter les erreurs de compilation
// import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement,
// } from 'chart.js';
import { ActivityLog, AdminStats } from '../../types';

// Enregistrer les composants Chart.js - temporairement commenté
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement
// );

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalQuizzes: 0,
    totalJobs: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    coursesCompleted: 0,
    revenue: 0,
    pendingModeration: 0
  });
  const [userGrowthData, setUserGrowthData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [courseCompletionData, setCourseCompletionData] = useState({ completed: 0, inProgress: 0, abandoned: 0 });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Charger les données au montage du composant
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Charger les statistiques
      const statsResponse = await adminService.getStats();
      setStats(statsResponse);

      // Charger les données de croissance des utilisateurs
      const growthResponse = await adminService.getUserGrowthData();
      setUserGrowthData(growthResponse);

      // Charger les données de complétion des cours
      const completionResponse = await adminService.getCourseCompletionData();
      setCourseCompletionData(completionResponse);

      // Charger les logs d'activité
      const activityResponse = await adminService.getActivityLogs();
      setActivityLogs(activityResponse);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // En cas d'erreur, utiliser des données par défaut
      setStats({
        totalUsers: 1247,
        totalCourses: 89,
        totalQuizzes: 156,
        totalJobs: 34,
        activeUsers: 892,
        newUsersThisMonth: 156,
        coursesCompleted: 2341,
        revenue: 45670,
        pendingModeration: 3
      });
    } finally {
      setLoading(false);
    }
  };

  // Données pour les graphiques (utilise les données dynamiques ou par défaut)
  const userGrowthChartData = {
    labels: userGrowthData.labels.length > 0 ? userGrowthData.labels : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Nouveaux utilisateurs',
        data: userGrowthData.data.length > 0 ? userGrowthData.data : [65, 89, 120, 151, 142, 156],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  };

  const courseCompletionChartData = {
    labels: ['Terminés', 'En cours', 'Abandonnés'],
    datasets: [
      {
        data: [
          courseCompletionData.completed || 65,
          courseCompletionData.inProgress || 25,
          courseCompletionData.abandoned || 10
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const revenueData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Revenus (€)',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const refreshData = async () => {
    await loadDashboardData();
  };

  if (user?.role !== 'admin') {
    return (
      <Box textAlign="center" py={8}>
        <Alert severity="error">
          Accès refusé. Vous devez être administrateur pour accéder à cette page.
        </Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Dashboard Administrateur
        </Typography>
        <Box>
          <Button
            startIcon={<Refresh />}
            onClick={refreshData}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            Actualiser
          </Button>
          <Button
            startIcon={<Download />}
            variant="outlined"
          >
            Exporter
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Statistiques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Utilisateurs
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalUsers.toLocaleString()}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
                    <Typography variant="body2" color="success.main">
                      +{stats.newUsersThisMonth} ce mois
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <School sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Cours
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalCourses}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats.coursesCompleted} complétions
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
                <Quiz sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Quiz
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalQuizzes}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Actifs
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
                    Revenus
                  </Typography>
                  <Typography variant="h4">
                    {stats.revenue.toLocaleString()}€
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +12% ce mois
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Croissance des utilisateurs
              </Typography>
              <Box 
                sx={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Graphique de croissance des utilisateurs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statut des cours
              </Typography>
              <Box 
                sx={{ 
                  height: 250, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Graphique statut des cours
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenus mensuels
              </Typography>
              <Box 
                sx={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Graphique des revenus mensuels
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activité récente
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {activityLogs.map((activity) => (
                  <Box key={activity.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                    <Typography variant="body2" fontWeight="bold">
                      {activity.action}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {activity.user} {activity.course && `- ${activity.course}`}
                      {activity.company && `- ${activity.company}`}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Il y a {activity.time}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Onglets */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Vue d'ensemble" />
          <Tab label="Utilisateurs" />
          <Tab label="Cours" />
          <Tab label="Quiz" />
          <Tab label="Modération" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Statistiques principales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <People sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Utilisateurs
                      </Typography>
                      <Typography variant="h4">
                        {stats.totalUsers}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {stats.activeUsers} actifs
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
                    <School sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Cours
                      </Typography>
                      <Typography variant="h4">
                        {stats.totalCourses}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {stats.coursesCompleted} complétions
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
                    <Quiz sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Quiz
                      </Typography>
                      <Typography variant="h4">
                        {stats.totalQuizzes}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Actifs
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
                    <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Modération
                      </Typography>
                      <Typography variant="h4">
                        {stats.pendingModeration || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        En attente
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Graphiques et activité récente */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Activité des utilisateurs
                  </Typography>
                  <Box 
                    sx={{ 
                      height: 300, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Graphique d'activité des utilisateurs par jour
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Activité récente
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {activityLogs.map((activity) => (
                      <Box key={activity.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {activity.action}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {activity.user} {activity.course && `- ${activity.course}`}
                          {activity.company && `- ${activity.company}`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Il y a {activity.time}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <UserManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CourseManagement onCourseUpdate={refreshData} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <QuizManagement onQuizUpdate={refreshData} />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <ModerationPanel />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
