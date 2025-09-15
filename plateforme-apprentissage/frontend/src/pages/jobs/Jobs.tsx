import React, { useState, useEffect, useMemo } from 'react';
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
import offreEmploiService, { OffreEmploi } from '../../services/offreEmploiService';
import { useNavigate, Link } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState<{ next?: { page: number; limit: number }, prev?: { page: number; limit: number } } | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await offreEmploiService.getOffres({ page, limit });
        setPagination(res.pagination || null);
        const mapped: Job[] = res.items.map((o) => {
          const loc = (o as any).localisation;
          const localisation = typeof loc === 'string'
            ? loc
            : (loc && (loc.ville || loc.pays)
                ? `${loc.ville || ''}${loc.ville && loc.pays ? ', ' : ''}${loc.pays || ''}`.trim()
                : ((o as any).lieu || 'Non précisé'));
          const sal = (o as any).salaire;
          const salaire = sal && typeof sal === 'object'
            ? `${sal.min ? sal.min.toLocaleString() : ''}${sal.devise ? ' ' + sal.devise : ''}${sal.periode ? ' /' + sal.periode : ''}`.trim() || 'N/A'
            : (sal || 'N/A');
          const competences = (o as any).competencesRequises || (o as any).competences || [];
          return {
            _id: o._id,
            titre: o.titre,
            entreprise: (o as any).entreprise?.nom || 'Entreprise',
            localisation,
            typeContrat: o.typeContrat || 'N/A',
            salaire,
            description: o.description || '',
            competencesRequises: Array.isArray(competences) ? competences : [],
            datePublication: new Date((o as any).dateCreation || (o as any).createdAt || Date.now()),
            saved: false,
          } as Job;
        });
        setJobs(mapped);
      } catch (e: any) {
        console.error('Erreur lors du chargement des offres:', e);
        setError(e?.response?.data?.message || 'Impossible de charger les offres d\'emploi');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [page, limit]);

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

  // Statistiques dynamiques & compétences populaires
  const stats = useMemo(() => {
    const total = jobs.length;
    const saved = jobs.filter(j => j.saved).length;
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const newWeek = jobs.filter(j => j.datePublication >= sevenDaysAgo).length;
    return { total, saved, newWeek };
  }, [jobs]);

  const popularSkills = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const j of jobs) {
      (j.competencesRequises || []).forEach((s) => {
        const key = (s || '').trim();
        if (!key) return;
        freq[key] = (freq[key] || 0) + 1;
      });
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([label]) => label);
  }, [jobs]);

  const handleJobClick = async (job: Job) => {
    setDialogOpen(true);
    setDialogLoading(true);
    try {
      const full = await offreEmploiService.getOffre(job._id);
      const loc = (full as any).localisation;
      const localisation = typeof loc === 'string'
        ? loc
        : (loc && (loc.ville || loc.pays)
            ? `${loc.ville || ''}${loc.ville && loc.pays ? ', ' : ''}${loc.pays || ''}`.trim()
            : ((full as any).lieu || job.localisation));
      const sal = (full as any).salaire;
      const salaire = sal && typeof sal === 'object'
        ? `${sal.min ? sal.min.toLocaleString() : ''}${sal.devise ? ' ' + sal.devise : ''}${sal.periode ? ' /' + sal.periode : ''}`.trim() || job.salaire
        : ((sal as any) || job.salaire);
      const comps = (full as any).competencesRequises || (full as any).competences || job.competencesRequises;
      const mapped: Job = {
        _id: (full as any)._id || job._id,
        titre: full.titre || job.titre,
        entreprise: (full as any).entreprise?.nom || job.entreprise,
        localisation,
        typeContrat: full.typeContrat || job.typeContrat,
        salaire,
        description: full.description || job.description,
        competencesRequises: Array.isArray(comps) ? comps : job.competencesRequises,
        datePublication: new Date((full as any).dateCreation || (full as any).createdAt || job.datePublication),
        saved: job.saved,
      };
      setSelectedJob(mapped);
    } catch (e) {
      setSelectedJob(job);
    } finally {
      setDialogLoading(false);
    }
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
      await offreEmploiService.postuler(jobId);
      alert('Candidature envoyée avec succès !');
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Erreur lors de la candidature:', error);
      const msg = error?.response?.data?.message || 'Erreur lors de l\'envoi de la candidature';
      alert(msg);
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
  const locations = [...new Set(jobs.map(job => (typeof job.localisation === 'string' ? job.localisation.split(',')[0] : '')))];

  if (loading) {
    return <Typography>Chargement des offres d'emploi...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Offres d'emploi
      </Typography>

      {/* Statistiques (déplacé en haut) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ m: 0, mb: 1 }}>Statistiques</Typography>
        <Grid container spacing={3} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Offres disponibles
                    </Typography>
                    <Typography variant="h4">{stats.total}</Typography>
                  </Box>
                  <Work color="primary" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Offres sauvegardées
                    </Typography>
                    <Typography variant="h4">{stats.saved}</Typography>
                  </Box>
                  <Bookmark color="secondary" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Nouvelles cette semaine
                    </Typography>
                    <Typography variant="h4">{stats.newWeek}</Typography>
                  </Box>
                  <Schedule color="success" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          {error ? (
            <Typography variant="body1" color="error" paragraph sx={{ m: 0 }}>
              {error}
            </Typography>
          ) : (
            <Typography variant="body1" color="text.secondary" paragraph sx={{ m: 0 }}>
              Découvrez les meilleures opportunités de carrière.
            </Typography>
          )}
        </Box>
        {(user?.role === 'apprenant' || user?.role === 'formateur') && (
          <Button variant="outlined" component={Link} to="/mes-candidatures">
            Mes candidatures
          </Button>
        )}
      </Box>

      {/* Ancien bloc descriptif */}
      {/*
      {error ? (
        <Typography variant="body1" color="error" paragraph>
          {error}
        </Typography>
      ) : (
        <Typography variant="body1" color="text.secondary" paragraph>
          Découvrez les meilleures opportunités de carrière.
        </Typography>
      )}
      */}

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
        <Grid item xs={12} md={12}>
          <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} sx={{ mb: 1 }}>
            <TextField
              select
              size="small"
              label="Par page"
              value={limit}
              onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
              sx={{ width: 120 }}
            >
              {[5,10,20,50].map(n => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Grid container spacing={2}>
            {filteredJobs.map((job) => (
              <Grid item xs={12} sm={6} md={4} key={job._id}>
                <Card sx={{ height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => handleJobClick(job)}>
                  <CardContent sx={{ flexGrow: 1 }}>
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
                  <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                    <Button size="small" onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job._id}`); }}>
                      Voir le détail
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

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

          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              disabled={!pagination?.prev}
              onClick={() => pagination?.prev && setPage(pagination.prev.page)}
            >
              Précédent
            </Button>
            <Typography variant="body2" color="text.secondary">Page {page}</Typography>
            <Button
              variant="outlined"
              disabled={!pagination?.next}
              onClick={() => pagination?.next && setPage(pagination.next.page)}
            >
              Suivant
            </Button>
          </Box>
        </Grid>

        {/* Sidebar supprimée: les statistiques ont été déplacées en haut et 'Compétences populaires' retiré */}
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
                {dialogLoading && (
                  <Typography variant="body2" color="text.secondary">Chargement...</Typography>
                )}
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
