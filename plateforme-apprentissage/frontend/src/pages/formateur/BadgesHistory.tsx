import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress, Alert, Button } from '@mui/material';
import { coursService } from '../../services/coursService';

const BadgesHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await coursService.getHistoriqueBadges(id);
      if (res?.success) setRows(res.data);
      else setRows([]);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger l'historique des badges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Historique des badges</Typography>
        <Button component={RouterLink} to={`/formateur/cours/${id}/eleves`} variant="outlined">Voir élèves</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Élève</TableCell>
              <TableCell>Badge</TableCell>
              <TableCell>Date d'attribution</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.utilisateurId}-${r.badgeId}-${r.dateObtention}`}>
                <TableCell>
                  <Typography>{r.nom}</Typography>
                  <Typography variant="body2" color="text.secondary">{r.email}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={r.badgeId} />
                </TableCell>
                <TableCell>
                  {r.dateObtention ? new Date(r.dateObtention).toLocaleString() : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default BadgesHistory;
