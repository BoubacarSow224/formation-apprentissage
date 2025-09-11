import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
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
  Alert
} from '@mui/material';
import {
  Work,
  Add,
  Edit,
  Delete,
  Visibility,
  People,
  TrendingUp,
  Business,
  LocationOn
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface JobOffer {
  _id: string;
  titre: string;
  description: string;
  typeContrat: string;
  niveauExperience: string;
  salaire: string;
  localisation: string;
  datePublication: string;
  dateExpiration: string;
  statut: string;
  candidatures: number;
  vues: number;
}

const EntrepriseDashboard: React.FC = () => {
  const { user } = useAuth();
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [jobFormData, setJobFormData] = useState({
    titre: '',
    description: '',
    typeContrat: 'CDI',
    niveauExperience: 'Junior',
    salaire: '',
    localisation: '',
    dateExpiration: ''
  });

  // Statistiques de l'entreprise
  const [stats, setStats] = useState({
    totalOffres: 0,
    offresActives: 0,
    totalCandidatures: 0,
    totalVues: 0
  });

  useEffect(() => {
    loadJobOffers();
    loadStats();
  }, []);

  const loadJobOffers = async () => {
    try {
      setLoading(true);
      // Simuler le chargement des offres d'emploi de l'entreprise
      const mockJobs: JobOffer[] = [
        {
          _id: '1',
          titre: 'Développeur Full Stack',
          description: 'Développement d\'applications web modernes',
          typeContrat: 'CDI',
          niveauExperience: 'Senior',
          salaire: '800,000 FCFA',
          localisation: 'Dakar, Sénégal',
          datePublication: new Date().toISOString(),
          dateExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          statut: 'active',
          candidatures: 15,
          vues: 120
        },
        {
          _id: '2',
          titre: 'Designer UX/UI',
          description: 'Conception d\'interfaces utilisateur',
          typeContrat: 'CDD',
          niveauExperience: 'Junior',
          salaire: '500,000 FCFA',
          localisation: 'Dakar, Sénégal',
          datePublication: new Date().toISOString(),
          dateExpiration: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          statut: 'en_attente',
          candidatures: 8,
          vues: 85
        }
      ];
      setJobOffers(mockJobs);
    } catch (error) {
      console.error('Erreur lors du chargement des offres:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = () => {
    // Calculer les statistiques basées sur les offres
    setStats({
      totalOffres: 2,
      offresActives: 1,
      totalCandidatures: 23,
      totalVues: 205
    });
  };

  const handleCreateJob = () => {
    setSelectedJob(null);
    setJobFormData({
      titre: '',
      description: '',
      typeContrat: 'CDI',
      niveauExperience: 'Junior',
      salaire: '',
      localisation: '',
      dateExpiration: ''
    });
    setDialogOpen(true);
  };

  const handleEditJob = (job: JobOffer) => {
    setSelectedJob(job);
    setJobFormData({
      titre: job.titre,
      description: job.description,
      typeContrat: job.typeContrat,
      niveauExperience: job.niveauExperience,
      salaire: job.salaire,
      localisation: job.localisation,
      dateExpiration: job.dateExpiration.split('T')[0]
    });
    setDialogOpen(true);
  };

  const handleSaveJob = async () => {
    try {
      // Ici, vous feriez l'appel API pour créer/modifier l'offre
      console.log('Sauvegarde de l\'offre:', jobFormData);
      setDialogOpen(false);
      loadJobOffers();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      try {
        // Ici, vous feriez l'appel API pour supprimer l'offre
        console.log('Suppression de l\'offre:', jobId);
        loadJobOffers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'en_attente':
        return 'warning';
      case 'expiree':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'en_attente':
        return 'En attente';
      case 'expiree':
        return 'Expirée';
      default:
        return status;
    }
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Business fontSize="large" color="primary" />
          Dashboard Entreprise
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bienvenue {user?.nom} - Gérez vos offres d'emploi et recrutements
        </Typography>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Offres
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalOffres}
                  </Typography>
                </Box>
                <Work fontSize="large" color="primary" />
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
                    Offres Actives
                  </Typography>
                  <Typography variant="h4">
                    {stats.offresActives}
                  </Typography>
                </Box>
                <TrendingUp fontSize="large" color="success" />
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
                    Candidatures
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalCandidatures}
                  </Typography>
                </Box>
                <People fontSize="large" color="secondary" />
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
                    Vues Totales
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalVues}
                  </Typography>
                </Box>
                <Visibility fontSize="large" color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gestion des offres d'emploi */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Mes Offres d'Emploi
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateJob}
            >
              Nouvelle Offre
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Titre</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Niveau</TableCell>
                  <TableCell>Localisation</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Candidatures</TableCell>
                  <TableCell>Vues</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobOffers.map((job) => (
                  <TableRow key={job._id}>
                    <TableCell>{job.titre}</TableCell>
                    <TableCell>{job.typeContrat}</TableCell>
                    <TableCell>{job.niveauExperience}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" />
                        {job.localisation}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(job.statut)}
                        color={getStatusColor(job.statut) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{job.candidatures}</TableCell>
                    <TableCell>{job.vues}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEditJob(job)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteJob(job._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog pour créer/modifier une offre */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedJob ? 'Modifier l\'offre' : 'Nouvelle offre d\'emploi'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titre du poste"
                value={jobFormData.titre}
                onChange={(e) => setJobFormData({ ...jobFormData, titre: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={jobFormData.description}
                onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Type de contrat"
                value={jobFormData.typeContrat}
                onChange={(e) => setJobFormData({ ...jobFormData, typeContrat: e.target.value })}
              >
                <MenuItem value="CDI">CDI</MenuItem>
                <MenuItem value="CDD">CDD</MenuItem>
                <MenuItem value="Stage">Stage</MenuItem>
                <MenuItem value="Freelance">Freelance</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Niveau d'expérience"
                value={jobFormData.niveauExperience}
                onChange={(e) => setJobFormData({ ...jobFormData, niveauExperience: e.target.value })}
              >
                <MenuItem value="Junior">Junior (0-2 ans)</MenuItem>
                <MenuItem value="Intermédiaire">Intermédiaire (2-5 ans)</MenuItem>
                <MenuItem value="Senior">Senior (5+ ans)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Salaire"
                value={jobFormData.salaire}
                onChange={(e) => setJobFormData({ ...jobFormData, salaire: e.target.value })}
                placeholder="Ex: 500,000 FCFA"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Localisation"
                value={jobFormData.localisation}
                onChange={(e) => setJobFormData({ ...jobFormData, localisation: e.target.value })}
                placeholder="Ex: Dakar, Sénégal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Date d'expiration"
                value={jobFormData.dateExpiration}
                onChange={(e) => setJobFormData({ ...jobFormData, dateExpiration: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSaveJob} variant="contained">
            {selectedJob ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EntrepriseDashboard;
