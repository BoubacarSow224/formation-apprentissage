import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tab,
  Tabs
} from '@mui/material';
import { 
  Send, 
  ThumbUp, 
  Comment, 
  Share,
  Group,
  Forum,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { messageService } from '../../services/messageService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`community-tabpanel-${index}`}
      aria-labelledby={`community-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Community: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        // Simuler le chargement des données de la communauté
        const mockPosts = [
          {
            id: 1,
            author: { nom: 'Marie Dupont', avatar: '' },
            content: 'Vient de terminer le cours React ! Très instructif 🚀',
            likes: 12,
            comments: 3,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            id: 2,
            author: { nom: 'Jean Martin', avatar: '' },
            content: 'Quelqu\'un peut-il m\'aider avec les hooks React ? Je suis bloqué sur useEffect...',
            likes: 8,
            comments: 7,
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
          }
        ];

        const mockDiscussions = [
          {
            id: 1,
            title: 'Meilleures pratiques en JavaScript',
            author: 'Alice Dubois',
            replies: 23,
            lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000)
          },
          {
            id: 2,
            title: 'Préparation aux entretiens techniques',
            author: 'Bob Wilson',
            replies: 15,
            lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000)
          }
        ];

        setPosts(mockPosts);
        setDiscussions(mockDiscussions);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePostSubmit = async () => {
    if (!newPost.trim() || !user) return;

    try {
      // Simuler la création d'un nouveau post
      const newPostData = {
        id: Date.now(),
        author: { nom: user.nom, avatar: '' },
        content: newPost,
        likes: 0,
        comments: 0,
        timestamp: new Date()
      };

      setPosts([newPostData, ...posts]);
      setNewPost('');
    } catch (error) {
      console.error('Erreur lors de la création du post:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours === 1) return 'Il y a 1 heure';
    if (diffInHours < 24) return `Il y a ${diffInHours} heures`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Il y a 1 jour';
    return `Il y a ${diffInDays} jours`;
  };

  if (loading) {
    return <Typography>Chargement de la communauté...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Communauté d'apprentissage
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Connectez-vous avec d'autres apprenants, partagez vos expériences et obtenez de l'aide.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Fil d'actualité" icon={<TrendingUp />} />
          <Tab label="Discussions" icon={<Forum />} />
          <Tab label="Groupes" icon={<Group />} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Fil d'actualité */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Nouveau post */}
            {user && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" gap={2}>
                    <Avatar>{user.nom.charAt(0).toUpperCase()}</Avatar>
                    <Box flexGrow={1}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Partagez quelque chose avec la communauté..."
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        variant="outlined"
                      />
                      <Box display="flex" justifyContent="flex-end" mt={2}>
                        <Button
                          variant="contained"
                          startIcon={<Send />}
                          onClick={handlePostSubmit}
                          disabled={!newPost.trim()}
                        >
                          Publier
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Posts */}
            {posts.map((post) => (
              <Card key={post.id} sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar>{post.author.nom.charAt(0).toUpperCase()}</Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {post.author.nom}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(post.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body1" paragraph>
                    {post.content}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button startIcon={<ThumbUp />} size="small">
                    {post.likes} J'aime
                  </Button>
                  <Button startIcon={<Comment />} size="small">
                    {post.comments} Commentaires
                  </Button>
                  <Button startIcon={<Share />} size="small">
                    Partager
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Sidebar */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistiques de la communauté
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Membres actifs</Typography>
                    <Chip label="1,234" color="primary" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Discussions ouvertes</Typography>
                    <Chip label="89" color="secondary" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Posts aujourd'hui</Typography>
                    <Chip label="23" color="success" size="small" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Discussions */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">Discussions récentes</Typography>
                  <Button variant="contained">Nouvelle discussion</Button>
                </Box>
                
                <List>
                  {discussions.map((discussion, index) => (
                    <React.Fragment key={discussion.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>{discussion.author.charAt(0).toUpperCase()}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={discussion.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Par {discussion.author} • {discussion.replies} réponses
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Dernière activité: {formatTimeAgo(discussion.lastActivity)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < discussions.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Catégories populaires
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Chip label="JavaScript" variant="outlined" />
                  <Chip label="React" variant="outlined" />
                  <Chip label="Python" variant="outlined" />
                  <Chip label="Carrière" variant="outlined" />
                  <Chip label="Projets" variant="outlined" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Groupes */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Groupes d'étude
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Rejoignez des groupes d'étude pour apprendre ensemble et vous entraider.
            </Typography>
            
            <Grid container spacing={2}>
              {['Débutants JavaScript', 'React Avancé', 'Préparation Entretiens', 'Projets Open Source'].map((group) => (
                <Grid item xs={12} sm={6} md={4} key={group}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {group}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Groupe d'étude actif avec des membres motivés.
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption">
                          {Math.floor(Math.random() * 50) + 10} membres
                        </Typography>
                        <Button size="small" variant="outlined">
                          Rejoindre
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default Community;
