import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, Button, Card, CardContent, Grid } from '@mui/material';
import { LocationOn, Business, Euro } from '@mui/icons-material';
import offreEmploiService, { OffreEmploi } from '../../services/offreEmploiService';
import { useAuth } from '../../contexts/AuthContext';

const JobDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<OffreEmploi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await offreEmploiService.getOffre(id);
        setJob(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Offre introuvable');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const onApply = async () => {
    if (!id) return;
    setApplying(true);
    try {
      await offreEmploiService.postuler(id);
      alert('Candidature envoyée');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur lors de la candidature');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Typography>Chargement...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!job) return <Typography>Aucune donnée</Typography>;

  // Normalisation localisation
  const locRaw: any = (job as any).localisation || (job as any).lieu;
  const localisation = typeof locRaw === 'string'
    ? locRaw
    : (locRaw && (locRaw.ville || locRaw.pays)
        ? `${locRaw.ville || ''}${locRaw.ville && locRaw.pays ? ', ' : ''}${locRaw.pays || ''}`.trim()
        : 'Non précisé');
  // Normalisation salaire
  const salRaw: any = (job as any).salaire;
  const salaire = salRaw && typeof salRaw === 'object'
    ? `${salRaw.min ? salRaw.min.toLocaleString() : ''}${salRaw.devise ? ' ' + salRaw.devise : ''}${salRaw.periode ? ' /' + salRaw.periode : ''}`.trim() || 'N/A'
    : ((salRaw as any) || 'N/A');
  const competences: string[] = (job as any).competences || [];

  return (
    <Box>
      <Button variant="text" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Retour
      </Button>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>{job.titre}</Typography>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Business fontSize="small" color="action" />
              <Typography variant="body1">{job.entreprise?.nom || 'Entreprise'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body1">{localisation}</Typography>
            </Box>
          </Box>
          <Typography variant="body1" paragraph>{job.description}</Typography>
          {competences.length > 0 && (
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              {competences.map((c) => (
                <Chip key={c} label={c} size="small" />
              ))}
            </Box>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Type de contrat</Typography>
              <Typography variant="body1">{job.typeContrat || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Salaire</Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Euro fontSize="small" color="action" />
                <Typography variant="body1">{salaire}</Typography>
              </Box>
            </Grid>
          </Grid>
          <Box display="flex" gap={2} mt={3}>
            <Button variant="contained" onClick={onApply} disabled={!user || applying}>
              {user ? (applying ? 'Envoi...' : 'Postuler') : 'Connectez-vous pour postuler'}
            </Button>
            <Button variant="outlined" onClick={() => navigator.share ? navigator.share({ title: job.titre, url: window.location.href }) : window.prompt('Copiez l\'URL', window.location.href)}>
              Partager
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default JobDetail;
