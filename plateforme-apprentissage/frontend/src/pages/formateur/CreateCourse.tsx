import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  Grid,
  IconButton,
  Divider,
  Alert,
  Stack,
  
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { coursService } from '../../services/coursService';

interface EtapeForm {
  titre: string;
  description?: string;
  dureeEstimee?: number;
  ordre: number;
  typeContenu?: 'texte' | 'video' | 'audio' | 'image' | 'document';
  contenu?: { texte?: string; video?: string; audio?: string; image?: string; document?: string };
  fichier?: File | null;
}

const categories = [
  'mecanique',
  'couture',
  'maconnerie',
  'informatique',
  'cuisine',
  'autres'
];

const niveaux = ['débutant', 'intermédiaire', 'avancé'];
const langues = ['fr', 'ln', 'wo'];

const CreateCourse: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('couture');
  const [niveau, setNiveau] = useState('débutant');
  const [langue, setLangue] = useState('fr');

  const [etapes, setEtapes] = useState<EtapeForm[]>([
    { titre: '', description: '', dureeEstimee: 5, ordre: 1, typeContenu: 'texte', contenu: {}, fichier: null }
  ]);

  const addEtape = () => {
    setEtapes(prev => [...prev, { titre: '', description: '', dureeEstimee: 5, ordre: prev.length + 1, typeContenu: 'texte', contenu: {}, fichier: null }]);
  };

  const removeEtape = (index: number) => {
    setEtapes(prev => prev.filter((_, i) => i !== index).map((e, i2) => ({ ...e, ordre: i2 + 1 })));
  };

  const updateEtape = (index: number, field: keyof EtapeForm, value: any) => {
    setEtapes(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!titre.trim() || !description.trim()) {
      setError('Veuillez renseigner au minimum le titre et la description.');
      return;
    }

    // Validation simple des étapes
    const hasEmpty = etapes.some(e => !e.titre.trim());
    if (hasEmpty) {
      setError('Chaque étape doit avoir un titre.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        titre,
        description,
        categorie,
        niveau,
        langue,
        // On envoie d'abord les étapes avec texte uniquement; les médias seront uploadés après création
        etapes: etapes.map(e => ({
          titre: e.titre,
          description: e.description,
          contenu: {
            texte: (e.typeContenu === 'texte') ? (e.description || e.contenu?.texte || '') : (e.contenu?.texte || '')
          },
          dureeEstimee: e.dureeEstimee || 5,
          ordre: e.ordre
        }))
      };

      const created = await coursService.createCours(payload);

      // Upload des médias sélectionnés et mise à jour du cours
      const hasFiles = etapes.some(e => e.typeContenu && e.typeContenu !== 'texte' && e.fichier);
      if (created?._id && hasFiles) {
        const updatedEtapes = [...etapes];
        for (let i = 0; i < etapes.length; i++) {
          const et = etapes[i];
          if (et.typeContenu && et.typeContenu !== 'texte' && et.fichier) {
            const uploadType: 'video' | 'document' | 'image' =
              et.typeContenu === 'video' ? 'video' : et.typeContenu === 'image' ? 'image' : 'document';
            try {
              const url = await coursService.uploadRessource(created._id, et.fichier, uploadType);
              const contenu: any = { ...(et.contenu || {}) };
              if (et.typeContenu === 'video') contenu.video = url;
              else if (et.typeContenu === 'audio') contenu.audio = url;
              else if (et.typeContenu === 'image') contenu.image = url;
              else if (et.typeContenu === 'document') contenu.document = url;
              updatedEtapes[i] = { ...et, contenu };
            } catch (e) {
              console.error('Upload échoué pour une étape', e);
            }
          }
        }
        // Mise à jour du cours avec les URLs des médias
        await coursService.updateCours(created._id, {
          etapes: updatedEtapes.map(e => ({
            titre: e.titre,
            description: e.description,
            contenu: e.contenu,
            dureeEstimee: e.dureeEstimee || 5,
            ordre: e.ordre
          }))
        } as any);
      }

      setSuccess('Cours créé avec succès');
      navigate(`/courses`);
    } catch (e: any) {
      console.error(e);
      setError("Impossible de créer le cours. Vérifiez les champs et vos permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Créer un cours</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField label="Titre" fullWidth value={titre} onChange={e => setTitre(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Catégorie" value={categorie} onChange={e => setCategorie(e.target.value)}>
              {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" fullWidth multiline minRows={3} value={description} onChange={e => setDescription(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Niveau" value={niveau} onChange={e => setNiveau(e.target.value)}>
              {niveaux.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Langue" value={langue} onChange={e => setLangue(e.target.value)}>
              {langues.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">Étapes</Typography>
          <Button startIcon={<Add />} onClick={addEtape}>Ajouter une étape</Button>
        </Box>

        {etapes.map((e, idx) => (
          <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField label={`Titre de l'étape #${idx + 1}`} fullWidth value={e.titre} onChange={(ev) => updateEtape(idx, 'titre', ev.target.value)} />
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField label="Description" fullWidth value={e.description} onChange={(ev) => updateEtape(idx, 'description', ev.target.value)} />
              </Grid>
              <Grid item xs={6} md={1}>
                <TextField label="Durée (min)" type="number" fullWidth value={e.dureeEstimee || 0} onChange={(ev) => updateEtape(idx, 'dureeEstimee', parseInt(ev.target.value || '0', 10))} />
              </Grid>
              <Grid item xs={6} md={1}>
                <TextField label="Ordre" type="number" fullWidth value={e.ordre} onChange={(ev) => updateEtape(idx, 'ordre', parseInt(ev.target.value || '1', 10))} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth label="Type de contenu" value={e.typeContenu || 'texte'} onChange={(ev) => updateEtape(idx, 'typeContenu', ev.target.value as any)}>
                  <MenuItem value="texte">Texte</MenuItem>
                  <MenuItem value="video">Vidéo</MenuItem>
                  <MenuItem value="audio">Vocal / Audio</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="document">Document / PDF</MenuItem>
                </TextField>
              </Grid>
              {((e.typeContenu || 'texte') === 'texte') ? (
                <Grid item xs={12}>
                  <TextField label="Contenu texte" fullWidth multiline minRows={3}
                    value={e.contenu?.texte || ''}
                    onChange={(ev) => updateEtape(idx, 'contenu', { ...(e.contenu || {}), texte: ev.target.value })}
                  />
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <Button variant="outlined" component="label">
                      Choisir un fichier
                      <input hidden type="file" accept={
                        (e.typeContenu === 'video') ? 'video/*' :
                        (e.typeContenu === 'audio') ? 'audio/*' :
                        (e.typeContenu === 'image') ? 'image/*' :
                        '.pdf,application/pdf,application/*'
                      }
                      onChange={(event) => {
                        const file = event.target.files && event.target.files[0];
                        if (file) updateEtape(idx, 'fichier', file);
                      }} />
                    </Button>
                    {e.fichier && <Typography variant="body2">{e.fichier.name}</Typography>}
                  </Stack>
                </Grid>
              )}
            </Grid>
            <Box display="flex" justifyContent="flex-end" mt={1}>
              <IconButton color="error" onClick={() => removeEtape(idx)}><Delete /></IconButton>
            </Box>
          </Paper>
        ))}

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Création...' : 'Créer le cours'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateCourse;
