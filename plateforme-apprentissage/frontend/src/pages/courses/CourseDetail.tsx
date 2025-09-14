import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Stack
} from '@mui/material';
import { ExpandMore, PlayArrow, Quiz, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { coursService } from '../../services/coursService';
import { useAuth } from '../../contexts/AuthContext';
import { Cours } from '../../types';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cours, setCours] = useState<Cours | null>(null);
  const [loading, setLoading] = useState(true);
  const [inscrit, setInscrit] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | false>(0);

  useEffect(() => {
    const fetchCours = async () => {
      if (id) {
        try {
          const data = await coursService.getCoursById(id);
          setCours(data);
          setInscrit(user?.coursSuivis?.some(cours => cours.cours === id) || false);
          // Charger progression persistée
          // 1) Essayer via API
          try {
            const prog = await coursService.getProgression(id);
            const entry = Array.isArray(prog) ? prog.find((p: any) => (p.coursId === id) || (p.cours === id)) : prog;
            if (entry && Array.isArray(entry.modules)) {
              const doneIdx: number[] = [];
              entry.modules.forEach((m: any, idx: number) => {
                if (m.completed || m.progression === 100) doneIdx.push(idx);
              });
              setCompletedSteps(doneIdx);
            }
          } catch (e) {
            // 2) Fallback localStorage
            const userKey = (user as any)?._id || (user as any)?.id || 'anon';
            const key = `progress:${userKey}:${id}`;
            const raw = localStorage.getItem(key);
            if (raw) {
              try { setCompletedSteps(JSON.parse(raw)); } catch {}
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement du cours:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCours();
  }, [id, user]);

  const handleInscription = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (id) {
      try {
        await coursService.inscrireCours(id);
        setInscrit(true);
      } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
      }
    }
  };

  const handleCommencer = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    try {
      await coursService.demarrerCours(id);
      setInscrit(true);
      setProgressMessage('Cours démarré !');
    } catch (e) {
      console.error('Erreur au démarrage du cours:', e);
      setProgressMessage("Impossible de démarrer le cours");
    }
  };

  const handleTerminerEtape = async (index: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    try {
      await coursService.terminerEtape(id, index);
      setProgressMessage(`Étape ${index + 1} marquée comme terminée`);
    } catch (e) {
      console.error('Erreur lors de la mise à jour de l\'étape:', e);
      setProgressMessage("Impossible de mettre à jour la progression");
    }
  };

  const handleTerminerCours = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    try {
      await coursService.terminerCours(id);
      setProgressMessage('Cours terminé !');
    } catch (e) {
      console.error('Erreur lors de la complétion du cours:', e);
      setProgressMessage("Impossible de terminer le cours");
    }
  };

  if (loading) {
    return <Typography>Chargement du cours...</Typography>;
  }

  if (!cours) {
    return <Typography>Cours introuvable</Typography>;
  }

  // Préparer les étapes/modules et la durée totale
  const steps: any[] = ((cours as any)?.etapes) || (cours as any)?.modules || [];
  const totalMinutes = (cours as any)?.dureeTotale ?? steps.reduce((sum, s) => sum + (s.dureeEstimee || s.duree || 0), 0);
  const progressPct = steps.length ? Math.round((completedSteps.length / steps.length) * 100) : 0;
  const prereq: string[] = ((cours as any)?.prerequis) || [];
  const objectifs: string[] = ((cours as any)?.competencesAcquises) || ((cours as any)?.objectifs) || [];
  const formateurLabel: string = (() => {
    const f: any = (cours as any).formateur;
    if (!f) return 'Formateur';
    return typeof f === 'string' ? f : (f.nom || 'Formateur');
  })();

  const goToStep = (idx: number) => {
    setExpandedIndex(idx);
    setTimeout(() => {
      const el = document.getElementById(`step-${idx}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Typography variant="h3" component="h1" gutterBottom>
            {cours.titre}
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Chip label={cours.niveau} color="primary" sx={{ mr: 1 }} />
            {typeof totalMinutes === 'number' && (
              <Chip label={`${totalMinutes} min`} variant="outlined" sx={{ mr: 1 }} />
            )}
            {typeof (cours as any)?.prix !== 'undefined' && (
              <Chip label={`${(cours as any).prix}€`} variant="outlined" />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Rating value={cours.note} readOnly />
            <Typography variant="body2" sx={{ ml: 1 }}>
              ({cours.nombreEvaluations} évaluations)
            </Typography>
          </Box>

          <Typography variant="body1" paragraph>
            {cours.description}
          </Typography>

          {/* Progression globale */}
          {steps.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress variant="determinate" value={progressPct} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Progression: {progressPct}% ({completedSteps.length}/{steps.length})
                </Typography>
              </Stack>
            </Box>
          )}

          {inscrit && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Vous êtes inscrit à ce cours !
            </Alert>
          )}

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Contenu du cours
          </Typography>

          {steps.map((step, index) => {
            const contenu = step.contenu || {};
            const hasVideo = !!contenu.video;
            const hasAudio = !!contenu.audio;
            const hasImage = !!contenu.image;
            const hasDoc = !!contenu.document;
            const hasText = !!contenu.texte || !!step.contenuTexte || typeof step.contenu === 'string';
            const textContent = contenu.texte || step.contenuTexte || (typeof step.contenu === 'string' ? step.contenu : '');
            const duration = step.dureeEstimee || step.duree;

            return (
              <Accordion key={index} id={`step-${index}`} expanded={expandedIndex === index} onChange={(_, isExpanded) => setExpandedIndex(isExpanded ? index : false)}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">
                    Étape {index + 1}: {step.titre || step.nom || `Étape ${index + 1}`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {/* Média principal */}
                  {hasVideo && (
                    <Box sx={{ mb: 2 }}>
                      <video controls style={{ width: '100%', borderRadius: 8 }} src={contenu.video} />
                    </Box>
                  )}
                  {hasAudio && (
                    <Box sx={{ mb: 2 }}>
                      <audio controls style={{ width: '100%' }} src={contenu.audio} />
                    </Box>
                  )}
                  {hasImage && (
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                      <img src={contenu.image} alt={step.titre || `image-${index+1}`} style={{ maxWidth: '100%', borderRadius: 8 }} />
                    </Box>
                  )}
                  {hasDoc && (
                    <Box sx={{ mb: 2 }}>
                      <Button component="a" href={contenu.document} target="_blank" rel="noopener" variant="outlined">
                        Ouvrir le document / PDF
                      </Button>
                    </Box>
                  )}

                  {/* Texte */}
                  {hasText && (
                    <Typography paragraph>
                      {textContent}
                    </Typography>
                  )}

                  {/* Infos et actions */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Durée: {duration ? `${duration} min` : '—'}
                    </Typography>
                    {completedSteps.includes(index) && <Chip size="small" label="Terminé" color="success" />}
                  </Stack>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="contained" size="small" disabled={completedSteps.includes(index)} onClick={async () => {
                      await handleTerminerEtape(index);
                      setCompletedSteps(prev => {
                        const next = prev.includes(index) ? prev : [...prev, index];
                        const userKey = (user as any)?._id || (user as any)?.id || 'anon';
                        const key = `progress:${userKey}:${id}`;
                        try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
                        return next;
                      });
                    }}>
                      Marquer l'étape comme terminée
                    </Button>
                    {step.quiz && (
                      <Button
                        startIcon={<Quiz />}
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/quiz/${step.quiz}`)}
                      >
                        Quiz de l'étape
                      </Button>
                    )}
                    <Button variant="text" size="small" sx={{ mt: 2 }} onClick={() => goToStep(Math.max(0, index - 1))} disabled={index === 0}>
                      Étape précédente
                    </Button>
                    <Button variant="text" size="small" sx={{ mt: 2 }} onClick={() => goToStep(Math.min(steps.length - 1, index + 1))} disabled={index === steps.length - 1}>
                      Étape suivante
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Navigation rapide
              </Typography>
              {steps.map((s, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                  <Button size="small" onClick={() => goToStep(i)} startIcon={completedSteps.includes(i) ? <CheckCircle color="success" /> : <RadioButtonUnchecked color="disabled" /> }>
                    Étape {i + 1}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {(s.dureeEstimee || s.duree || 0)} min
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations du cours
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Formateur
                </Typography>
                <Typography variant="body1">
                  {formateurLabel}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Prérequis
                </Typography>
                {prereq.map((prerequis, index) => (
                  <Chip key={index} label={prerequis} size="small" sx={{ mr: 1, mt: 1 }} />
                ))}
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Objectifs / Compétences
                </Typography>
                {objectifs.map((competence, index) => (
                  <Chip key={index} label={competence} size="small" color="primary" sx={{ mr: 1, mt: 1 }} />
                ))}
              </Box>

              {!inscrit ? (
                <>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleInscription}
                    sx={{ mb: 1 }}
                  >
                    S'inscrire au cours
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={handleCommencer}
                  >
                    Commencer le cours
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={handleCommencer}
                >
                  Commencer le cours
                </Button>
              )}

              {inscrit && (
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  sx={{ mt: 2 }}
                  onClick={handleTerminerCours}
                >
                  Terminer le cours
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {progressMessage && (
        <Alert severity="info" sx={{ mt: 2 }} onClose={() => setProgressMessage(null)}>
          {progressMessage}
        </Alert>
      )}
    </Box>
  );
};

export default CourseDetail;
