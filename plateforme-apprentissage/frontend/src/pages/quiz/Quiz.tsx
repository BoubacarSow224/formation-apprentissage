import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  LinearProgress,
  Alert
} from '@mui/material';
import quizService  from '../../services/quizService';
import { Quiz as QuizType } from '../../types';

const Quiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [reponses, setReponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [resultats, setResultats] = useState<any>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (id) {
        try {
          const data = await quizService.getQuizById(id);
          setQuiz(data);
        } catch (error) {
          console.error('Erreur lors du chargement du quiz:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchQuiz();
  }, [id]);

  const handleReponseChange = (questionIndex: number, reponse: any) => {
    setReponses({
      ...reponses,
      [questionIndex]: reponse
    });
  };

  const handleNext = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (id) {
      try {
        const resultats = await quizService.soumettreReponses(id, reponses);
        setResultats(resultats);
        setSubmitted(true);
      } catch (error) {
        console.error('Erreur lors de la soumission:', error);
      }
    }
  };

  if (loading) {
    return <Typography>Chargement du quiz...</Typography>;
  }

  if (!quiz) {
    return <Typography>Quiz introuvable</Typography>;
  }

  if (submitted && resultats) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Résultats du Quiz
        </Typography>
        <Card>
          <CardContent>
            <Alert severity={resultats.reussi ? 'success' : 'error'} sx={{ mb: 3 }}>
              {resultats.reussi ? 'Félicitations ! Vous avez réussi le quiz.' : 'Vous n\'avez pas atteint la note minimale.'}
            </Alert>
            <Typography variant="h6" gutterBottom>
              Score: {resultats.score}%
            </Typography>
            <Typography variant="body1" gutterBottom>
              Note obtenue: {resultats.noteObtenue}/{quiz.questions.reduce((acc, q) => acc + q.points, 0)}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
              sx={{ mt: 2 }}
            >
              Retour au Dashboard
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {quiz.titre}
      </Typography>
      
      <LinearProgress variant="determinate" value={progress} sx={{ mb: 3 }} />
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Question {currentQuestion + 1} sur {quiz.questions.length}
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {question.question}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Points: {question.points}
          </Typography>

          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            {question.type === 'qcm' && question.options && (
              <RadioGroup
                value={reponses[currentQuestion] || ''}
                onChange={(e) => handleReponseChange(currentQuestion, e.target.value)}
              >
                {question.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            )}

            {question.type === 'vrai_faux' && (
              <RadioGroup
                value={reponses[currentQuestion] || ''}
                onChange={(e) => handleReponseChange(currentQuestion, e.target.value)}
              >
                <FormControlLabel value="true" control={<Radio />} label="Vrai" />
                <FormControlLabel value="false" control={<Radio />} label="Faux" />
              </RadioGroup>
            )}

            {question.type === 'texte_libre' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={reponses[currentQuestion] || ''}
                onChange={(e) => handleReponseChange(currentQuestion, e.target.value)}
                placeholder="Votre réponse..."
                sx={{ mt: 2 }}
              />
            )}
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Précédent
            </Button>
            
            {currentQuestion === quiz.questions.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!reponses[currentQuestion]}
              >
                Terminer le Quiz
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!reponses[currentQuestion]}
              >
                Suivant
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Quiz;