import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Alert, TextField, Divider, Chip, Avatar, Stack } from '@mui/material';
import { groupeService, Groupe } from '../../services/groupeService';
import { useAuth } from '../../contexts/AuthContext';

const GroupeDetail: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupe, setGroupe] = useState<Groupe | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState('');
  const [invSuccess, setInvSuccess] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await groupeService.getGroupe(id);
      setGroupe(res.data || res.groupe || res);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const inviter = async () => {
    if (!id || !inviteEmail) return;
    setInvLoading(true);
    setInvError('');
    setInvSuccess('');
    try {
      const res = await groupeService.inviterApprenant(id, inviteEmail);
      setInvSuccess(res.message || 'Invitation envoyée');
      setInviteEmail('');
      await load();
    } catch (e: any) {
      setInvError(e?.response?.data?.message || e?.message || 'Erreur lors de l\'invitation');
    } finally {
      setInvLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isFormateur = user && groupe && (typeof groupe.formateur !== 'string') && groupe.formateur._id === user._id;

  return (
    <Box>
      {loading ? (
        <Box textAlign="center" py={6}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !groupe ? (
        <Alert severity="warning">Groupe introuvable</Alert>
      ) : (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4">{groupe.nom}</Typography>
              {groupe.description && (
                <Typography color="text.secondary">{groupe.description}</Typography>
              )}
            </Box>
            <Chip label={`Membres: ${Array.isArray(groupe.membres) ? groupe.membres.length : 0}`} color="primary" />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Membres</Typography>
                  {(!groupe.membres || groupe.membres.length === 0) && (
                    <Alert severity="info">Aucun membre pour le moment.</Alert>
                  )}
                  <Stack direction="column" spacing={1}>
                    {(groupe.membres || []).map((m: any) => (
                      <Box key={(m?._id || m).toString()} display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 28, height: 28 }}>{(m?.nom || 'U').charAt(0).toUpperCase()}</Avatar>
                        <Typography>{m?.nom || m}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              {isFormateur && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Inviter un apprenant</Typography>
                    {invError && <Alert severity="error" sx={{ mb: 1 }}>{invError}</Alert>}
                    {invSuccess && <Alert severity="success" sx={{ mb: 1 }}>{invSuccess}</Alert>}
                    <TextField
                      label="Email de l'apprenant"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <Button variant="contained" onClick={inviter} disabled={invLoading || !inviteEmail}>
                      {invLoading ? 'Envoi…' : 'Envoyer l\'invitation'}
                    </Button>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>Invitations</Typography>
                    {(!groupe.invitations || groupe.invitations.length === 0) ? (
                      <Typography color="text.secondary">Aucune invitation</Typography>
                    ) : (
                      <Stack spacing={1}>
                        {groupe.invitations?.map((inv) => (
                          <Box key={inv._id} display="flex" justifyContent="space-between" alignItems="center">
                            <Typography>
                              {(typeof inv.apprenant !== 'string' ? inv.apprenant.nom : inv.apprenant) || '—'}
                            </Typography>
                            <Chip label={inv.statut} color={inv.statut === 'accepte' ? 'success' : inv.statut === 'refuse' ? 'error' : 'warning'} size="small" />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default GroupeDetail;
