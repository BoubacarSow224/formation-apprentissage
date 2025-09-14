import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  LinearProgress,
  Divider,
  Badge,
  Tooltip,
  Switch,
  FormControlLabel,
  Container,
  Avatar,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Dashboard,
  People,
  School,
  Forum,
  Security,
  Settings,
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  Refresh,
  GetApp,
  Backup,
  MonitorHeart,
  Work,
  EmojiEvents,
  Assignment,
  Quiz,
  TrendingUp,
  TrendingDown,
  Block,
  Analytics,
  SupervisorAccount,
  AdminPanelSettings,
  Storage,
  CloudSync
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface SystemStats {
  users: {
    total: number;
    active: number;
    byRole: {
      admin: number;
      formateur: number;
      apprenant: number;
    };
  };
  courses: {
    total: number;
    published: number;
    pending: number;
  };
  community: {
    posts: number;
    likes: number;
  };
  quizzes: {
    total: number;
    active: number;
  };
}

interface User {
  _id: string;
  nom: string;
  email: string;
  role: string;
  actif: boolean;
  dateInscription: string;
  photoProfil?: string;
}

interface Course {
  _id: string;
  titre: string;
  description?: string;
  // champs backend réels
  statutModeration?: string;
  estApprouve?: boolean;
  estPublic?: boolean;
  formateur?: {
    nom?: string;
    email?: string;
  };
  createdAt?: string;
  // compat legacy éventuelle
  statut?: string;
  dateCreation?: string;
  createur?: { nom?: string; email?: string };
}

interface Post {
  _id: string;
  contenu: string;
  auteur: {
    nom: string;
    email: string;
    photoProfil?: string;
  };
  dateCreation: string;
  isActive: boolean;
  likes: string[];
  commentaires: any[];
}

const SuperAdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject'>('approve');
  const [moderationReason, setModerationReason] = useState('');
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>(
    { open: false, message: '', severity: 'success' }
  );
  const [createAdminData, setCreateAdminData] = useState({
    nom: '',
    email: '',
    telephone: '',
    password: ''
  });

  // Charger les statistiques système
  const loadSystemStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5006/api/admin/system-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemStats(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:5006/api/admin/users?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  // Charger les cours
  const loadCourses = async () => {
    try {
      // Par défaut, afficher les cours en attente d'approbation
      let response = await fetch('http://localhost:5006/api/admin/courses?status=en_attente&limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        let data = await response.json();
        let list = data?.data?.courses ?? [];
        // Fallback: si aucun cours en attente, charger tous les cours
        if (!Array.isArray(list) || list.length === 0) {
          response = await fetch('http://localhost:5006/api/admin/courses?limit=50', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.ok) {
            data = await response.json();
            list = data?.data?.courses ?? [];
          }
        }
        setCourses(Array.isArray(list) ? list : []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
    }
  };

  // Charger les posts
  const loadPosts = async () => {
    try {
      const response = await fetch('http://localhost:5006/api/admin/posts?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.data.posts);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
    }
  };

  // Basculer le statut d'un utilisateur
  const toggleUserStatus = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5006/api/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        loadUsers(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  // Modérer un cours
  const moderateCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      const response = await fetch(`http://localhost:5006/api/admin/courses/${selectedCourse._id}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: moderationAction,
          reason: moderationReason
        })
      });
      
      if (response.ok) {
        setModerationDialogOpen(false);
        setSelectedCourse(null);
        setModerationReason('');
        // Notification claire
        if (moderationAction === 'approve') {
          setSnack({ open: true, message: 'Cours approuvé et publié automatiquement', severity: 'success' });
        } else {
          setSnack({ open: true, message: 'Cours rejeté', severity: 'error' });
        }
        loadCourses(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur lors de la modération:', error);
    }
  };

  // Supprimer un post
  const deletePost = async (postId: string) => {
    try {
      const response = await fetch(`http://localhost:5006/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        loadPosts(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du post:', error);
    }
  };

  // Créer un nouvel admin (seul admin peut créer admin)
  const createAdmin = async () => {
    try {
      const response = await fetch('http://localhost:5006/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...createAdminData,
          role: 'admin'
        })
      });
      
      if (response.ok) {
        setUserDialogOpen(false);
        setCreateAdminData({ nom: '', email: '', telephone: '', password: '' });
        loadUsers(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'admin:', error);
    }
  };

  // Supprimer un utilisateur
  const deleteUser = async (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const response = await fetch(`http://localhost:5006/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          loadUsers(); // Recharger la liste
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      }
    }
  };

  useEffect(() => {
    loadSystemStats();
    loadUsers();
    loadCourses();
    loadPosts();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif':
      case 'publie':
      case 'approuve':
        return 'success';
      case 'inactif':
      case 'rejete':
        return 'error';
      case 'en_attente':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'formateur':
        return 'primary';
      case 'apprenant':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SupervisorAccount fontSize="large" color="primary" />
          Panneau Super Admin
          <Chip label="Contrôle Total" color="error" variant="outlined" />
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>
          Bienvenue, {user?.nom} 👨‍🏫
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Contrôlez tous les aspects de la plateforme d'apprentissage
        </Typography>
      </Box>

      {/* Statistiques rapides */}
      {systemStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Utilisateurs Totaux
                    </Typography>
                    <Typography variant="h4">
                      {systemStats.users.total}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      {systemStats.users.active} actifs
                    </Typography>
                  </Box>
                  <People fontSize="large" color="primary" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Cours Publiés
                    </Typography>
                    <Typography variant="h4">
                      {systemStats.courses.published}
                    </Typography>
                    <Typography variant="body2" color="warning.main">
                      {systemStats.courses.pending} en attente
                    </Typography>
                  </Box>
                  <School fontSize="large" color="secondary" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Carte de statistiques Communauté masquée pour l'admin */}
          {/* (Supprimé car non prioritaire pour l'admin) */}

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Quiz Actifs
                    </Typography>
                    <Typography variant="h4">
                      {systemStats.quizzes.active}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      sur {systemStats.quizzes.total}
                    </Typography>
                  </Box>
                  <Quiz fontSize="large" color="success" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Actions rapides */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Actions Rapides
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={() => {
                loadSystemStats();
                loadUsers();
                loadCourses();
                loadPosts();
              }}
            >
              Actualiser Tout
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              color="secondary"
            >
              Exporter Données
            </Button>
            <Button
              variant="outlined"
              startIcon={<Storage />}
              color="info"
            >
              Sauvegarde DB
            </Button>
            <Button
              variant="outlined"
              startIcon={<MonitorHeart />}
              color="success"
            >
              Santé Système
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Onglets de gestion */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<People />} label="Utilisateurs" />
            <Tab icon={<School />} label="Cours & Badges" />
            <Tab icon={<Work />} label="Emplois" />
            {/* Masquer l'onglet Communauté tout en conservant l'indexation */}
            <Tab icon={<Forum />} label="Communauté" disabled sx={{ display: 'none' }} />
            <Tab icon={<Security />} label="Modération" />
            <Tab icon={<Settings />} label="Système" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Onglet Utilisateurs */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Gestion des Utilisateurs
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedUser(null);
                    setUserDialogOpen(true);
                  }}
                  color="primary"
                >
                  Créer Admin
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Utilisateur</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Rôle</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Inscription</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={user.photoProfil ? `http://localhost:5006/uploads/profiles/${user.photoProfil}` : undefined}
                              sx={{ width: 32, height: 32 }}
                            >
                              {user.nom.charAt(0)}
                            </Avatar>
                            {user.nom}
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            color={getRoleColor(user.role) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.actif ? 'Actif' : 'Inactif'}
                            color={user.actif ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(user.dateInscription).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => toggleUserStatus(user._id)}
                            color={user.actif ? 'error' : 'success'}
                          >
                            {user.actif ? <Block /> : <CheckCircle />}
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setSelectedUser(user);
                              setUserDialogOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            onClick={() => deleteUser(user._id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {courses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Aucun cours trouvé. Essayez de rafraîchir ou de réinitialiser les filtres.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Onglet Cours */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Gestion des Cours & Badges
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    color="secondary"
                  >
                    Créer Badge
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Assignment />}
                    color="info"
                  >
                    Certificats
                  </Button>
                </Box>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Titre</TableCell>
                      <TableCell>Créateur</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Modération</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course._id}>
                        <TableCell>{course.titre}</TableCell>
                        <TableCell>{course.formateur?.nom || course.createur?.nom || '—'}</TableCell>
                        <TableCell>
                          {(() => {
                            const isApproved = !!course.estApprouve;
                            const isPublic = !!course.estPublic;
                            const statut = isApproved ? (isPublic ? 'publie' : 'approuve') : 'en_attente';
                            return (
                              <Chip
                                label={statut}
                                color={getStatusColor(statut) as any}
                                size="small"
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={course.statutModeration || 'en_attente'}
                            color={getStatusColor(course.statutModeration || 'en_attente') as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(course.createdAt || course.dateCreation || Date.now()).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {(course.statutModeration === 'en_attente' || course.estApprouve !== true) && (
                            <>
                              <Tooltip title="Approuver le cours">
                                <IconButton
                                  onClick={() => {
                                    setSelectedCourse(course);
                                    setModerationAction('approve');
                                    setModerationDialogOpen(true);
                                  }}
                                  color="success"
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rejeter le cours">
                                <IconButton
                                  onClick={() => {
                                    setSelectedCourse(course);
                                    setModerationAction('reject');
                                    setModerationDialogOpen(true);
                                  }}
                                  color="error"
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Voir le cours">
                            <IconButton>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Onglet Emplois */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Validation des Annonces d'Emploi
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CheckCircle />}
                  color="success"
                >
                  Valider Toutes
                </Button>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Modérez les annonces d'emploi publiées par les entreprises avant leur publication.
              </Alert>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Titre</TableCell>
                      <TableCell>Entreprise</TableCell>
                      <TableCell>Localisation</TableCell>
                      <TableCell>Salaire</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Développeur Full Stack</TableCell>
                      <TableCell>TechCorp SARL</TableCell>
                      <TableCell>Dakar, Sénégal</TableCell>
                      <TableCell>800,000 FCFA</TableCell>
                      <TableCell>
                        <Chip label="En attente" color="warning" size="small" />
                      </TableCell>
                      <TableCell>
                        <IconButton color="success">
                          <CheckCircle />
                        </IconButton>
                        <IconButton color="error">
                          <Cancel />
                        </IconButton>
                        <IconButton>
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Onglet Communauté masqué (non utilisé par l'admin) */}
          {false && activeTab === 3 && (
            <Box />
          )}

          {/* Onglet Modération */}
          {activeTab === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Centre de Modération
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Surveillez et modérez tout le contenu de la plateforme depuis ce panneau centralisé.
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Cours en Attente
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {courses.filter(c => c.statutModeration === 'en_attente').length}
                      </Typography>
                      <Typography variant="body2">
                        Nécessitent une modération
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Posts Actifs
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {posts.filter(p => p.isActive).length}
                      </Typography>
                      <Typography variant="body2">
                        Dans la communauté
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Onglet Système */}
          {activeTab === 5 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Configuration Système
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Ces paramètres affectent l'ensemble de la plateforme. Procédez avec prudence.
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Utilisateurs Totaux
                      </Typography>
                      <Typography variant="h4">
                        {systemStats?.users.total || 0}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        {systemStats?.users.active || 0} actifs
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Cours & Badges
                      </Typography>
                      <Typography variant="h4">
                        {systemStats?.courses.total || 0}
                      </Typography>
                      <Typography variant="body2" color="info.main">
                        0 badges
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Certificats
                      </Typography>
                      <Typography variant="h4">
                        0
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        0 valides
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Emplois
                      </Typography>
                      <Typography variant="h4">
                        0
                      </Typography>
                      <Typography variant="body2" color="warning.main">
                        0 en attente
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Paramètres Généraux
                      </Typography>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Inscriptions ouvertes"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Notifications email"
                      />
                      <FormControlLabel
                        control={<Switch />}
                        label="Mode maintenance"
                      />
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Statistiques Système
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Mémoire: 65% utilisée
                      </Typography>
                      <LinearProgress variant="determinate" value={65} sx={{ mb: 1 }} />
                      
                      <Typography variant="body2" gutterBottom>
                        CPU: 23% utilisé
                      </Typography>
                      <LinearProgress variant="determinate" value={23} sx={{ mb: 1 }} />
                      
                      <Typography variant="body2" gutterBottom>
                        Stockage: 45% utilisé
                      </Typography>
                      <LinearProgress variant="determinate" value={45} />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Snackbar de notification d'action admin */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack(prev => ({ ...prev, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>

      {/* Dialog de création/modification d'utilisateur */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Modifier Utilisateur' : 'Créer Nouvel Admin'}
        </DialogTitle>
        <DialogContent>
          {!selectedUser && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Seuls les administrateurs peuvent créer d'autres administrateurs.
            </Alert>
          )}
          <TextField
            fullWidth
            label="Nom complet"
            value={selectedUser ? selectedUser.nom : createAdminData.nom}
            onChange={(e) => {
              if (selectedUser) {
                setSelectedUser({ ...selectedUser, nom: e.target.value });
              } else {
                setCreateAdminData({ ...createAdminData, nom: e.target.value });
              }
            }}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={selectedUser ? selectedUser.email : createAdminData.email}
            onChange={(e) => {
              if (selectedUser) {
                setSelectedUser({ ...selectedUser, email: e.target.value });
              } else {
                setCreateAdminData({ ...createAdminData, email: e.target.value });
              }
            }}
            sx={{ mb: 2 }}
          />
          {!selectedUser && (
            <>
              <TextField
                fullWidth
                label="Téléphone"
                value={createAdminData.telephone}
                onChange={(e) => setCreateAdminData({ ...createAdminData, telephone: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Mot de passe"
                type="password"
                value={createAdminData.password}
                onChange={(e) => setCreateAdminData({ ...createAdminData, password: e.target.value })}
                sx={{ mb: 2 }}
              />
            </>
          )}
          {selectedUser && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={selectedUser.role}
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                label="Rôle"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="formateur">Formateur</MenuItem>
                <MenuItem value="apprenant">Apprenant</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={selectedUser ? () => {} : createAdmin}
            color="primary"
            variant="contained"
          >
            {selectedUser ? 'Modifier' : 'Créer Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de modération des cours */}
      <Dialog open={moderationDialogOpen} onClose={() => setModerationDialogOpen(false)}>
        <DialogTitle>
          {moderationAction === 'approve' ? 'Approuver le cours' : 'Rejeter le cours'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Cours: {selectedCourse?.titre}
          </Typography>
          {moderationAction === 'reject' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Raison du rejet"
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModerationDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={moderateCourse}
            color={moderationAction === 'approve' ? 'success' : 'error'}
            variant="contained"
          >
            {moderationAction === 'approve' ? 'Approuver' : 'Rejeter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SuperAdminPanel;
