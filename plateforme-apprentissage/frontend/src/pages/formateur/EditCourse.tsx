import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  CircularProgress,
  Stack,
  Link as MuiLink,
  Chip
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { coursService } from '../../services/coursService';
import { Cours } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface EtapeForm {
  titre: string;
  description?: string;
  dureeEstimee?: number;
  ordre: number;
  contenu?: { texte?: string; video?: string; audio?: string; image?: string; document?: string };
  typeContenu?: 'texte' | 'video' | 'audio' | 'image' | 'document';
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

const EditCourse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('couture');
  const [niveau, setNiveau] = useState('débutant');
  const [langue, setLangue] = useState('fr');
  const [etapes, setEtapes] = useState<EtapeForm[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const cours: Cours = await coursService.getCoursById(id);
        setTitre(cours.titre || '');
        setDescription((cours as any).description || '');
        setCategorie((cours as any).categorie || 'couture');
        setNiveau((cours as any).niveau || 'débutant');
        setLangue((cours as any).langue || 'fr');
        const etps = (cours as any).etapes || (cours as any).modules || [];
        const f = (cours as any).formateur;
        const fId = (f && typeof f === 'object') ? (f._id || f.id) : f;
        setOwnerId(fId || null);
        const mapped: EtapeForm[] = etps.map((e: any, i: number) => ({
          titre: e.titre || '',
          description: e.description || e.contenu?.texte || '',
          dureeEstimee: e.dureeEstimee || e.duree || 5,
          ordre: e.ordre || i + 1,
          contenu: {
            texte: e.contenu?.texte || e.description || '',
            video: e.contenu?.video,
            audio: e.contenu?.audio,
            image: e.contenu?.image,
            document: e.contenu?.document
          },
          typeContenu: e.contenu?.video ? 'video' : e.contenu?.audio ? 'audio' : e.contenu?.image ? 'image' : e.contenu?.document ? 'document' : 'texte'
        }));
        setEtapes(mapped.length ? mapped : [{ titre: '', description: '', dureeEstimee: 5, ordre: 1 }]);
      } catch (e) {
        console.error(e);
        setError('Impossible de charger le cours');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleUploadMedia = async (index: number, file: File) => {
    if (!id || !file) return;
    const etape = etapes[index];
    const kind = etape.typeContenu || 'texte';
    const uploadType: 'video' | 'document' | 'image' =
      kind === 'video' ? 'video' : kind === 'image' ? 'image' : 'document';
    try {
      const url = await coursService.uploadRessource(id, file, uploadType);
      setEtapes(prev => prev.map((e, i) => {
        if (i !== index) return e;
        const contenu = { ...(e.contenu || {}) } as any;
        if (kind === 'video') contenu.video = url;
        else if (kind === 'audio') contenu.audio = url;
        else if (kind === 'image') contenu.image = url;
        else if (kind === 'document') contenu.document = url;
        return { ...e, contenu };
      }));
    } catch (err) {
      console.error('Upload media échoué', err);
      setError("Échec de l'upload. Vérifiez le type et la taille du fichier.");
    }
  };

  const addEtape = () => {
    setEtapes(prev => [...prev, { titre: '', description: '', dureeEstimee: 5, ordre: prev.length + 1 }]);
  };

  const removeEtape = (index: number) => {
    setEtapes(prev => prev.filter((_, i) => i !== index).map((e, i2) => ({ ...e, ordre: i2 + 1 })));
  };

  const updateEtape = (index: number, field: keyof EtapeForm, value: any) => {
    setEtapes(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const handleSave = async () => {
    if (!id) return;
    setError(null);
    setSuccess(null);

    // Vérification d'appartenance côté client pour un message plus clair
    if (user && ownerId && user.role !== 'admin' && user._id !== ownerId && (user as any).id !== ownerId) {
      setError("Vous n'êtes pas le propriétaire de ce cours. Connectez-vous avec le compte du formateur qui l'a créé ou demandez un administrateur de vous le réassigner.");
      return;
    }

    if (!titre.trim() || !description.trim()) {
      setError('Veuillez renseigner au minimum le titre et la description.');
      return;
    }

    const hasEmpty = etapes.some(e => !e.titre.trim());
    if (hasEmpty) {
      setError('Chaque étape doit avoir un titre.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        titre,
        description,
        categorie,
        niveau,
        langue,
        etapes: etapes.map(e => ({
          titre: e.titre,
          description: e.description,
          contenu: {
            texte: e.typeContenu === 'texte' ? (e.description || e.contenu?.texte || '') : (e.contenu?.texte || ''),
            video: e.typeContenu === 'video' ? e.contenu?.video : e.contenu?.video,
            audio: e.typeContenu === 'audio' ? e.contenu?.audio : e.contenu?.audio,
            image: e.typeContenu === 'image' ? e.contenu?.image : e.contenu?.image,
            document: e.typeContenu === 'document' ? e.contenu?.document : e.contenu?.document
          },
          dureeEstimee: e.dureeEstimee || 5,
          ordre: e.ordre
        }))
      };
      await coursService.updateCours(id, payload);
      setSuccess('Cours mis à jour. Si ce cours était approuvé, il a été repassé en modération.');
      navigate(`/formateur/cours/${id}/eleves`);
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || 'Mise à jour impossible';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Modifier le cours</Typography>
      <Box display="flex" gap={2} mb={2}>
        <Chip label={`Étapes: ${etapes.length}`} />
        <Chip label={`Durée totale: ${etapes.reduce((sum, e) => sum + (e.dureeEstimee || 0), 0)} min`} color="info" />
      </Box>
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
                        if (file) handleUploadMedia(idx, file);
                      }} />
                    </Button>
                    {(e.typeContenu === 'video' && e.contenu?.video) && <MuiLink href={e.contenu.video} target="_blank" rel="noopener">Vidéo actuelle</MuiLink>}
                    {(e.typeContenu === 'audio' && e.contenu?.audio) && <MuiLink href={e.contenu.audio} target="_blank" rel="noopener">Audio actuel</MuiLink>}
                    {(e.typeContenu === 'image' && e.contenu?.image) && <MuiLink href={e.contenu.image} target="_blank" rel="noopener">Image actuelle</MuiLink>}
                    {(e.typeContenu === 'document' && e.contenu?.document) && <MuiLink href={e.contenu.document} target="_blank" rel="noopener">Document actuel</MuiLink>}
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
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EditCourse;
