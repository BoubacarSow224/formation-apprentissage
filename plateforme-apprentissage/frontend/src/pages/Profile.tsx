import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  Edit,
  School,
  EmojiEvents,
  Work,
  Email,
  Phone,
  LocationOn,
  Language,
  Security,
  Notifications,
  Visibility,
  Save
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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: '',
    localisation: '',
    bio: '',
    competences: [] as string[],
    experience: '',
    education: ''
  });
  const [badges, setBadges] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    notifications: true,
    profilePublic: true,
    showEmail: false,
    showProgress: true
  });
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Simuler le chargement des badges de l'utilisateur
        const mockBadges = [
          {
            _id: '1',
            nom: 'Premier Cours Terminé',
            description: 'A terminé son premier cours avec succès',
            icone: '🎓',
            couleur: '#4CAF50',
            dateObtention: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          {
            _id: '2',
            nom: 'Quiz Master',
            description: 'A réussi 10 quiz avec une note supérieure à 80%',
            icone: '🧠',
            couleur: '#2196F3',
            dateObtention: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
          },
          {
            _id: '3',
            nom: 'Contributeur Actif',
            description: 'A participé activement à la communauté',
            icone: '💬',
            couleur: '#FF9800',
            dateObtention: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        ];

        setBadges(mockBadges);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Simuler la sauvegarde du profil
      console.log('Sauvegarde du profil:', formData);
      setSaveMessage('Profil mis à jour avec succès !');
      setEditing(false);
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveMessage('Erreur lors de la sauvegarde');
    }
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (!user) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h5">Veuillez vous connecter pour accéder à votre profil</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Mon Profil
      </Typography>

      {saveMessage && (
        <Alert severity={saveMessage.includes('succès') ? 'success' : 'error'} sx={{ mb: 3 }}>
          {saveMessage}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Informations" icon={<Edit />} />
          <Tab label="Badges" icon={<EmojiEvents />} />
          <Tab label="Activité" icon={<School />} />
          <Tab label="Paramètres" icon={<Security />} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Informations personnelles */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: '3rem' }}>
                  {user.nom.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {user.nom}
                </Typography>
                <Chip label={user.role} color="primary" sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" paragraph>
                  Membre depuis {formatDate(new Date(user.dateInscription || Date.now()))}
                </Typography>
                <Button
                  variant={editing ? 'contained' : 'outlined'}
                  startIcon={editing ? <Save /> : <Edit />}
                  onClick={editing ? handleSaveProfile : () => setEditing(true)}
                  fullWidth
                >
                  {editing ? 'Sauvegarder' : 'Modifier le profil'}
                </Button>
                {editing && (
                  <Button
                    variant="text"
                    onClick={() => setEditing(false)}
                    fullWidth
                    sx={{ mt: 1 }}
                  >
                    Annuler
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informations personnelles
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nom complet"
                      value={formData.nom}
                      onChange={(e) => handleInputChange('nom', e.target.value)}
                      disabled={!editing}
                      InputProps={{
                        startAdornment: <Edit sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!editing}
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Téléphone"
                      value={formData.telephone}
                      onChange={(e) => handleInputChange('telephone', e.target.value)}
                      disabled={!editing}
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Localisation"
                      value={formData.localisation}
                      onChange={(e) => handleInputChange('localisation', e.target.value)}
                      disabled={!editing}
                      InputProps={{
                        startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      multiline
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!editing}
                      placeholder="Parlez-nous de vous..."
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Compétences
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                  {['JavaScript', 'React', 'Node.js', 'Python', 'HTML/CSS'].map((skill) => (
                    <Chip key={skill} label={skill} variant="outlined" />
                  ))}
                  {editing && (
                    <Chip label="+ Ajouter" variant="outlined" color="primary" />
                  )}
                </Box>

                <Typography variant="h6" gutterBottom>
                  Expérience
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  disabled={!editing}
                  placeholder="Décrivez votre expérience professionnelle..."
                  sx={{ mb: 3 }}
                />

                <Typography variant="h6" gutterBottom>
                  Formation
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  disabled={!editing}
                  placeholder="Décrivez votre formation..."
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Badges */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Mes badges ({badges.length})
            </Typography>
            <Grid container spacing={2}>
              {badges.map((badge) => (
                <Grid item xs={12} sm={6} md={4} key={badge._id}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h2" sx={{ mb: 1 }}>
                        {badge.icone}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        {badge.nom}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {badge.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Obtenu le {formatDate(badge.dateObtention)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Progression
                </Typography>
                <Box mb={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Membre depuis: {new Date(user.dateInscription).toLocaleDateString()}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={75} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Progression générale
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Prochains badges à débloquer
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>🎯</ListItemIcon>
                    <ListItemText 
                      primary="Expert Quiz"
                      secondary="Réussir 25 quiz"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>📚</ListItemIcon>
                    <ListItemText 
                      primary="Apprenant Assidu"
                      secondary="Terminer 5 cours"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Activité */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Activité récente
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <School color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Cours terminé: Introduction à React"
                      secondary="Il y a 2 jours"
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                  <ListItem>
                    <ListItemIcon>
                      <EmojiEvents color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Badge obtenu: Contributeur Actif"
                      secondary="Il y a 1 semaine"
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                  <ListItem>
                    <ListItemIcon>
                      <Work color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Quiz réussi: JavaScript Avancé (85%)"
                      secondary="Il y a 1 semaine"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistiques
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Cours terminés</Typography>
                    <Chip label={user.coursSuivis?.filter(cours => cours.termine).length || 0} color="primary" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Quiz réussis</Typography>
                    <Chip label="12" color="success" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Badges obtenus</Typography>
                    <Chip label={badges.length} color="warning" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Temps d'étude</Typography>
                    <Chip label="45h" color="info" size="small" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Paramètres */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notifications
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Notifications />
                    </ListItemIcon>
                    <ListItemText primary="Notifications générales" />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications}
                          onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Confidentialité
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Visibility />
                    </ListItemIcon>
                    <ListItemText primary="Profil public" />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.profilePublic}
                          onChange={(e) => handleSettingChange('profilePublic', e.target.checked)}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Email />
                    </ListItemIcon>
                    <ListItemText primary="Afficher l'email" />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showEmail}
                          onChange={(e) => handleSettingChange('showEmail', e.target.checked)}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <School />
                    </ListItemIcon>
                    <ListItemText primary="Afficher la progression" />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showProgress}
                          onChange={(e) => handleSettingChange('showProgress', e.target.checked)}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default Profile;
