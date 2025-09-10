import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  FilterList,
  Quiz as QuizIcon,
  Assessment,
  Timer,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { Quiz } from '../../types';

interface QuizManagementProps {
  onQuizUpdate?: () => void;
}

// Mock data pour les quiz
const mockQuizzes: Quiz[] = [
  {
    _id: '1',
    titre: 'Quiz JavaScript Avancé',
    description: 'Test des concepts avancés de JavaScript',
    questions: [
      {
        _id: '1',
        question: 'Qu\'est-ce qu\'une closure ?',
        type: 'qcm',
        options: ['Une fonction', 'Une variable', 'Un concept', 'Une méthode'],
        bonneReponse: 'Un concept',
        points: 5
      }
    ],
    duree: 30,
    niveau: 'avance',
    cours: '507f1f77bcf86cd799439011',
    createur: '507f1f77bcf86cd799439012',
    dateCreation: new Date('2024-01-15'),
    estActif: true,
    maxTentatives: 3
  },
  {
    _id: '2',
    titre: 'Quiz React Hooks',
    description: 'Évaluation sur les hooks React',
    questions: [],
    duree: 20,
    niveau: 'intermediaire',
    cours: '507f1f77bcf86cd799439013',
    createur: '507f1f77bcf86cd799439014',
    dateCreation: new Date('2024-01-20'),
    estActif: true,
    maxTentatives: 2
  },
  {
    _id: '3',
    titre: 'Quiz Python Débutant',
    description: 'Introduction aux bases de Python',
    questions: [],
    duree: 15,
    niveau: 'debutant',
    cours: '507f1f77bcf86cd799439015',
    createur: '507f1f77bcf86cd799439016',
    dateCreation: new Date('2024-01-25'),
    estActif: false,
    maxTentatives: 5
  }
];

const QuizManagement: React.FC<QuizManagementProps> = ({ onQuizUpdate }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>(mockQuizzes);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>(mockQuizzes);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    let filtered = quizzes;

    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (difficultyFilter) {
      filtered = filtered.filter(quiz => quiz.niveau === difficultyFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(quiz => 
        statusFilter === 'active' ? quiz.estActif : !quiz.estActif
      );
    }

    setFilteredQuizzes(filtered);
  }, [quizzes, searchTerm, difficultyFilter, statusFilter]);

  const handleViewQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setViewDialogOpen(true);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setEditDialogOpen(true);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      try {
        await adminService.deleteQuiz(quizId);
        setQuizzes(prev => prev.filter(quiz => quiz._id !== quizId));
        onQuizUpdate?.();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du quiz');
      }
    }
  };

  const handleToggleStatus = async (quizId: string) => {
    try {
      await adminService.toggleQuizStatus(quizId);
      setQuizzes(prev => prev.map(quiz =>
        quiz._id === quizId ? { ...quiz, estActif: !quiz.estActif } : quiz
      ));
      onQuizUpdate?.();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut du quiz');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'debutant': return 'success';
      case 'intermediaire': return 'warning';
      case 'avance': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'debutant': return 'Débutant';
      case 'intermediaire': return 'Intermédiaire';
      case 'avance': return 'Avancé';
      default: return difficulty;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Gestion des Quiz
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setEditDialogOpen(true)}
        >
          Créer un Quiz
        </Button>
      </Box>

      {/* Filtres et recherche */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Rechercher un quiz..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Difficulté</InputLabel>
              <Select
                value={difficultyFilter}
                label="Difficulté"
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <MenuItem value="">Toutes</MenuItem>
                <MenuItem value="debutant">Débutant</MenuItem>
                <MenuItem value="intermediaire">Intermédiaire</MenuItem>
                <MenuItem value="avance">Avancé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="active">Actif</MenuItem>
                <MenuItem value="inactive">Inactif</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setDifficultyFilter('');
                setStatusFilter('');
              }}
            >
              Réinitialiser
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table des quiz */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titre</TableCell>
              <TableCell>Difficulté</TableCell>
              <TableCell>Questions</TableCell>
              <TableCell>Durée</TableCell>
              <TableCell>Tentatives</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date de création</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredQuizzes
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((quiz) => (
                <TableRow key={quiz._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {quiz.titre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {quiz.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getDifficultyLabel(quiz.niveau)}
                      color={getDifficultyColor(quiz.niveau) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{quiz.questions.length}</TableCell>
                  <TableCell>{quiz.duree} min</TableCell>
                  <TableCell>{quiz.maxTentatives || 3}</TableCell>
                  <TableCell>
                    <Chip
                      label={quiz.estActif ? 'Actif' : 'Inactif'}
                      color={quiz.estActif ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {quiz.dateCreation.toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewQuiz(quiz)}
                      title="Voir"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEditQuiz(quiz)}
                      title="Modifier"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleStatus(quiz._id)}
                      title={quiz.estActif ? 'Désactiver' : 'Activer'}
                      color={quiz.estActif ? 'warning' : 'success'}
                    >
                      {quiz.estActif ? <Cancel /> : <CheckCircle />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteQuiz(quiz._id)}
                      title="Supprimer"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredQuizzes.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Lignes par page:"
        />
      </TableContainer>

      {/* Dialog de visualisation */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <QuizIcon />
            Détails du Quiz
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedQuiz && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedQuiz.titre}</Typography>
                  <Typography color="text.secondary" paragraph>
                    {selectedQuiz.description}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Assessment color="primary" />
                        <Typography variant="subtitle2">Difficulté</Typography>
                      </Box>
                      <Typography>
                        {getDifficultyLabel(selectedQuiz.niveau)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Timer color="primary" />
                        <Typography variant="subtitle2">Durée</Typography>
                      </Box>
                      <Typography>{selectedQuiz.duree} minutes</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <QuizIcon color="primary" />
                        <Typography variant="subtitle2">Questions</Typography>
                      </Box>
                      <Typography>{selectedQuiz.questions.length}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CheckCircle color="primary" />
                        <Typography variant="subtitle2">Tentatives autorisées</Typography>
                      </Box>
                      <Typography>{selectedQuiz.maxTentatives || 3}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {selectedQuiz.questions.length > 0 && (
                <Box mt={3}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Questions ({selectedQuiz.questions.length})
                  </Typography>
                  {selectedQuiz.questions.map((question, index) => (
                    <Card key={question._id || index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Question {index + 1} ({question.points} points)
                        </Typography>
                        <Typography paragraph>{question.question}</Typography>
                        {question.options && (
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Options:
                            </Typography>
                            {question.options.map((option, optIndex) => (
                              <Typography
                                key={optIndex}
                                variant="body2"
                                sx={{
                                  ml: 2,
                                  color: option === question.bonneReponse ? 'success.main' : 'text.primary',
                                  fontWeight: option === question.bonneReponse ? 'bold' : 'normal'
                                }}
                              >
                                • {option} {option === question.bonneReponse && '✓'}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'édition/création */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedQuiz ? 'Modifier le Quiz' : 'Créer un Quiz'}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Fonctionnalité d'édition à implémenter...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button variant="contained">
            {selectedQuiz ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizManagement;
