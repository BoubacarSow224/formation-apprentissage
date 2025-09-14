import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Rating,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import { coursService } from '../../services/coursService';
import { useAuth } from '../../contexts/AuthContext';
import { Cours } from '../../types';

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cours, setCours] = useState<Cours[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [avgProgress, setAvgProgress] = useState<Record<string, number>>({});
  const [metaByCourse, setMetaByCourse] = useState<Record<string, { steps: number; minutes: number }>>({});
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchCours = async () => {
      try {
        if (user?.role === 'apprenant') {
          // Charger uniquement les cours publiés (approuvés & publics)
          const arr = await coursService.getCoursPublics();
          const list = Array.isArray((arr as any)?.data) ? (arr as any).data : (Array.isArray(arr) ? arr : []);
          setCours(list as any);
          setLastUpdate(new Date());
        } else {
          // Formateur: afficher tous ses cours
          const arr = await coursService.getMesCoursFormateur();
          let mine = (arr as any)?.data ?? (Array.isArray(arr) ? arr : []);
          // Fallback si vide: récupérer via route publique par formateur ID
          if ((!mine || mine.length === 0) && user?._id) {
            try {
              const alt = await coursService.getCoursParFormateur(user._id);
              mine = (alt as any)?.data ?? (Array.isArray(alt) ? alt : []);
            } catch (e) {
              console.error('Fallback getCoursParFormateur error:', e);
            }
          }
          setMyCourses(mine as any);
          // Calculer la progression moyenne par cours (si peu d'éléments, appels parallèles acceptables)
          const entries = await Promise.all(
            (mine as any[]).map(async (c) => {
              try {
                const el = await coursService.getElevesCours(c._id);
                const students = (el as any)?.data ?? (Array.isArray(el) ? el : []);
                const avg = students.length ? Math.round((students.reduce((s: number, it: any) => s + (it.progression || 0), 0) / students.length)) : 0;
                return [c._id, avg] as const;
              } catch {
                return [c._id, 0] as const;
              }
            })
          );
          const map: Record<string, number> = {};
          entries.forEach(([id, avg]) => { map[id] = avg; });
          setAvgProgress(map);

          // Étapes & durée totale
          const metas = await Promise.all(
            (mine as any[]).map(async (c) => {
              try {
                const full = await coursService.getCoursById(c._id);
                const etapes: any[] = (full as any)?.data?.etapes ?? (full as any)?.etapes ?? [];
                const steps = Array.isArray(etapes) ? etapes.length : 0;
                const minutes = Array.isArray(etapes) ? etapes.reduce((sum, e) => sum + (e.dureeEstimee || e.duree || 0), 0) : 0;
                return [c._id, { steps, minutes }] as const;
              } catch {
                return [c._id, { steps: 0, minutes: 0 }] as const;
              }
            })
          );
          const metaMap: Record<string, { steps: number; minutes: number }> = {};
          metas.forEach(([id, m]) => { metaMap[id] = m; });
          setMetaByCourse(metaMap);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des cours:', error);
        setCours([]);
        setMyCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCours();

    // Polling auto pour l'apprenant: rafraîchir la liste toutes les 10s
    let interval: any;
    if (user?.role === 'apprenant') {
      interval = setInterval(() => {
        fetchCours();
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  const filteredCours = cours.filter(cours => {
    const title = (cours.titre || '').toLowerCase();
    const desc = (cours.description || '').toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase()) || desc.includes(searchTerm.toLowerCase());
    const matchesNiveau = !niveauFilter || cours.niveau === niveauFilter;
    const matchesCategorie = !categorieFilter || cours.categorie === categorieFilter;
    
    return matchesSearch && matchesNiveau && matchesCategorie;
  });

  const niveaux = [...new Set(cours.map(c => c.niveau).filter(Boolean))];
  const categories = [...new Set(cours.map(c => c.categorie).filter(Boolean))];

  if (loading) {
    return <Typography>Chargement des cours...</Typography>;
  }

  // Vue Formateur: Mes Cours (gestion)
  if (!loading && user?.role === 'formateur') {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">Mes Cours</Typography>
          <Button variant="contained" onClick={() => navigate('/formateur/cours/nouveau')}>Créer un cours</Button>
        </Box>

        <Grid container spacing={3}>
          {myCourses.map((c) => (
            <Grid item xs={12} md={6} lg={4} key={c._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" gutterBottom sx={{ mr: 1 }}>{c.titre}</Typography>
                    {(() => {
                      const moderation = (c as any).statutModeration;
                      if (moderation === 'rejete') {
                        return <Chip label="Rejeté" color="error" size="small" />;
                      }
                      const isApproved = !!c.estApprouve;
                      const isPublic = !!c.estPublic;
                      const status = isApproved ? (isPublic ? 'Publié' : 'Approuvé') : 'En attente';
                      const color: 'default' | 'success' | 'warning' | 'info' =
                        status === 'Publié' ? 'success' : (status === 'En attente' ? 'warning' : 'info');
                      return <Chip label={status} color={color} size="small" />;
                    })()}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Élèves: {c.students ?? 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Prog. moyenne: {avgProgress[c._id] ?? 0}%</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Approuvé: {c.estApprouve ? 'Oui' : 'Non'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Étapes: {metaByCourse[c._id]?.steps ?? 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Durée: {metaByCourse[c._id]?.minutes ?? 0} min</Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/formateur/cours/${c._id}/modifier`)}>Modifier</Button>
                  <Button size="small" onClick={() => navigate(`/formateur/cours/${c._id}/eleves`)}>Suivi élèves</Button>
                  <Button size="small" onClick={() => navigate(`/formateur/cours/${c._id}/historique-badges`)}>Gérer badges</Button>
                  {(() => {
                    const isApproved = !!c.estApprouve;
                    const isPublic = !!c.estPublic;
                    const busy = !!publishing[c._id];
                    if (!isApproved) return null; // pas d'action de publication tant que non approuvé
                    return isPublic ? (
                      <Button size="small" color="warning" disabled={busy}
                        onClick={async () => {
                          setPublishing(prev => ({ ...prev, [c._id]: true }));
                          // Optimistic update
                          setMyCourses(prev => prev.map(it => it._id === c._id ? { ...it, estPublic: false } : it));
                          try {
                            await coursService.depublierCours(c._id);
                            setSnack({ open: true, message: 'Cours dépublié', severity: 'success' });
                          } catch (e) {
                            console.error(e);
                            // rollback
                            setMyCourses(prev => prev.map(it => it._id === c._id ? { ...it, estPublic: true } : it));
                            setSnack({ open: true, message: 'Échec de la dépublication', severity: 'error' });
                          } finally {
                            setPublishing(prev => ({ ...prev, [c._id]: false }));
                          }
                        }}>Dépublier</Button>
                    ) : (
                      <Button size="small" color="success" disabled={busy}
                        onClick={async () => {
                          setPublishing(prev => ({ ...prev, [c._id]: true }));
                          // Optimistic update
                          setMyCourses(prev => prev.map(it => it._id === c._id ? { ...it, estPublic: true } : it));
                          try {
                            await coursService.publierCours(c._id);
                            setSnack({ open: true, message: 'Cours publié', severity: 'success' });
                          } catch (e) {
                            console.error(e);
                            // rollback
                            setMyCourses(prev => prev.map(it => it._id === c._id ? { ...it, estPublic: false } : it));
                            setSnack({ open: true, message: 'Échec de la publication', severity: 'error' });
                          } finally {
                            setPublishing(prev => ({ ...prev, [c._id]: false }));
                          }
                        }}>Publier</Button>
                    );
                  })()}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {myCourses.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">Aucun cours créé pour le moment</Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/formateur/cours/nouveau')}>Créer un cours</Button>
          </Box>
        )}
        {/* Snackbar notifications */}
        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnack(prev => ({ ...prev, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        </Snackbar>

      </Box>
    );
  }

  // Vue Apprenant: Catalogue public
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Catalogue des Cours
      </Typography>

      {/* Filtres */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Rechercher un cours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Niveau</InputLabel>
              <Select
                value={niveauFilter}
                label="Niveau"
                onChange={(e) => setNiveauFilter(e.target.value)}
              >
                <MenuItem value="">Tous les niveaux</MenuItem>
                {niveaux.map(niveau => (
                  <MenuItem key={niveau} value={niveau}>{niveau}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={categorieFilter}
                label="Catégorie"
                onChange={(e) => setCategorieFilter(e.target.value)}
              >
                <MenuItem value="">Toutes les catégories</MenuItem>
                {categories.map(categorie => (
                  <MenuItem key={categorie} value={categorie}>{categorie}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setNiveauFilter('');
                setCategorieFilter('');
              }}
            >
              Réinitialiser
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              onClick={async () => {
                if (refreshing) return; // éviter double-clic
                try {
                  setRefreshing(true);
                  const arr = await coursService.getCoursPublics();
                  const list = Array.isArray((arr as any)?.data) ? (arr as any).data : (Array.isArray(arr) ? arr : []);
                  setCours(list as any);
                  setLastUpdate(new Date());
                } finally {
                  setRefreshing(false);
                }
              }}
              startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              Actualiser les cours
            </Button>
            {lastUpdate && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Liste des cours */}
      <Grid container spacing={3}>
        {filteredCours.map((cours) => (
          <Grid item xs={12} sm={6} md={4} key={cours._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {cours.titre}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Chip label={cours.niveau} color="primary" size="small" sx={{ mr: 1 }} />
                  <Chip label={cours.categorie} variant="outlined" size="small" />
                </Box>

                {cours.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {cours.description.substring(0, 100)}...
                  </Typography>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={cours.note} readOnly size="small" />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({cours.nombreEvaluations})
                  </Typography>
                </Box>

                {typeof cours.duree !== 'undefined' && (
                  <Typography variant="body2" color="text.secondary">
                    Durée: {cours.duree}h
                  </Typography>
                )}
                
                {cours.formateur && (
                  <Typography variant="body2" color="text.secondary">
                    {(() => {
                      const f: any = (cours as any).formateur;
                      const label = typeof f === 'string' ? f : (f?.nom ?? 'Formateur');
                      return <>Formateur: {label}</>;
                    })()}
                  </Typography>
                )}

                {typeof cours.prix !== 'undefined' && (
                  <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                    {cours.prix}€
                  </Typography>
                )}
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/courses/${cours._id}`)}
                >
                  Voir détails
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigate(`/courses/${cours._id}`)}
                >
                  S'inscrire
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredCours.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Aucun cours trouvé
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Essayez de modifier vos critères de recherche
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Courses;
