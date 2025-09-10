import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pause,
  Delete,
  Visibility,
  PlayArrow,
  VideoLibrary,
  Person
} from '@mui/icons-material';
import { moderationService } from '../../services/moderationService';

interface Cours {
  _id: string;
  titre: string;
  description: string;
  formateur: {
    _id: string;
    nom: string;
    email: string;
  };
  categorie: string;
  niveau: string;
  statutModeration: 'en_attente' | 'approuve' | 'rejete' | 'suspendu';
  commentaireModeration?: string;
  dateModeration?: string;
  createdAt: string;
  etapes: any[];
  imageCouverture?: string;
}

interface DialogState {
  open: boolean;
  type: 'approuver' | 'rejeter' | 'suspendre' | 'supprimer' | null;
  cours: Cours | null;
}

const ModerationPanel: React.FC = () => {
  const [coursEnAttente, setCoursEnAttente] = useState<Cours[]>([]);
  const [historique, setHistorique] = useState<Cours[]>([]);
  const [statistiques, setStatistiques] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    type: null,
    cours: null
  });
  const [commentaire, setCommentaire] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursData, historiqueData, statsData] = await Promise.all([
        moderationService.getCoursEnAttente(),
        moderationService.getHistoriqueModeration(),
        moderationService.getStatistiquesModeration()
      ]);
      
      setCoursEnAttente(coursData);
      setHistorique(historiqueData);
      setStatistiques(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!dialog.cours || !dialog.type) return;

    setLoading(true);
    try {
      const coursId = dialog.cours._id;
      
      switch (dialog.type) {
        case 'approuver':
          await moderationService.approuverCours(coursId, commentaire);
          break;
        case 'rejeter':
          await moderationService.rejeterCours(coursId, commentaire);
          break;
        case 'suspendre':
          await moderationService.suspendreCours(coursId, commentaire);
          break;
        case 'supprimer':
          await moderationService.supprimerCours(coursId, commentaire);
          break;
      }

      setDialog({ open: false, type: null, cours: null });
      setCommentaire('');
      await loadData();
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      setError('Erreur lors de l\'exécution de l\'action');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (type: DialogState['type'], cours: Cours) => {
    setDialog({ open: true, type, cours });
    setCommentaire('');
    setError('');
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'warning';
      case 'approuve': return 'success';
      case 'rejete': return 'error';
      case 'suspendu': return 'secondary';
      default: return 'default';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'approuve': return 'Approuvé';
      case 'rejete': return 'Rejeté';
      case 'suspendu': return 'Suspendu';
      default: return statut;
    }
  };

  const renderCoursCard = (cours: Cours, showActions = true) => (
    <Card key={cours._id} sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" mb={1}>
              <VideoLibrary sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" component="h3">
                {cours.titre}
              </Typography>
              <Chip
                label={getStatutLabel(cours.statutModeration)}
                color={getStatutColor(cours.statutModeration) as any}
                size="small"
                sx={{ ml: 2 }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {cours.description}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Box display="flex" alignItems="center">
                <Person sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2">
                  {cours.formateur.nom}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {cours.categorie} • {cours.niveau}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cours.etapes?.length || 0} étapes
              </Typography>
            </Box>

            {cours.commentaireModeration && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Commentaire:</strong> {cours.commentaireModeration}
                </Typography>
              </Alert>
            )}
          </Grid>

          {showActions && cours.statutModeration === 'en_attente' && (
            <Grid item xs={12} md={4}>
              <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-end">
                <Tooltip title="Prévisualiser">
                  <IconButton size="small" color="info">
                    <Visibility />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Approuver">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => openDialog('approuver', cours)}
                  >
                    <CheckCircle />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Rejeter">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => openDialog('rejeter', cours)}
                  >
                    <Cancel />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Suspendre">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => openDialog('suspendre', cours)}
                  >
                    <Pause />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Supprimer">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => openDialog('supprimer', cours)}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Modération des Contenus
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                En attente
              </Typography>
              <Typography variant="h4" color="warning.main">
                {statistiques.en_attente || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approuvés
              </Typography>
              <Typography variant="h4" color="success.main">
                {statistiques.approuve || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejetés
              </Typography>
              <Typography variant="h4" color="error.main">
                {statistiques.rejete || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Suspendus
              </Typography>
              <Typography variant="h4" color="secondary.main">
                {statistiques.suspendu || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`En attente (${coursEnAttente.length})`} />
          <Tab label="Historique" />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Cours en attente de modération
          </Typography>
          {coursEnAttente.length === 0 ? (
            <Alert severity="info">
              Aucun cours en attente de modération
            </Alert>
          ) : (
            coursEnAttente.map(cours => renderCoursCard(cours, true))
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Historique de modération
          </Typography>
          {historique.length === 0 ? (
            <Alert severity="info">
              Aucun historique disponible
            </Alert>
          ) : (
            historique.map(cours => renderCoursCard(cours, false))
          )}
        </Box>
      )}

      {/* Dialog de confirmation */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, type: null, cours: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.type === 'approuver' && 'Approuver le cours'}
          {dialog.type === 'rejeter' && 'Rejeter le cours'}
          {dialog.type === 'suspendre' && 'Suspendre le cours'}
          {dialog.type === 'supprimer' && 'Supprimer le cours'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Cours: <strong>{dialog.cours?.titre}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Formateur: {dialog.cours?.formateur.nom}
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label={dialog.type === 'rejeter' ? 'Raison du rejet (obligatoire)' : 'Commentaire (optionnel)'}
            fullWidth
            multiline
            rows={3}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            required={dialog.type === 'rejeter'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, type: null, cours: null })}>
            Annuler
          </Button>
          <Button 
            onClick={handleAction} 
            variant="contained"
            disabled={dialog.type === 'rejeter' && !commentaire.trim()}
            color={dialog.type === 'approuver' ? 'success' : 'error'}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModerationPanel;
