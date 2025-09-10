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
  Rating
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import { coursService } from '../../services/coursService';
import { Cours } from '../../types';

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const [cours, setCours] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');

  useEffect(() => {
    const fetchCours = async () => {
      try {
        const data = await coursService.getCours();
        setCours(data.cours || []);
      } catch (error) {
        console.error('Erreur lors du chargement des cours:', error);
        setCours([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCours();
  }, []);

  const filteredCours = cours.filter(cours => {
    const matchesSearch = cours.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cours.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiveau = !niveauFilter || cours.niveau === niveauFilter;
    const matchesCategorie = !categorieFilter || cours.categorie === categorieFilter;
    
    return matchesSearch && matchesNiveau && matchesCategorie;
  });

  const niveaux = [...new Set(cours.map(c => c.niveau))];
  const categories = [...new Set(cours.map(c => c.categorie))];

  if (loading) {
    return <Typography>Chargement des cours...</Typography>;
  }

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

                <Typography variant="body2" color="text.secondary" paragraph>
                  {cours.description.substring(0, 100)}...
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={cours.note} readOnly size="small" />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({cours.nombreEvaluations})
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Durée: {cours.duree}h
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Formateur: {cours.formateur}
                </Typography>

                <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                  {cours.prix}€
                </Typography>
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
