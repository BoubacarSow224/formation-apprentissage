import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search,
  LocationOn,
  Work,
  Business,
  Schedule,
  Euro,
  Bookmark,
  BookmarkBorder,
  FilterList
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { jobsService } from '../../services/jobsService';

interface Job {
  _id: string;
  titre: string;
  entreprise: string;
  localisation: string;
  typeContrat: string;
  salaire: string;
  description: string;
  competencesRequises: string[];
  datePublication: Date;
  saved?: boolean;
}

const Jobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Simuler le chargement des offres d'emploi
        const mockJobs: Job[] = [
          {
            _id: '1',
            titre: 'Développeur React Junior',
            entreprise: 'TechStart',
            localisation: 'Paris, France',
            typeContrat: 'CDI',
            salaire: '35 000 - 45 000 €',
            description: 'Nous recherchons un développeur React junior passionné pour rejoindre notre équipe dynamique. Vous travaillerez sur des projets innovants et aurez l\'opportunité d\'apprendre rapidement.',
            competencesRequises: ['React', 'JavaScript', 'HTML/CSS', 'Git'],
            datePublication: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            saved: false
          },
          {
            _id: '2',
            titre: 'Développeur Full Stack',
            entreprise: 'InnovateCorp',
            localisation: 'Lyon, France',
            typeContrat: 'CDI',
            salaire: '45 000 - 55 000 €',
            description: 'Poste de développeur full stack pour travailler sur notre plateforme e-commerce. Expérience avec Node.js et React requise.',
            competencesRequises: ['React', 'Node.js', 'MongoDB', 'Express'],
            datePublication: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            saved: true
          },
          {
            _id: '3',
            titre: 'Stagiaire Développement Web',
            entreprise: 'WebAgency',
            localisation: 'Marseille, France',
            typeContrat: 'Stage',
            salaire: '600 - 800 €',
            description: 'Stage de 6 mois en développement web. Parfait pour acquérir de l\'expérience pratique et développer vos compétences.',
            competencesRequises: ['HTML', 'CSS', 'JavaScript', 'WordPress'],
            datePublication: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            saved: false
          },
          {
            _id: '4',
            titre: 'Développeur Frontend Senior',
            entreprise: 'DigitalSolutions',
            localisation: 'Toulouse, France',
            typeContrat: 'CDI',
            salaire: '55 000 - 70 000 €',
            description: 'Nous cherchons un développeur frontend senior pour diriger notre équipe de développement et mentorer les juniors.',
            competencesRequises: ['React', 'TypeScript', 'Redux', 'Testing'],
            datePublication: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            saved: false
          }
        ];

        setJobs(mockJobs);
      } catch (error) {
        console.error('Erreur lors du chargement des emplois:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.entreprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.competencesRequises.some(comp => 
                           comp.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesLocation = !locationFilter || job.localisation.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesContract = !contractFilter || job.typeContrat === contractFilter;
    
    return matchesSearch && matchesLocation && matchesContract;
  });

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      const updatedJobs = jobs.map(job => 
        job._id === jobId ? { ...job, saved: !job.saved } : job
      );
      setJobs(updatedJobs);
      
      // Simuler l'appel API
      // await jobsService.toggleSaveJob(jobId);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleApply = async (jobId: string) => {
    try {
      // Simuler la candidature
      alert('Candidature envoyée avec succès !');
      setDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la candidature:', error);
    }
  };

  const formatDateAgo = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Aujourd\'hui';
    if (diffInDays === 1) return 'Hier';
    return `Il y a ${diffInDays} jours`;
  };

  const contractTypes = [...new Set(jobs.map(job => job.typeContrat))];
  const locations = [...new Set(jobs.map(job => job.localisation.split(',')[0]))];

  if (loading) {
    return <Typography>Chargement des offres d'emploi...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Offres d'emploi
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Découvrez les meilleures opportunités de carrière dans le développement web.
      </Typography>

      {/* Filtres */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Rechercher un emploi, entreprise, compétence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Localisation"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                InputProps={{
                  startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Type de contrat</InputLabel>
                <Select
                  value={contractFilter}
                  label="Type de contrat"
                  onChange={(e) => setContractFilter(e.target.value)}
                >
                  <MenuItem value="">Tous les types</MenuItem>
                  {contractTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('');
                  setContractFilter('');
                }}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Liste des emplois */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {filteredJobs.map((job) => (
            <Card key={job._id} sx={{ mb: 3, cursor: 'pointer' }} onClick={() => handleJobClick(job)}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {job.titre}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Business fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {job.entreprise}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {job.localisation}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <IconButton onClick={(e) => {
                    e.stopPropagation();
                    handleSaveJob(job._id);
                  }}>
                    {job.saved ? <Bookmark color="primary" /> : <BookmarkBorder />}
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {job.description.substring(0, 150)}...
                </Typography>

                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  {job.competencesRequises.slice(0, 4).map((competence) => (
                    <Chip key={competence} label={competence} size="small" variant="outlined" />
                  ))}
                  {job.competencesRequises.length > 4 && (
                    <Chip label={`+${job.competencesRequises.length - 4}`} size="small" variant="outlined" />
                  )}
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" gap={2}>
                    <Chip label={job.typeContrat} color="primary" size="small" />
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Euro fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {job.salaire}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateAgo(job.datePublication)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}

          {filteredJobs.length === 0 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucune offre trouvée
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Essayez de modifier vos critères de recherche
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Sidebar */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiques
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Offres disponibles</Typography>
                  <Chip label={jobs.length} color="primary" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Offres sauvegardées</Typography>
                  <Chip label={jobs.filter(j => j.saved).length} color="secondary" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Nouvelles cette semaine</Typography>
                  <Chip label="12" color="success" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compétences populaires
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {['React', 'JavaScript', 'Node.js', 'TypeScript', 'Python'].map((skill) => (
                  <Chip key={skill} label={skill} variant="outlined" size="small" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog détail emploi */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedJob && (
          <>
            <DialogTitle>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {selectedJob.titre}
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Business fontSize="small" color="action" />
                    <Typography variant="body1">
                      {selectedJob.entreprise}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body1">
                      {selectedJob.localisation}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Description du poste
                </Typography>
                <Typography variant="body1" paragraph>
                  {selectedJob.description}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Compétences requises
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedJob.competencesRequises.map((competence) => (
                    <Chip key={competence} label={competence} color="primary" />
                  ))}
                </Box>
              </Box>

              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Informations
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Type de contrat
                    </Typography>
                    <Typography variant="body1">
                      {selectedJob.typeContrat}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Salaire
                    </Typography>
                    <Typography variant="body1">
                      {selectedJob.salaire}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>
                Fermer
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleSaveJob(selectedJob._id)}
              >
                {selectedJob.saved ? 'Retirer' : 'Sauvegarder'}
              </Button>
              <Button
                variant="contained"
                onClick={() => handleApply(selectedJob._id)}
                disabled={!user}
              >
                {user ? 'Postuler' : 'Connectez-vous pour postuler'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Jobs;
