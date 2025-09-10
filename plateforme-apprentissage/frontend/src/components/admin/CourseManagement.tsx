import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Tooltip,
  Alert,
  Pagination,
  InputAdornment,
  Rating,
  LinearProgress
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Search,
  Add,
  Publish,
  Archive,
  PlayArrow,
  Quiz,
  People
} from '@mui/icons-material';
import { Cours } from '../../types';

interface CourseManagementProps {
  onCourseUpdate?: () => void;
}

const CourseManagement: React.FC<CourseManagementProps> = ({ onCourseUpdate }) => {
  const [courses, setCourses] = useState<Cours[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<Cours | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'edit' | 'view' | 'delete'>('view');

  // Données simulées
  const mockCourses: Cours[] = [
    {
      _id: '1',
      titre: 'React.js Fondamentaux',
      description: 'Apprenez les bases de React.js avec des exemples pratiques et des projets concrets.',
      formateur: 'Marie Martin',
      niveau: 'debutant',
      categorie: 'Développement Web',
      duree: 20,
      modules: [
        { titre: 'Introduction à React', contenu: 'Concepts de base', duree: 2, ressources: [] },
        { titre: 'Components et Props', contenu: 'Création de composants', duree: 3, ressources: [] }
      ],
      prerequis: ['HTML', 'CSS', 'JavaScript'],
      competencesAcquises: ['React Components', 'JSX', 'Props', 'State'],
      prix: 99,
      note: 4.5,
      nombreEvaluations: 156,
      dateCreation: new Date('2024-01-15'),
      dateModification: new Date('2024-03-10'),
      statut: 'publie'
    },
    {
      _id: '2',
      titre: 'Node.js Avancé',
      description: 'Maîtrisez Node.js pour créer des applications backend robustes et scalables.',
      formateur: 'Jean Dupont',
      niveau: 'avance',
      categorie: 'Backend',
      duree: 35,
      modules: [
        { titre: 'Express.js', contenu: 'Framework web', duree: 5, ressources: [] },
        { titre: 'Base de données', contenu: 'MongoDB et Mongoose', duree: 8, ressources: [] }
      ],
      prerequis: ['JavaScript', 'Node.js basics'],
      competencesAcquises: ['Express.js', 'MongoDB', 'API REST', 'Authentication'],
      prix: 149,
      note: 4.8,
      nombreEvaluations: 89,
      dateCreation: new Date('2024-02-01'),
      dateModification: new Date('2024-03-15'),
      statut: 'publie'
    },
    {
      _id: '3',
      titre: 'Python pour Data Science',
      description: 'Découvrez Python appliqué à la science des données avec pandas, numpy et matplotlib.',
      formateur: 'Sophie Durand',
      niveau: 'intermediaire',
      categorie: 'Data Science',
      duree: 28,
      modules: [
        { titre: 'Introduction Python', contenu: 'Syntaxe de base', duree: 4, ressources: [] },
        { titre: 'Pandas et NumPy', contenu: 'Manipulation de données', duree: 8, ressources: [] }
      ],
      prerequis: ['Mathématiques de base'],
      competencesAcquises: ['Python', 'Pandas', 'NumPy', 'Data Visualization'],
      prix: 129,
      note: 4.3,
      nombreEvaluations: 234,
      dateCreation: new Date('2024-01-20'),
      dateModification: new Date('2024-02-28'),
      statut: 'brouillon'
    }
  ];

  // Charger les cours depuis l'API
  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await adminService.getCourses({
        search: searchTerm,
        category: categoryFilter,
        level: levelFilter,
        status: statusFilter,
        page,
        limit: 10
      });
      
      setCourses(response.courses);
      setFilteredCourses(response.courses);
      setTotalCourses(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
      // En cas d'erreur, utiliser les données mock
      setCourses(mockCourses);
      setFilteredCourses(mockCourses);
      setTotalCourses(mockCourses.length);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [searchTerm, categoryFilter, levelFilter, statusFilter, page]);


  const handleOpenDialog = (course: Cours, type: 'edit' | 'view' | 'delete') => {
    setSelectedCourse(course);
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCourse(null);
  };

  const handleToggleCourseStatus = async (courseId: string) => {
    try {
      await adminService.toggleCourseStatus(courseId);
      await loadCourses();
      onCourseUpdate?.();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut du cours');
    }
  };

  const handleDeleteCourse = async () => {
    if (selectedCourse) {
      try {
        await adminService.deleteCourse(selectedCourse._id);
        await loadCourses();
        handleCloseDialog();
        onCourseUpdate?.();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du cours');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'publie': return 'success';
      case 'brouillon': return 'warning';
      case 'archive': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'publie': return 'Publié';
      case 'brouillon': return 'Brouillon';
      case 'archive': return 'Archivé';
      default: return status;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debutant': return 'success';
      case 'intermediaire': return 'warning';
      case 'avance': return 'error';
      default: return 'default';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'debutant': return 'Débutant';
      case 'intermediaire': return 'Intermédiaire';
      case 'avance': return 'Avancé';
      default: return level;
    }
  };

  return (
    <Box>
      {/* Filtres et recherche */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Rechercher un cours..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Catégorie</InputLabel>
          <Select
            value={categoryFilter}
            label="Catégorie"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">Toutes</MenuItem>
            <MenuItem value="Développement Web">Développement Web</MenuItem>
            <MenuItem value="Backend">Backend</MenuItem>
            <MenuItem value="Data Science">Data Science</MenuItem>
            <MenuItem value="Mobile">Mobile</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Niveau</InputLabel>
          <Select
            value={levelFilter}
            label="Niveau"
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="debutant">Débutant</MenuItem>
            <MenuItem value="intermediaire">Intermédiaire</MenuItem>
            <MenuItem value="avance">Avancé</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={statusFilter}
            label="Statut"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="publie">Publié</MenuItem>
            <MenuItem value="brouillon">Brouillon</MenuItem>
            <MenuItem value="archive">Archivé</MenuItem>
          </Select>
        </FormControl>

        <Button
          startIcon={<Add />}
          variant="contained"
          onClick={() => handleOpenDialog({} as Cours, 'edit')}
        >
          Nouveau cours
        </Button>
      </Box>

      {/* Table des cours */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cours</TableCell>
              <TableCell>Formateur</TableCell>
              <TableCell>Catégorie/Niveau</TableCell>
              <TableCell>Durée</TableCell>
              <TableCell>Prix</TableCell>
              <TableCell>Évaluations</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.map((course) => (
              <TableRow key={course._id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {course.titre}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {course.description.substring(0, 80)}...
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <People sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="caption">
                        {course.modules.length} modules
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {course.formateur}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Créé le {new Date(course.dateCreation).toLocaleDateString()}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box>
                    <Chip
                      label={course.categorie}
                      size="small"
                      sx={{ mb: 1, display: 'block' }}
                    />
                    <Chip
                      label={getLevelLabel(course.niveau)}
                      color={getLevelColor(course.niveau) as any}
                      size="small"
                    />
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {course.duree}h
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {course.prix}€
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box>
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <Rating value={course.note} readOnly size="small" />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {course.note}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {course.nombreEvaluations} avis
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={getStatusLabel(course.statut)}
                    color={getStatusColor(course.statut) as any}
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Voir détails">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(course, 'view')}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Modifier">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(course, 'edit')}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={course.statut === 'publie' ? 'Archiver' : 'Publier'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleCourseStatus(course._id)}
                        color={course.statut === 'publie' ? 'warning' : 'success'}
                      >
                        {course.statut === 'publie' ? <Archive /> : <Publish />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Supprimer">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(course, 'delete')}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* Dialog pour voir/modifier/supprimer */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'view' && 'Détails du cours'}
          {dialogType === 'edit' && (selectedCourse?._id ? 'Modifier le cours' : 'Créer un cours')}
          {dialogType === 'delete' && 'Confirmer la suppression'}
        </DialogTitle>

        <DialogContent>
          {dialogType === 'delete' ? (
            <Alert severity="warning">
              Êtes-vous sûr de vouloir supprimer le cours "{selectedCourse?.titre}" ?
              Cette action est irréversible et affectera tous les utilisateurs inscrits.
            </Alert>
          ) : (
            <Box sx={{ pt: 2 }}>
              {selectedCourse && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedCourse.titre}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedCourse.description}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Formateur:</strong> {selectedCourse.formateur}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Catégorie:</strong> {selectedCourse.categorie}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Niveau:</strong> {getLevelLabel(selectedCourse.niveau)}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Durée:</strong> {selectedCourse.duree} heures
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Prix:</strong> {selectedCourse.prix}€
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Modules:</strong> {selectedCourse.modules?.length || 0}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Prérequis:</strong> {selectedCourse.prerequis?.join(', ') || 'Aucun'}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Compétences acquises:</strong> {selectedCourse.competencesAcquises?.join(', ') || 'Non spécifiées'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Annuler
          </Button>
          {dialogType === 'delete' && (
            <Button onClick={handleDeleteCourse} color="error" variant="contained">
              Supprimer
            </Button>
          )}
          {dialogType === 'edit' && (
            <Button variant="contained">
              {selectedCourse?._id ? 'Modifier' : 'Créer'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseManagement;
