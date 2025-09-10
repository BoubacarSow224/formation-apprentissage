import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Container,
  AppBar,
  Toolbar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import { School, Group, Work, Login, PersonAdd, Close } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { login, register } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // États pour les formulaires
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    nom: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    role: 'apprenant' as 'admin' | 'formateur' | 'apprenant' | 'entreprise'
  });

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(loginData.email, loginData.password);
      setLoginOpen(false);
      // La redirection se fait automatiquement via AuthContext
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.nom || !registerData.email || !registerData.telephone || !registerData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (registerData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register({
        nom: registerData.nom,
        email: registerData.email,
        telephone: registerData.telephone,
        password: registerData.password,
        role: registerData.role
      });
      setRegisterOpen(false);
      // La redirection se fait automatiquement via AuthContext
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header avec navigation */}
      <AppBar position="fixed" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🎓 Plateforme d'Apprentissage
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              color="inherit"
              onClick={() => setLoginOpen(true)}
              startIcon={<Login />}
            >
              Se connecter
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setRegisterOpen(true)}
              startIcon={<PersonAdd />}
            >
              S'inscrire
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Toolbar spacer pour compenser la navbar fixe */}
      <Toolbar />

      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Bienvenue sur la Plateforme d'Apprentissage
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Développez vos compétences, connectez-vous avec la communauté et trouvez votre prochain emploi
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/courses"
              sx={{ mr: 2 }}
            >
              Explorer les Cours
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setRegisterOpen(true)}
            >
              Commencer Maintenant
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Grid container spacing={4} sx={{ py: 8 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent sx={{ p: 4 }}>
                <School sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Cours Interactifs
                </Typography>
                <Typography color="text.secondary">
                  Apprenez avec des cours structurés, des quiz interactifs et des projets pratiques
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent sx={{ p: 4 }}>
                <Group sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Communauté Active
                </Typography>
                <Typography color="text.secondary">
                  Échangez avec d'autres apprenants, partagez vos expériences et progressez ensemble
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent sx={{ p: 4 }}>
                <Work sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Opportunités d'Emploi
                </Typography>
                <Typography color="text.secondary">
                  Découvrez des offres d'emploi adaptées à vos compétences et votre niveau
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Prêt à commencer votre parcours d'apprentissage ?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Rejoignez des milliers d'apprenants qui développent leurs compétences chaque jour
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => setRegisterOpen(true)}
            >
              Créer un Compte Gratuit
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setLoginOpen(true)}
            >
              Déjà membre ? Se connecter
            </Button>
          </Stack>
        </Box>
      </Container>

      {/* Dialog de Connexion */}
      <Dialog open={loginOpen} onClose={() => setLoginOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Se connecter
            <Button onClick={() => setLoginOpen(false)}>
              <Close />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Mot de passe"
            type="password"
            fullWidth
            variant="outlined"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setLoginOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleLogin} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'Inscription */}
      <Dialog open={registerOpen} onClose={() => setRegisterOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            S'inscrire
            <Button onClick={() => setRegisterOpen(false)}>
              <Close />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label="Nom complet"
            type="text"
            fullWidth
            variant="outlined"
            value={registerData.nom}
            onChange={(e) => setRegisterData({ ...registerData, nom: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={registerData.email}
            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Téléphone"
            type="tel"
            fullWidth
            variant="outlined"
            value={registerData.telephone}
            onChange={(e) => setRegisterData({ ...registerData, telephone: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Rôle</InputLabel>
            <Select
              value={registerData.role}
              label="Rôle"
              onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as 'admin' | 'formateur' | 'apprenant' | 'entreprise' })}
            >
              <MenuItem value="apprenant">Apprenant</MenuItem>
              <MenuItem value="formateur">Formateur</MenuItem>
              <MenuItem value="entreprise">Entreprise</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Mot de passe"
            type="password"
            fullWidth
            variant="outlined"
            value={registerData.password}
            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Confirmer le mot de passe"
            type="password"
            fullWidth
            variant="outlined"
            value={registerData.confirmPassword}
            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setRegisterOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleRegister} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;
