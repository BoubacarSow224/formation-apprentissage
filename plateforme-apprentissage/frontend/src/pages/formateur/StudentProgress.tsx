import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Chip, Stack, Button, Alert, CircularProgress, Link as MuiLink } from '@mui/material';
import { CheckCircle, HourglassBottom, RadioButtonUnchecked } from '@mui/icons-material';
import { coursService } from '../../services/coursService';

const StudentProgress: React.FC = () => {
  const { id, apprenantId } = useParams<{ id: string; apprenantId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [certUrl, setCertUrl] = useState<string | null>(null);

  const load = async () => {
    if (!id || !apprenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await coursService.getProgressionEleve(id, apprenantId);
      if (res?.success) setData(res.data);
      else setData(null);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger la progression de l'élève");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, apprenantId]);

  useEffect(() => {
    const loadCert = async () => {
      if (!id || !apprenantId) return;
      try {
        const res = await coursService.getCertificatEleve(id, apprenantId);
        if (res?.success && res.data?.downloadUrl) {
          setCertUrl(res.data.downloadUrl);
        } else {
          setCertUrl(null);
        }
      } catch (e) {
        setCertUrl(null);
      }
    };
    loadCert();
  }, [id, apprenantId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data) {
    return <Typography>Aucune donnée</Typography>;
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={2}>
        <Typography variant="h5">
          {data.eleve.nom} • {data.cours.titre}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={`Progression ${data.progression}%`} color={data.termine ? 'success' : 'default'} />
          {data.badgeAttribue ? <Chip label="Badge attribué" color="primary" /> : <Chip label="Sans badge" />}
        </Stack>
      </Stack>

      <Paper>
        <List>
          {data.etapes.map((et: any) => (
            <ListItem key={et.index} divider>
              <ListItemIcon>
                {et.completed ? (
                  <CheckCircle color="success" />
                ) : data.progression > 0 ? (
                  <HourglassBottom color="warning" />
                ) : (
                  <RadioButtonUnchecked color="disabled" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={`Étape ${et.index + 1}: ${et.titre}`}
                secondary={et.quiz ? `Quiz: ${et.quiz}` : undefined}
              />
              <Chip label={et.completed ? 'Terminé' : 'En cours'} size="small" color={et.completed ? 'success' : 'default'} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={3}>
        <Button variant="outlined" onClick={() => navigate(-1)}>Retour</Button>
        <Button component={RouterLink} to={`/formateur/cours/${id}/eleves`}>
          Voir liste des élèves
        </Button>
        <Button component={RouterLink} to={`/formateur/cours/${id}/historique-badges`} variant="contained">
          Historique des badges
        </Button>
        {certUrl && (
          <Button variant="contained" color="success" href={certUrl} target="_blank" rel="noopener">
            Télécharger le certificat
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default StudentProgress;
