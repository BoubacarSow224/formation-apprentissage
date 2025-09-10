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
  Alert
} from '@mui/material';
import { ExpandMore, PlayArrow, Quiz } from '@mui/icons-material';
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

  useEffect(() => {
    const fetchCours = async () => {
      if (id) {
        try {
          const data = await coursService.getCoursById(id);
          setCours(data);
          setInscrit(user?.coursSuivis?.some(cours => cours.cours === id) || false);
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

  if (loading) {
    return <Typography>Chargement du cours...</Typography>;
  }

  if (!cours) {
    return <Typography>Cours introuvable</Typography>;
  }

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Typography variant="h3" component="h1" gutterBottom>
            {cours.titre}
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Chip label={cours.niveau} color="primary" sx={{ mr: 1 }} />
            <Chip label={`${cours.duree}h`} variant="outlined" sx={{ mr: 1 }} />
            <Chip label={`${cours.prix}€`} variant="outlined" />
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

          {inscrit && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Vous êtes inscrit à ce cours !
            </Alert>
          )}

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Contenu du cours
          </Typography>

          {cours.modules.map((module, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">
                  Module {index + 1}: {module.titre}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  {module.contenu}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Durée: {module.duree}h
                </Typography>
                {module.quiz && (
                  <Button
                    startIcon={<Quiz />}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => navigate(`/quiz/${module.quiz}`)}
                  >
                    Quiz du module
                  </Button>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
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
                  {cours.formateur}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Prérequis
                </Typography>
                {cours.prerequis.map((prerequis, index) => (
                  <Chip key={index} label={prerequis} size="small" sx={{ mr: 1, mt: 1 }} />
                ))}
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Compétences acquises
                </Typography>
                {cours.competencesAcquises.map((competence, index) => (
                  <Chip key={index} label={competence} size="small" color="primary" sx={{ mr: 1, mt: 1 }} />
                ))}
              </Box>

              {!inscrit ? (
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleInscription}
                >
                  S'inscrire au cours
                </Button>
              ) : (
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<PlayArrow />}
                >
                  Commencer le cours
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourseDetail;
