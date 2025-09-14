import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Alert, TextField, Stack, Divider, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { groupeService, Groupe } from '../../services/groupeService';
import { useAuth } from '../../contexts/AuthContext';

const MesGroupes: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [newNom, setNewNom] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviteInputs, setInviteInputs] = useState<Record<string, string>>({});
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitesByGroup, setInvitesByGroup] = useState<Record<string, any[]>>({});
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await groupeService.getMesGroupes();
      setGroupes(res.data || res.groupes || res); // support various shapes
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isOwner = (g: Groupe) => {
    const ownerId = (g.formateur as any)?._id || (g.formateur as any) || '';
    const uid = (user as any)?._id || (user as any)?.id || '';
    return ownerId && uid && ownerId.toString() === uid.toString();
  };

  const handleCreate = async () => {
    const nom = newNom.trim();
    if (!nom || creating) return;
    setCreating(true);
    setError('');
    try {
      await groupeService.createGroupe({ nom, description: newDesc.trim() || undefined });
      setNewNom('');
      setNewDesc('');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Impossible de créer le groupe");
    } finally {
      setCreating(false);
    }
  };

  const handleInviteChange = (id: string, v: string) => {
    setInviteInputs(prev => ({ ...prev, [id]: v }));
  };

  const handleInvite = async (id: string) => {
    const email = (inviteInputs[id] || '').trim();
    if (!email || invitingId) return;
    setInvitingId(id);
    setError('');
    try {
      await groupeService.inviterApprenant(id, email);
      setInviteInputs(prev => ({ ...prev, [id]: '' }));
      await handleLoadInvitations(id);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Invitation impossible");
    } finally {
      setInvitingId(null);
    }
  };

  const handleLoadInvitations = async (id: string) => {
    try {
      const res = await groupeService.listerInvitations(id);
      const list = res.data || res.invitations || res;
      setInvitesByGroup(prev => ({ ...prev, [id]: Array.isArray(list) ? list : [] }));
    } catch (e) {
      // silencieux
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Mes Groupes</Typography>
        <Button variant="outlined" onClick={load} disabled={loading}>
          {loading ? 'Chargement…' : 'Rafraîchir'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {user && (user as any)?.role === 'formateur' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Créer un groupe</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <TextField label="Nom du groupe" value={newNom} onChange={e => setNewNom(e.target.value)} fullWidth />
              <TextField label="Description (optionnel)" value={newDesc} onChange={e => setNewDesc(e.target.value)} fullWidth />
              <Button variant="contained" onClick={handleCreate} disabled={creating || !newNom.trim()}>
                {creating ? 'Création…' : 'Créer'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Box textAlign="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {user && (user as any)?.role === 'apprenant' && (
            <Grid item xs={12}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Mes invitations</Typography>
                  <Button size="small" variant="outlined" onClick={async () => {
                    try {
                      const res = await groupeService.getMesInvitations();
                      const list = res.data || res;
                      // Regrouper visuellement par groupe
                      const grouped: Record<string, any[]> = {};
                      (Array.isArray(list) ? list : []).forEach((it: any) => {
                        const gid = it.groupeId || it.groupe || 'unknown';
                        if (!grouped[gid]) grouped[gid] = [];
                        grouped[gid].push(it);
                      });
                      setInvitesByGroup(grouped);
                    } catch (e) {
                      // noop
                    }
                  }}>Actualiser mes invitations</Button>

                  {Object.keys(invitesByGroup).length === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>Aucune invitation en attente.</Alert>
                  )}

                  {Object.entries(invitesByGroup).map(([gid, items]) => (
                    <Box key={gid} mt={2}>
                      <Typography variant="subtitle1">Groupe: {gid}</Typography>
                      <Stack direction="column" spacing={1} mt={1}>
                        {(items as any[]).map((it) => (
                          <Stack key={it.invitationId || it._id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                            <Typography variant="body2">De: {it?.formateur?.email || it?.formateur || 'formateur'}</Typography>
                            <Chip size="small" label={it.statut || 'en_attente'} />
                            {it.statut === 'en_attente' && (
                              <Stack direction="row" spacing={1}>
                                <Button size="small" variant="contained" color="success" onClick={async () => {
                                  try { await groupeService.repondreInvitation(gid, it.invitationId || it._id, 'accepte'); } catch {}
                                }}>Accepter</Button>
                                <Button size="small" variant="outlined" color="error" onClick={async () => {
                                  try { await groupeService.repondreInvitation(gid, it.invitationId || it._id, 'refuse'); } catch {}
                                }}>Refuser</Button>
                              </Stack>
                            )}
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}
          {groupes.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">Aucun groupe pour le moment.</Alert>
            </Grid>
          )}
          {groupes.map((g) => (
            <Grid item xs={12} md={6} key={g._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {g.nom}
                  </Typography>
                  {g.description && (
                    <Typography color="text.secondary" paragraph>
                      {g.description}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Membres: {Array.isArray(g.membres) ? g.membres.length : 0}
                  </Typography>
                  <Button variant="contained" onClick={() => navigate(`/groupes/${g._id}`)} sx={{ mr: 1 }}>
                    Ouvrir
                  </Button>
                  {isOwner(g) && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>Inviter un apprenant</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                        <TextField
                          size="small"
                          label="Email de l'apprenant"
                          value={inviteInputs[g._id] || ''}
                          onChange={(e) => handleInviteChange(g._id, e.target.value)}
                          fullWidth
                        />
                        <Button variant="outlined" onClick={() => handleInvite(g._id)} disabled={invitingId === g._id}>
                          {invitingId === g._id ? 'Envoi…' : 'Inviter'}
                        </Button>
                        <Button variant="text" onClick={() => handleLoadInvitations(g._id)}>
                          Voir invitations
                        </Button>
                      </Stack>
                      {(invitesByGroup[g._id] || []).length > 0 && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom>Invitations</Typography>
                          <Stack direction="column" spacing={1}>
                            {(invitesByGroup[g._id] || []).map((inv: any) => (
                              <Stack key={inv._id} direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2">{inv?.apprenant?.email || inv?.apprenant}</Typography>
                                <Chip size="small" label={inv?.statut || 'en_attente'} color={inv?.statut === 'accepte' ? 'success' : inv?.statut === 'refuse' ? 'error' : 'default'} />
                              </Stack>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MesGroupes;
