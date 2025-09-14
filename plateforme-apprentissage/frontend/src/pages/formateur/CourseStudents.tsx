import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Avatar, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress, MenuItem, Select, InputLabel, FormControl, Link as MuiLink } from '@mui/material';
import { coursService } from '../../services/coursService';

const CourseStudents: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [openBadge, setOpenBadge] = useState(false);
  const [openCert, setOpenCert] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [badgeId, setBadgeId] = useState('');
  const [badges, setBadges] = useState<Array<{ _id: string; nom: string; description: string; image: string; niveau: string }>>([]);
  const [noteFinale, setNoteFinale] = useState<number>(100);
  const [competence, setCompetence] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const res: any = await coursService.getElevesCours(id);
      let list: any[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res?.success && Array.isArray(res.data)) {
        list = res.data;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (Array.isArray(res?.result)) {
        list = res.result;
      } else if (Array.isArray(res?.data?.data)) {
        list = res.data.data;
      }
      setRows(list);
    } catch (e: any) {
      console.error(e);
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;
      setErrorCode(status || null);
      if (status === 401) {
        setError("Non authentifié. Veuillez vous reconnecter.");
      } else if (status === 403) {
        setError("Accès refusé. Seul le formateur propriétaire (ou un admin) peut voir les élèves de ce cours.");
      } else if (status === 404) {
        // Vérifier si le cours existe; si oui => aucun élève, sinon => cours introuvable
        try {
          if (id) {
            await coursService.getCoursById(id);
            setRows([]);
            setError("Aucun élève inscrit pour le moment.");
          } else {
            setError("Cours introuvable.");
          }
        } catch {
          setError("Cours introuvable.");
        }
      } else {
        setError(msg || "Impossible de charger les élèves");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const loadBadges = async () => {
      if (!id) return;
      try {
        const res = await coursService.getBadgesCours(id);
        if (res?.success) setBadges(res.data);
        else setBadges([]);
      } catch (e) {
        console.error(e);
        setBadges([]);
      }
    };
    loadBadges();
  }, [id]);

  const handleAttribuerBadge = async () => {
    if (!id || !selectedStudent || !badgeId) return;
    try {
      await coursService.attribuerBadge(id, selectedStudent._id, badgeId);
      setFeedback('Badge attribué avec succès');
      setOpenBadge(false);
      setBadgeId('');
      await load();
    } catch (e) {
      console.error(e);
      setFeedback("Erreur lors de l'attribution du badge");
    }
  };

  const handleDelivrerCertificat = async () => {
    if (!id || !selectedStudent) return;
    try {
      const res = await coursService.delivrerCertificat(id, {
        apprenantId: selectedStudent._id,
        noteFinale,
        competencesValidees: competence ? [{ nom: competence, niveau: 'debutant' }] : []
      });
      setFeedback('Certificat délivré avec succès');
      const url = res?.data?.downloadUrl;
      if (url) setDownloadUrl(url);
      setOpenCert(false);
      setCompetence('');
      await load();
    } catch (e) {
      console.error(e);
      setFeedback('Erreur lors de la délivrance du certificat');
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
      <Typography variant="h4" gutterBottom>Élèves du cours</Typography>
      {error && (
        <Alert severity={errorCode === 404 ? 'info' : 'error'} sx={{ mb: 2 }}>{error}</Alert>
      )}
      {feedback && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setFeedback(null)}>{feedback}{downloadUrl && (
        <> — <MuiLink href={downloadUrl} target="_blank" rel="noopener">Télécharger le certificat</MuiLink></>
      )}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Élève</TableCell>
              <TableCell>Progression</TableCell>
              <TableCell>Dernière activité</TableCell>
              <TableCell>Badge</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r._id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar>{(r.nom || '?').charAt(0)}</Avatar>
                    <Box>
                      <Typography>{r.nom}</Typography>
                      <Typography variant="body2" color="text.secondary">{r.email}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={`${r.progression || 0}%${r.termine ? ' • Terminé' : ''}`} color={r.termine ? 'success' : 'default'} />
                </TableCell>
                <TableCell>
                  {r.derniereActiviteAt ? new Date(r.derniereActiviteAt).toLocaleString() : '—'}
                </TableCell>
                <TableCell>
                  {r.badgeAttribue ? <Chip label="Badge attribué" color="primary" size="small" /> : <Chip label="Aucun" size="small" />}
                </TableCell>
                <TableCell align="right">
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
                    <Button variant="outlined" size="small" onClick={() => navigate(`/formateur/cours/${id}/eleves/${r._id}`)}>Voir détails</Button>
                    <Button variant="contained" size="small" disabled={!r.termine && (r.progression || 0) < 80} onClick={() => { setSelectedStudent(r); setOpenBadge(true); }}>Attribuer badge</Button>
                    <Button variant="contained" color="secondary" size="small" disabled={!r.termine && (r.progression || 0) < 80} onClick={() => { setSelectedStudent(r); setOpenCert(true); }}>Certificat</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Attribuer Badge */}
      <Dialog open={openBadge} onClose={() => setOpenBadge(false)} fullWidth maxWidth="sm">
        <DialogTitle>Attribuer un badge</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Élève: {selectedStudent?.nom}</Typography>
          <FormControl fullWidth>
            <InputLabel id="badge-select-label">Badge</InputLabel>
            <Select
              labelId="badge-select-label"
              label="Badge"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value as string)}
            >
              {badges.map(b => (
                <MenuItem key={b._id} value={b._id}>
                  {b.nom} • {b.niveau}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBadge(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAttribuerBadge} disabled={!badgeId}>Attribuer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Délivrer Certificat */}
      <Dialog open={openCert} onClose={() => setOpenCert(false)} fullWidth maxWidth="sm">
        <DialogTitle>Délivrer un certificat</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Élève: {selectedStudent?.nom}</Typography>
          <TextField label="Note finale" type="number" fullWidth sx={{ mb: 2 }} value={noteFinale} onChange={(e) => setNoteFinale(parseInt(e.target.value || '0', 10))} />
          <TextField label="Compétence validée (optionnel)" fullWidth value={competence} onChange={(e) => setCompetence(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCert(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleDelivrerCertificat}>Délivrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseStudents;
