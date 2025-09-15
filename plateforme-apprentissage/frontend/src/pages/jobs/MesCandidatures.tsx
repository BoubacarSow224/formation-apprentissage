import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Grid, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';

interface MesCandItem {
  _id: string;
  titre: string;
  entreprise?: { _id: string; nom: string };
  typeContrat?: string;
  salaire?: string;
  description?: string;
  dateCreation?: string;
  candidature?: { statut: string; dateCandidature: string; commentaire?: string } | null;
}

const MesCandidatures: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MesCandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/offres-emploi/mes-candidatures');
        const arr = Array.isArray(res.data?.data) ? res.data.data : [];
        setItems(arr);
      } catch (e: any) {
        const status = e?.response?.status;
        // Si aucune candidature (ex: 404) ou réponse vide, afficher simplement l'état vide
        if (status === 404) {
          setItems([]);
          setError(null);
        } else {
          // Pour les erreurs inattendues (réseau, 500, etc.)
          setItems([]);
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <Typography>Chargement...</Typography>;
  // Même en cas d'erreur inattendue, on affiche un état vide plutôt qu'un message bloquant

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Mes Candidatures</Typography>
      {items.length === 0 && (
        <Typography color="text.secondary">Vous n'avez pas encore postulé à des offres.</Typography>
      )}
      <Grid container spacing={2}>
        {items.map((it) => (
          <Grid item xs={12} md={6} key={it._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component={Link} to={`/jobs/${it._id}`} style={{ textDecoration: 'none' }}>
                  {it.titre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {it.entreprise?.nom || 'Entreprise'} • {it.typeContrat || 'N/A'} • {it.salaire || 'N/A'}
                </Typography>
                <Box mt={1} display="flex" alignItems="center" gap={1}>
                  <Chip label={it.candidature?.statut || 'en_attente'} size="small" color={it.candidature?.statut === 'acceptee' ? 'success' : it.candidature?.statut === 'refusee' ? 'error' : 'warning'} />
                  <Typography variant="caption" color="text.secondary">
                    Candidaté le {it.candidature?.dateCandidature ? new Date(it.candidature.dateCandidature).toLocaleDateString() : ''}
                  </Typography>
                </Box>
                {it.candidature?.commentaire && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Commentaire: {it.candidature.commentaire}
                  </Typography>
                )}
                <Box mt={2}>
                  <Button variant="outlined" component={Link} to={`/jobs/${it._id}`}>Voir l'offre</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MesCandidatures;
