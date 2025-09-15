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
  Alert,
  Avatar,
  Stack,
  Snackbar
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
import offreEmploiService, { OffreEmploi, ListResponse, CandidatOffre } from '../services/offreEmploiService';
import { badgeService } from '../services/badgeService';

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
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState<{ next?: { page: number; limit: number }, prev?: { page: number; limit: number } } | null>(null);
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
  const [savingJob, setSavingJob] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    { open: false, message: '', severity: 'success' }
  );

  // Statistiques de l'entreprise
  const [stats, setStats] = useState({
    totalOffres: 0,
    offresActives: 0,
    totalCandidatures: 0,
    totalVues: 0
  });

  // Candidats par badge
  const [badges, setBadges] = useState<Array<{ _id: string; nom: string }>>([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [selectedOffreId, setSelectedOffreId] = useState<string>('__all__');
  const [candidats, setCandidats] = useState<CandidatOffre[]>([]);
  const [loadingCandidats, setLoadingCandidats] = useState(false);
  const [errorCandidats, setErrorCandidats] = useState<string | null>(null);
  const [candPage, setCandPage] = useState(1);
  const [candLimit, setCandLimit] = useState(10);
  const [candStatutFilter, setCandStatutFilter] = useState<'all' | 'en_attente' | 'acceptee' | 'refusee'>('all');

  useEffect(() => {
    loadJobOffers();
    // Charger badges disponibles
    (async () => {
      try {
        const res = await badgeService.getBadges({ limit: 100 });
        const list = (res as any)?.badges || (Array.isArray((res as any)?.data) ? (res as any).data : []);
        const mapped = list.map((b: any) => ({ _id: b._id, nom: b.nom }));
        setBadges(mapped);
      } catch (e) {
        console.warn('Impossible de charger les badges');
      }
    })();
  }, [page, limit]);

  const loadJobOffers = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await offreEmploiService.getOffresParEntreprise(user._id, { page, limit });
      setPagination(res.pagination || null);
      const items = res.items || [];
      const mapped: JobOffer[] = items.map((o: OffreEmploi) => {
        const loc = (o as any).localisation;
        const locationStr = typeof loc === 'string'
          ? loc
          : (loc && (loc.ville || loc.pays)
              ? `${loc.ville || ''}${loc.ville && loc.pays ? ', ' : ''}${loc.pays || ''}`.trim()
              : ((o as any).lieu || 'Non précisé'));
        const dateExp = (o as any).dateLimite
          ? new Date((o as any).dateLimite).toISOString()
          : ((o as any).dateExpiration || '');
        return {
          _id: o._id,
          titre: o.titre,
          description: o.description || '',
          typeContrat: o.typeContrat || 'N/A',
          niveauExperience: (o as any).niveauExperience || 'N/A',
          salaire: (o as any).salaire || 'N/A',
          localisation: locationStr || 'Non précisé',
          datePublication: (o as any).dateCreation || (o as any).createdAt || new Date().toISOString(),
          dateExpiration: dateExp,
          statut: (o as any).statut || 'active',
          candidatures: Array.isArray((o as any).candidats) ? (o as any).candidats.length : 0,
          vues: (o as any).vues || 0,
        } as JobOffer;
      });
      setJobOffers(mapped);
      setStats({
        totalOffres: mapped.length,
        offresActives: mapped.filter(j => j.statut === 'active' || j.statut === 'ouverte').length,
        totalCandidatures: mapped.reduce((acc, j) => acc + (j.candidatures || 0), 0),
        totalVues: mapped.reduce((acc, j) => acc + (j.vues || 0), 0),
      });
    } catch (e: any) {
      console.error('Erreur lors du chargement des offres:', e);
      setError(e?.response?.data?.message || 'Impossible de charger vos offres');
      setJobOffers([]);
    } finally {
      setLoading(false);
    }
  };

  // Validation utilitaires
  const todayStr = new Date().toISOString().split('T')[0];
  const isDateValid = !jobFormData.dateExpiration || jobFormData.dateExpiration >= todayStr;
  const isFormValid =
    jobFormData.titre.trim().length > 0 &&
    jobFormData.description.trim().length > 0 &&
    jobFormData.localisation.trim().length > 0 &&
    isDateValid;

  const filteredCandidats = candidats.filter((c) => candStatutFilter === 'all' ? true : (c.statut === candStatutFilter));
  const paginatedCandidats = (() => {
    const start = (candPage - 1) * candLimit;
    return filteredCandidats.slice(start, start + candLimit);
  })();
  const candTotalPages = Math.max(1, Math.ceil(filteredCandidats.length / candLimit));

  const updateCandidatureStatut = async (item: CandidatOffre, newStatut: 'acceptee' | 'refusee') => {
    try {
      const offreId = (item as any).offreId as string;
      const candidatureId = (item as any).candidatureId as string;
      if (!offreId || !candidatureId) return;
      await offreEmploiService.mettreAJourCandidature(offreId, candidatureId, { statut: newStatut });
      // Mettre à jour localement
      setCandidats(prev => prev.map(c => (c as any).candidatureId === candidatureId ? { ...c, statut: newStatut } : c));
    } catch (e) {
      console.error('Erreur mise à jour candidature:', e);
      alert("Impossible de mettre à jour le statut de la candidature");
    }
  };

  const loadCandidats = async () => {
    if (!user?._id) return;
    if (!selectedBadgeId) {
      setErrorCandidats('Veuillez sélectionner un badge');
      return;
    }
    try {
      setLoadingCandidats(true);
      setErrorCandidats(null);
      let data: CandidatOffre[] = [];
      if (selectedOffreId && selectedOffreId !== '__all__') {
        data = await offreEmploiService.getCandidatsParOffre(selectedOffreId, { badgeId: selectedBadgeId });
      } else {
        data = await offreEmploiService.getCandidatsEntrepriseParBadge(user._id, { badgeId: selectedBadgeId });
      }
      setCandidats(Array.isArray(data) ? data : []);
      setCandPage(1);
    } catch (e: any) {
      console.error('Erreur chargement candidats:', e);
      setErrorCandidats(e?.response?.data?.message || 'Impossible de charger les candidats');
      setCandidats([]);
    } finally {
      setLoadingCandidats(false);
    }
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
      dateExpiration: todayStr
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
    if (!isFormValid) {
      alert("Veuillez vérifier les champs requis. La date d'expiration ne peut pas être antérieure à aujourd'hui.");
      return;
    }
    try {
      setSavingJob(true);
      if (selectedJob) {
        await offreEmploiService.mettreAJourOffre(selectedJob._id, {
          titre: jobFormData.titre,
          description: jobFormData.description,
          typeContrat: jobFormData.typeContrat,
          salaire: jobFormData.salaire,
          lieu: jobFormData.localisation,
          dateExpiration: jobFormData.dateExpiration,
          niveauExperience: jobFormData.niveauExperience as any,
        } as any);
        setSnackbar({ open: true, message: "Offre mise à jour avec succès", severity: 'success' });
      } else {
        await offreEmploiService.creerOffre({
          titre: jobFormData.titre,
          description: jobFormData.description,
          typeContrat: jobFormData.typeContrat,
          salaire: jobFormData.salaire,
          lieu: jobFormData.localisation,
          dateExpiration: jobFormData.dateExpiration,
          niveauExperience: jobFormData.niveauExperience as any,
        } as any);
        setSnackbar({ open: true, message: "Offre créée avec succès", severity: 'success' });
        // Reset simple des champs (garde la date à aujourd'hui)
        setJobFormData(prev => ({
          ...prev,
          titre: '',
          description: '',
          salaire: '',
          localisation: ''
        }));
      }
      setDialogOpen(false);
      await loadJobOffers();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSnackbar({ open: true, message: error?.response?.data?.message || 'Erreur lors de la sauvegarde', severity: 'error' });
    } finally {
      setSavingJob(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      try {
        await offreEmploiService.supprimerOffre(jobId);
        await loadJobOffers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
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
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            disabled={!pagination?.prev}
            onClick={() => pagination?.prev && setPage(pagination.prev.page)}
          >
            Précédent
          </Button>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">Page {page}</Typography>
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
          <Button
            variant="outlined"
            disabled={!pagination?.next}
            onClick={() => pagination?.next && setPage(pagination.next.page)}
          >
            Suivant
          </Button>
        </Box>
      </CardContent>
    </Card>

    {/* Candidats par badge */}
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Candidats par badge
        </Typography>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Badge requis"
              value={selectedBadgeId}
              onChange={(e) => setSelectedBadgeId(e.target.value)}
            >
              {badges.map(b => (
                <MenuItem key={b._id} value={b._id}>{b.nom}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Offre"
              helperText="Sélectionner une offre ou Toutes"
              value={selectedOffreId}
              onChange={(e) => setSelectedOffreId(e.target.value)}
            >
              <MenuItem value="__all__">Toutes mes offres</MenuItem>
              {jobOffers.map(o => (
                <MenuItem key={o._id} value={o._id}>{o.titre}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Statut candidature"
              value={candStatutFilter}
              onChange={(e) => { setCandPage(1); setCandStatutFilter(e.target.value as any); }}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="en_attente">En attente</MenuItem>
              <MenuItem value="acceptee">Acceptée</MenuItem>
              <MenuItem value="refusee">Refusée</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="contained" onClick={loadCandidats} disabled={loadingCandidats || !selectedBadgeId}>
              {loadingCandidats ? 'Recherche...' : 'Rechercher'}
            </Button>
          </Grid>
        </Grid>
        {errorCandidats && <Alert severity="error" sx={{ mb: 2 }}>{errorCandidats}</Alert>}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Candidat</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Offre</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
                <TableCell>Contact</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary">Aucun candidat trouvé</Typography>
                  </TableCell>
                </TableRow>
              )}
              {paginatedCandidats.map((c, idx) => {
                const u = typeof c.utilisateur === 'string' ? { _id: c.utilisateur } as any : c.utilisateur;
                const offer = jobOffers.find(j => j._id === (c as any).offreId);
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar src={u?.photoProfil ? `http://localhost:5006/uploads/profiles/${u.photoProfil}` : undefined}>
                          {u?.nom ? u.nom[0] : '?'}
                        </Avatar>
                        <Typography>{u?.nom || u?._id}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{u?.email || '-'}</TableCell>
                    <TableCell>{offer ? offer.titre : (selectedOffreId !== '__all__' ? jobOffers.find(j => j._id === selectedOffreId)?.titre : '—')}</TableCell>
                    <TableCell><Chip size="small" label={c.statut || '—'} /></TableCell>
                    <TableCell>{c.dateCandidature ? new Date(c.dateCandidature).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" color="success" onClick={() => updateCandidatureStatut(c, 'acceptee')}>Accepter</Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => updateCandidatureStatut(c, 'refusee')}>Refuser</Button>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="text" onClick={() => u?.email && (window.location.href = `mailto:${u.email}`)}>Contacter</Button>
                        <Button size="small" variant="text" onClick={() => window.open(`/profil/${u?._id || ''}`, '_blank')}>Voir profil</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            disabled={candPage <= 1}
            onClick={() => setCandPage(p => Math.max(1, p - 1))}
          >
            Précédent
          </Button>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">Page {candPage} / {candTotalPages}</Typography>
            <TextField
              select
              size="small"
              label="Par page"
              value={candLimit}
              onChange={(e) => { setCandPage(1); setCandLimit(Number(e.target.value)); }}
              sx={{ width: 120 }}
            >
              {[5,10,20,50].map(n => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Button
            variant="outlined"
            disabled={candPage >= candTotalPages}
            onClick={() => setCandPage(p => Math.min(candTotalPages, p + 1))}
          >
            Suivant
          </Button>
        </Box>
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
              required
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
              required
              error={jobFormData.description.trim().length === 0}
              helperText={jobFormData.description.trim().length === 0 ? 'La description est requise' : undefined}
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
              label="Salaire (GNF)"
              value={jobFormData.salaire}
              onChange={(e) => setJobFormData({ ...jobFormData, salaire: e.target.value })}
              placeholder="Ex: 5 000 000 GNF"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Localisation"
              value={jobFormData.localisation}
              onChange={(e) => setJobFormData({ ...jobFormData, localisation: e.target.value })}
              placeholder="Ex: Dakar, Sénégal"
              required
              error={jobFormData.localisation.trim().length === 0}
              helperText={jobFormData.localisation.trim().length === 0 ? 'La localisation est requise' : undefined}
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
              inputProps={{ min: todayStr }}
              error={!isDateValid}
              helperText={!isDateValid ? "La date d'expiration ne peut pas être antérieure à aujourd'hui" : undefined}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)}>
          Annuler
        </Button>
        <Button onClick={handleSaveJob} variant="contained" disabled={!isFormValid || savingJob}>
          {selectedJob ? 'Modifier' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  </Box>
);

};

export default EntrepriseDashboard;