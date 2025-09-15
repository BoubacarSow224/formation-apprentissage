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
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import Badge from '@mui/material/Badge';
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
import api from '../../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { groupeService } from '../../services/groupeService';

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
  const location = useLocation();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCommentBox, setOpenCommentBox] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [communityStats, setCommunityStats] = useState<any>(null);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [creatingDiscussion, setCreatingDiscussion] = useState(false);
  const [replyingDiscussionId, setReplyingDiscussionId] = useState<string | null>(null);
  const [discussionSearch, setDiscussionSearch] = useState('');
  const [discussionTag, setDiscussionTag] = useState('');
  // Groups state
  const [groups, setGroups] = useState<any[]>([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupTag, setGroupTag] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [togglingGroupId, setTogglingGroupId] = useState<string | null>(null);
  const [invitingGroupId, setInvitingGroupId] = useState<string | null>(null);
  const [inviteInputs, setInviteInputs] = useState<Record<string, string>>({});
  const [groupPosts, setGroupPosts] = useState<Record<string, any[]>>({});
  const [groupPostInputs, setGroupPostInputs] = useState<Record<string, string>>({});
  const [groupCommentInputs, setGroupCommentInputs] = useState<Record<string, Record<string, string>>>({});
  const [loadingGroupPosts, setLoadingGroupPosts] = useState<Record<string, boolean>>({});
  // Invitations (groupes académiques)
  const [myInvites, setMyInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const fetchCommunityData = async () => {
    try {
      const res = await api.get('/community/posts');
      if (res.data?.success) {
        const currentUserId = (user as any)?._id || (user as any)?.id;
        const apiPosts = (res.data.posts || []).map((p: any) => ({
          id: p._id,
          author: {
            nom: p.author?.nom || 'Utilisateur',
            avatar: p.author?.photoProfil || 'default.jpg'
          },
          content: p.content,
          likes: p.likesCount ?? (p.likes ? p.likes.length : 0),
          comments: p.commentsCount ?? (p.comments ? p.comments.length : 0),
          timestamp: new Date(p.dateCreation),
          isLiked: Array.isArray(p.likes) ? p.likes.some((l: any) => {
            const likeUser = l.user?._id || l.user;
            return currentUserId && likeUser && likeUser.toString() === currentUserId.toString();
          }) : false,
          commentsList: Array.isArray(p.comments) ? p.comments.map((c: any) => ({
            id: c._id || `${p._id}-${c.date}`,
            user: {
              nom: c.user?.nom || 'Utilisateur',
              avatar: c.user?.photoProfil || 'default.jpg'
            },
            content: c.content,
            date: c.date ? new Date(c.date) : new Date()
          })) : []
        }));
        setPosts(apiPosts);
        // Ouvrir par défaut la zone de commentaires pour visualiser directement les échanges
        const openMap: Record<string, boolean> = {};
        apiPosts.forEach((p: any) => { openMap[p.id] = true; });
        setOpenCommentBox(openMap);
      } else {
        setPosts([]);
      }
      // Charger les discussions depuis l'API
      try {
        const params: string[] = ['limit=10'];
        if (discussionSearch.trim()) params.push(`search=${encodeURIComponent(discussionSearch.trim())}`);
        if (discussionTag.trim()) params.push(`tag=${encodeURIComponent(discussionTag.trim())}`);
        const query = params.join('&');
        const dRes = await api.get(`/community/discussions?${query}`);
        if (dRes.data?.success) {
          const apiDiscussions = (dRes.data.discussions || []).map((d: any) => ({
            id: d._id,
            title: d.title,
            content: d.content,
            author: {
              nom: d.author?.nom || 'Utilisateur',
              avatar: d.author?.photoProfil || 'default.jpg',
              role: d.author?.role || ''
            },
            replies: Array.isArray(d.replies) ? d.replies.map((r: any) => ({
              id: r._id || `${d._id}-${r.date}`,
              user: {
                nom: r.user?.nom || 'Utilisateur',
                avatar: r.user?.photoProfil || 'default.jpg'
              },
              content: r.content,
              date: r.date ? new Date(r.date) : new Date()
            })) : [],
            repliesCount: Array.isArray(d.replies) ? d.replies.length : 0,
            lastActivity: new Date(d.lastActivity || d.updatedAt || d.createdAt)
          }));
          setDiscussions(apiDiscussions);
        } else {
          setDiscussions([]);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des discussions:', err);
        setDiscussions([]);
      }

      // Charger les groupes
      try {
        const gParams: string[] = ['limit=12'];
        if (groupSearch.trim()) gParams.push(`search=${encodeURIComponent(groupSearch.trim())}`);
        if (groupTag.trim()) gParams.push(`tag=${encodeURIComponent(groupTag.trim())}`);
        const gQuery = gParams.join('&');
        const gRes = await api.get(`/community/groups?${gQuery}`);
        if (gRes.data?.success) {
          const currentUserId = (user as any)?._id || (user as any)?.id;
          const apiGroups = (gRes.data.groups || []).map((g: any) => ({
            id: g._id,
            name: g.name,
            description: g.description,
            owner: {
              nom: g.owner?.nom || 'Utilisateur',
              avatar: g.owner?.photoProfil || 'default.jpg'
            },
            ownerId: g.owner?._id || g.owner,
            memberCount: Array.isArray(g.members) ? g.members.length : (g.memberCount ?? 0),
            isMember: Array.isArray(g.members) ? g.members.some((m: any) => {
              const mid = m?._id || m;
              return currentUserId && mid && mid.toString() === currentUserId.toString();
            }) : false,
            isOwner: currentUserId && (g.owner?._id || g.owner)?.toString?.() === currentUserId?.toString?.()
          }));
          setGroups(apiGroups);
        } else {
          setGroups([]);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des groupes:', err);
        setGroups([]);
      }

      // Charger les statistiques dynamiques de la communauté
      try {
        const statsRes = await api.get('/community/stats');
        if (statsRes.data?.success) {
          setCommunityStats(statsRes.data.stats);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des statistiques communauté:', err);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= Invitations de groupes (apprenant) =================
  const fetchMyInvites = async () => {
    if (!user) return;
    setLoadingInvites(true);
    try {
      const res = await groupeService.getMesInvitations();
      // groupeService.getMesInvitations() renvoie le corps JSON: { success, count, data: [...] }
      const list = Array.isArray((res as any)?.data) ? (res as any).data : [];
      setMyInvites(list);
    } catch (e) {
      setMyInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  };

  const respondInvite = async (groupeId: string, invitationId: string, action: 'accepte' | 'refuse') => {
    try {
      await groupeService.repondreInvitation(groupeId, invitationId, action);
      await fetchMyInvites();
      // Rafraîchir aussi la liste des groupes pour afficher immédiatement le nouveau groupe accepté
      await fetchCommunityData();
    } catch (e) {
      // noop (les erreurs seront visibles côté backend si besoin)
    }
  };

  const handleInviteChange = (groupId: string, value: string) => {
    setInviteInputs(prev => ({ ...prev, [groupId]: value }));
  };

  const handleInviteMember = async (groupId: string) => {
    const email = (inviteInputs[groupId] || '').trim();
    if (!email || invitingGroupId) return;
    setInvitingGroupId(groupId);
    try {
      const res = await api.post(`/community/groups/${groupId}/members`, { email });
      if (res.data?.success) {
        setInviteInputs(prev => ({ ...prev, [groupId]: '' }));
        await fetchCommunityData();
      }
    } catch (error: any) {
      console.error('Erreur invitation membre:', error);
      alert(error?.response?.data?.message || 'Impossible d\'ajouter ce membre.');
    } finally {
      setInvitingGroupId(null);
    }
  };

  // Groups handlers
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || creatingGroup) return;
    setCreatingGroup(true);
    try {
      const res = await api.post('/community/groups', {
        name: newGroupName.trim(),
        description: newGroupDesc.trim()
      });
      if (res.data?.success) {
        setNewGroupName('');
        setNewGroupDesc('');
        await fetchCommunityData();
      }
    } catch (error: any) {
      console.error('Erreur création groupe:', error);
      alert(error?.response?.data?.message || 'Impossible de créer le groupe.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleToggleGroupMembership = async (groupId: string, isMember: boolean) => {
    if (togglingGroupId) return;
    setTogglingGroupId(groupId);
    try {
      const endpoint = isMember ? `/community/groups/${groupId}/leave` : `/community/groups/${groupId}/join`;
      const res = await api.post(endpoint);
      if (res.data?.success) {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isMember: !isMember, memberCount: res.data.memberCount ?? (g.memberCount + (isMember ? -1 : 1)) } : g));
      }
    } catch (error) {
      console.error('Erreur changement d\'adhésion:', error);
    } finally {
      setTogglingGroupId(null);
    }
  };

  useEffect(() => {
    fetchCommunityData();
    // Charger les invitations dès l'arrivée sur la page
    fetchMyInvites();
    const interval = setInterval(() => {
      fetchCommunityData();
      // Mettre à jour le badge des invitations même si l'onglet n'est pas actif
      if (user && (user as any)?.role === 'apprenant') {
        fetchMyInvites();
      }
    }, 5000); // rafraîchissement toutes les 5s pour visibilité quasi temps réel
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    let tabParam = 'feed';
    if (newValue === 1) tabParam = 'discussions';
    // Si l'onglet invitations est présent, il est à l'index 2
    if (newValue === 2 && user && (user as any)?.role === 'apprenant') tabParam = 'invites';
    const url = `/community?tab=${tabParam}`;
    if (location.search !== `?tab=${tabParam}`) navigate(url, { replace: false });
    if (tabParam === 'invites') fetchMyInvites();
  };

  // Synchroniser l'onglet avec le paramètre de requête ?tab=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'discussions' && tabValue !== 1) setTabValue(1);
    else if (tab === 'invites' && user && (user as any)?.role === 'apprenant' && tabValue !== 2) {
      setTabValue(2);
      fetchMyInvites();
    }
    else if ((tab === 'feed' || tab === 'groups' || tab === null) && tabValue !== 0) setTabValue(0);
  }, [location.search]);

  // Rafraîchir les invitations lorsque l'onglet "Mes invitations" est actif
  useEffect(() => {
    if (tabValue === 2 && user && (user as any)?.role === 'apprenant') {
      fetchMyInvites();
      const invInterval = setInterval(fetchMyInvites, 15000);
      return () => clearInterval(invInterval);
    }
  }, [tabValue, user]);

  const handlePostSubmit = async () => {
    if (!newPost.trim() || !user) return;

    try {
      const response = await api.post('/community/posts', { content: newPost });

      if (response.data?.success && response.data.post) {
        const p = response.data.post;
        const newPostData = {
          id: p._id,
          author: { nom: p.author?.nom || user.nom, avatar: p.author?.photoProfil || user.photoProfil || 'default.jpg' },
          content: p.content,
          likes: p.likesCount ?? 0,
          comments: p.commentsCount ?? 0,
          timestamp: new Date(p.dateCreation || Date.now()),
          isLiked: false,
          commentsList: []
        };
        setPosts(prev => [newPostData, ...prev]);
        setNewPost('');
      }
    } catch (error) {
      console.error('Erreur lors de la création du post:', error);
      // Pas de fallback local: on garde la source vérité sur l'API
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const res = await api.post(`/community/posts/${postId}/like`);
      if (res.data?.success) {
        const { likesCount, isLiked } = res.data;
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: likesCount ?? p.likes, isLiked: typeof isLiked === 'boolean' ? isLiked : p.isLiked } : p));
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  const handleToggleCommentBox = (postId: string) => {
    setOpenCommentBox(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentChange = (postId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleSubmitComment = async (postId: string) => {
    const content = (commentInputs[postId] || '').trim();
    if (!content) return;
    try {
      const res = await api.post(`/community/posts/${postId}/comments`, { content });
      if (res.data?.success) {
        const { commentsCount, comment } = res.data;
        setPosts(prev => prev.map(p => {
          if (p.id !== postId) return p;
          const newComment = comment ? {
            id: comment._id || `${postId}-${Date.now()}`,
            user: {
              nom: comment.user?.nom || (user?.nom || 'Utilisateur'),
              avatar: comment.user?.photoProfil || (user?.photoProfil || 'default.jpg')
            },
            content: comment.content || content,
            date: comment.date ? new Date(comment.date) : new Date()
          } : {
            id: `${postId}-${Date.now()}`,
            user: { nom: user?.nom || 'Utilisateur', avatar: user?.photoProfil || 'default.jpg' },
            content,
            date: new Date()
          };
          return { ...p, comments: commentsCount ?? (p.comments + 1), commentsList: [...(p.commentsList || []), newComment] };
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    }
  };

  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/community?post=${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      // Optionnel: notification visuelle
      // eslint-disable-next-line no-alert
      alert('Lien du post copié dans le presse-papiers');
    } catch (e) {
      console.error('Copie du lien échouée, affichage du lien:', url);
      // eslint-disable-next-line no-alert
      alert(`Lien du post: ${url}`);
    }
  };

  // Discussions handlers
  const handleCreateDiscussion = async () => {
    if (!newDiscussionTitle.trim() || !newDiscussionContent.trim() || creatingDiscussion) return;
    setCreatingDiscussion(true);
    try {
      const res = await api.post('/community/discussions', {
        title: newDiscussionTitle.trim(),
        content: newDiscussionContent.trim()
      });
      if (res.data?.success && res.data.discussion) {
        setNewDiscussionTitle('');
        setNewDiscussionContent('');
        // recharger pour cohérence
        await fetchCommunityData();
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la discussion:', error);
      alert(error?.response?.data?.message || 'Impossible de publier la discussion. Vérifiez votre connexion.');
    } finally {
      setCreatingDiscussion(false);
    }
  };

  const handleReplyChangeDiscussion = (discussionId: string, value: string) => {
    setReplyInputs(prev => ({ ...prev, [discussionId]: value }));
  };

  const handleSubmitDiscussionReply = async (discussionId: string) => {
    const content = (replyInputs[discussionId] || '').trim();
    if (!content || replyingDiscussionId) return;
    setReplyingDiscussionId(discussionId);
    try {
      const res = await api.post(`/community/discussions/${discussionId}/replies`, { content });
      if (res.data?.success) {
        setReplyInputs(prev => ({ ...prev, [discussionId]: '' }));
        // recharger pour cohérence multi-utilisateur
        await fetchCommunityData();
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de la réponse de discussion:', error);
      alert(error?.response?.data?.message || 'Impossible d\'ajouter la réponse.');
    } finally {
      setReplyingDiscussionId(null);
    }
  };

  // ===== Group posts handlers =====
  const fetchGroupPosts = async (groupId: string) => {
    setLoadingGroupPosts(prev => ({ ...prev, [groupId]: true }));
    try {
      const res = await api.get(`/community/groups/${groupId}/posts?limit=10`);
      if (res.data?.success) {
        const posts = (res.data.posts || []).map((p: any) => ({
          id: p._id,
          author: { nom: p.author?.nom || 'Utilisateur', avatar: p.author?.photoProfil || 'default.jpg' },
          content: p.content,
          timestamp: new Date(p.dateCreation || Date.now()),
          comments: Array.isArray(p.comments) ? p.comments.map((c: any) => ({
            id: c._id || `${p._id}-${c.date}`,
            user: { nom: c.user?.nom || 'Utilisateur', avatar: c.user?.photoProfil || 'default.jpg' },
            content: c.content,
            date: c.date ? new Date(c.date) : new Date()
          })) : []
        }));
        setGroupPosts(prev => ({ ...prev, [groupId]: posts }));
      } else {
        setGroupPosts(prev => ({ ...prev, [groupId]: [] }));
      }
    } catch (error) {
      console.error('Erreur chargement posts de groupe:', error);
      setGroupPosts(prev => ({ ...prev, [groupId]: [] }));
    } finally {
      setLoadingGroupPosts(prev => ({ ...prev, [groupId]: false }));
    }
  };

  const handleGroupPostInputChange = (groupId: string, value: string) => {
    setGroupPostInputs(prev => ({ ...prev, [groupId]: value }));
  };

  const handleCreateGroupPost = async (groupId: string) => {
    const content = (groupPostInputs[groupId] || '').trim();
    if (!content) return;
    try {
      const res = await api.post(`/community/groups/${groupId}/posts`, { content });
      if (res.data?.success) {
        setGroupPostInputs(prev => ({ ...prev, [groupId]: '' }));
        await fetchGroupPosts(groupId);
      }
    } catch (error: any) {
      console.error('Erreur création post de groupe:', error);
      alert(error?.response?.data?.message || 'Impossible de publier dans le groupe.');
    }
  };

  const handleGroupCommentInputChange = (groupId: string, postId: string, value: string) => {
    setGroupCommentInputs(prev => ({ ...prev, [groupId]: { ...(prev[groupId] || {}), [postId]: value } }));
  };

  const handleCreateGroupComment = async (groupId: string, postId: string) => {
    const content = (groupCommentInputs[groupId]?.[postId] || '').trim();
    if (!content) return;
    try {
      const res = await api.post(`/community/groups/${groupId}/posts/${postId}/comments`, { content });
      if (res.data?.success) {
        setGroupCommentInputs(prev => ({ ...prev, [groupId]: { ...(prev[groupId] || {}), [postId]: '' } }));
        await fetchGroupPosts(groupId);
      }
    } catch (error: any) {
      console.error('Erreur commentaire post groupe:', error);
      alert(error?.response?.data?.message || 'Impossible d\'ajouter le commentaire.');
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
          {user && (user as any)?.role === 'apprenant' && (
            <Tab
              label={<Badge color="error" badgeContent={myInvites.length || 0} invisible={!myInvites.length}>Mes invitations</Badge>}
              icon={<Group />}
            />
          )}
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
                    <Avatar 
                      src={user?.photoProfil && user.photoProfil !== 'default.jpg' ? `http://localhost:5006/uploads/profiles/${user.photoProfil}` : undefined}
                    >
                      {user?.nom?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
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
            <Box display="flex" justifyContent="flex-end" mb={1}>
              <Button variant="outlined" size="small" onClick={fetchCommunityData}>Actualiser</Button>
            </Box>
            {posts.map((post) => (
              <Card key={post.id} sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar 
                      src={post.author?.avatar && post.author.avatar !== 'default.jpg' ? `http://localhost:5006/uploads/profiles/${post.author.avatar}` : undefined}
                    >
                      {post.author?.nom?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
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
                  <Button startIcon={<ThumbUp />} size="small" color={post.isLiked ? 'primary' : 'inherit'} onClick={() => handleToggleLike(post.id)}>
                    {post.likes} J'aime
                  </Button>
                  <Button startIcon={<Comment />} size="small" onClick={() => handleToggleCommentBox(post.id)}>
                    {post.comments} Commentaires
                  </Button>
                  <Button startIcon={<Share />} size="small" onClick={() => handleShare(post.id)}>
                    Partager
                  </Button>
                </CardActions>

                {openCommentBox[post.id] && (
                  <Box px={2} pb={2}>
                    {/* Liste des commentaires */}
                    <Box mb={1}>
                      {(post.commentsList || []).map((c: any) => (
                        <Box key={c.id} display="flex" gap={1} alignItems="flex-start" mb={1}>
                          <Avatar src={c.user?.avatar && c.user.avatar !== 'default.jpg' ? `http://localhost:5006/uploads/profiles/${c.user.avatar}` : undefined} sx={{ width: 28, height: 28 }}>
                            {c.user?.nom?.charAt(0)?.toUpperCase() || 'U'}
                          </Avatar>
                          <Box bgcolor="grey.100" borderRadius={2} px={1.5} py={1} flex={1}>
                            <Typography variant="subtitle2">{c.user?.nom}</Typography>
                            <Typography variant="body2">{c.content}</Typography>
                            <Typography variant="caption" color="text.secondary">{formatTimeAgo(new Date(c.date))}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                    <Box display="flex" gap={1} alignItems="center">
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Écrire un commentaire..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                      />
                      <Button variant="contained" onClick={() => handleSubmitComment(post.id)} disabled={!((commentInputs[post.id] || '').trim())}>
                        Envoyer
                      </Button>
                    </Box>
                  </Box>
                )}
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
                    <Chip label={(communityStats?.activeUsers ?? 0).toString()} color="primary" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Posts totaux</Typography>
                    <Chip label={(communityStats?.totalPosts ?? 0).toString()} color="secondary" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Posts aujourd'hui</Typography>
                    <Chip label={(communityStats?.postsToday ?? 0).toString()} color="success" size="small" />
                  </Box>
                </Box>

                {communityStats?.popularTags?.length ? (
                  <Box mt={3}>
                    <Typography variant="subtitle2" gutterBottom>Tags populaires</Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {communityStats.popularTags.map((t: any) => (
                        <Chip key={t.name} label={`${t.name} (${t.count})`} variant="outlined" size="small" />
                      ))}
                    </Box>
                  </Box>
                ) : null}
              </CardContent>
            </Card>

            
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Discussions */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Nouvelle discussion (réservée formateur/admin) */}
            {user && (['formateur', 'admin'].includes((user as any)?.role)) && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Nouvelle discussion</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                      label="Titre"
                      value={newDiscussionTitle}
                      onChange={(e) => setNewDiscussionTitle(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Contenu"
                      value={newDiscussionContent}
                      onChange={(e) => setNewDiscussionContent(e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                    />
                    <Box display="flex" justifyContent="flex-end">
                      <Button variant="contained" onClick={handleCreateDiscussion} disabled={creatingDiscussion || !newDiscussionTitle.trim() || !newDiscussionContent.trim()}>
                        Publier la discussion
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Liste des discussions */}
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Discussions récentes</Typography>
                  <Button variant="outlined" size="small" onClick={fetchCommunityData}>Actualiser</Button>
                </Box>

                {/* Barre de filtres */}
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    size="small"
                    placeholder="Rechercher..."
                    value={discussionSearch}
                    onChange={(e) => setDiscussionSearch(e.target.value)}
                  />
                  <TextField
                    size="small"
                    placeholder="Tag (ex: React)"
                    value={discussionTag}
                    onChange={(e) => setDiscussionTag(e.target.value)}
                  />
                  <Button variant="contained" size="small" onClick={fetchCommunityData}>Appliquer</Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => { setDiscussionSearch(''); setDiscussionTag(''); fetchCommunityData(); }}
                  >
                    Effacer
                  </Button>
                </Box>

                <List>
                  {discussions.map((discussion, index) => (
                    <React.Fragment key={discussion.id}>
                      <ListItem alignItems="flex-start" sx={{ alignItems: 'stretch' }}>
                        <ListItemAvatar>
                          <Avatar src={discussion.author?.avatar && discussion.author.avatar !== 'default.jpg' ? `http://localhost:5006/uploads/profiles/${discussion.author.avatar}` : undefined}>
                            {discussion.author?.nom?.charAt(0)?.toUpperCase() || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="bold">{discussion.title}</Typography>
                          }
                          secondary={
                            <Box>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 0 }}>
                                  Par {discussion.author?.nom} • {discussion.repliesCount} réponses
                                </Typography>
                                {discussion.author?.role === 'formateur' && (
                                  <Chip label="Formateur" size="small" color="primary" variant="outlined" />
                                )}
                              </Box>
                              {/* Contenu de la discussion */}
                              <Typography variant="body1" paragraph>
                                {discussion.content}
                              </Typography>
                              {/* Réponses */}
                              <Box>
                                {(discussion.replies || []).map((r: any) => (
                                  <Box key={r.id} display="flex" gap={1} alignItems="flex-start" mb={1}>
                                    <Avatar src={r.user?.avatar && r.user.avatar !== 'default.jpg' ? `http://localhost:5006/uploads/profiles/${r.user.avatar}` : undefined} sx={{ width: 28, height: 28 }}>
                                      {r.user?.nom?.charAt(0)?.toUpperCase() || 'U'}
                                    </Avatar>
                                    <Box bgcolor="grey.100" borderRadius={2} px={1.5} py={1} flex={1}>
                                      <Typography variant="subtitle2">{r.user?.nom}</Typography>
                                      <Typography variant="body2">{r.content}</Typography>
                                      <Typography variant="caption" color="text.secondary">{formatTimeAgo(new Date(r.date))}</Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                              {/* Répondre */}
                              {user && (
                                <Box mt={1} display="flex" gap={1}>
                                  <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Répondre..."
                                    value={replyInputs[discussion.id] || ''}
                                    onChange={(e) => handleReplyChangeDiscussion(discussion.id, e.target.value)}
                                  />
                                  <Button variant="contained" disabled={replyingDiscussionId === discussion.id || !((replyInputs[discussion.id] || '').trim())} onClick={() => handleSubmitDiscussionReply(discussion.id)}>
                                    Envoyer
                                  </Button>
                                </Box>
                              )}
                              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                Dernière activité: {formatTimeAgo(new Date(discussion.lastActivity))}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < discussions.length - 1 && <Divider component="li" />}
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
        {/* Mes invitations (apprenant) + Groupes */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Section Mes invitations (apprenant) */}
            {user && (user as any)?.role === 'apprenant' && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Mes invitations</Typography>
                    <Button variant="outlined" size="small" onClick={fetchMyInvites} disabled={loadingInvites}>
                      {loadingInvites ? 'Chargement...' : 'Actualiser'}
                    </Button>
                  </Box>
                  {!loadingInvites && (!myInvites || myInvites.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                      Aucune invitation en attente.
                    </Typography>
                  )}
                  <List>
                    {(myInvites || []).map((inv: any) => (
                      <React.Fragment key={`${inv.groupeId}-${inv.invitationId}`}>
                        <ListItem alignItems="flex-start" sx={{ alignItems: 'stretch' }}>
                          <ListItemAvatar>
                            <Avatar>{(inv?.groupeNom || 'G')?.charAt(0)?.toUpperCase?.() || 'G'}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" fontWeight="bold">
                                {inv.groupeNom}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
                                  Invité par {inv?.formateur?.nom || 'Formateur'} • Statut: {inv?.statut}
                                </Typography>
                                <Box display="flex" gap={1}>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="success"
                                    onClick={() => respondInvite(inv.groupeId, inv.invitationId, 'accepte')}
                                  >
                                    Accepter
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="inherit"
                                    onClick={() => respondInvite(inv.groupeId, inv.invitationId, 'refuse')}
                                  >
                                    Refuser
                                  </Button>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
            {/* Créer un groupe */}
            {user && (['formateur', 'admin'].includes((user as any)?.role)) && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Créer un groupe d'étude</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                      label="Nom du groupe"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Description"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                    />
                    <Box display="flex" justifyContent="flex-end">
                      <Button variant="contained" onClick={handleCreateGroup} disabled={creatingGroup || !newGroupName.trim()}>
                        Créer le groupe
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Liste des groupes */}
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Groupes</Typography>
                  <Button variant="outlined" size="small" onClick={fetchCommunityData}>Actualiser</Button>
                </Box>

                {/* Filtres */}
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    size="small"
                    placeholder="Rechercher un groupe..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                  />
                  <TextField
                    size="small"
                    placeholder="Tag (ex: React)"
                    value={groupTag}
                    onChange={(e) => setGroupTag(e.target.value)}
                  />
                  <Button variant="contained" size="small" onClick={fetchCommunityData}>Appliquer</Button>
                  <Button variant="text" size="small" onClick={() => { setGroupSearch(''); setGroupTag(''); fetchCommunityData(); }}>Effacer</Button>
                </Box>

                <Grid container spacing={2}>
                  {groups.map((g) => (
                    <Grid item xs={12} sm={6} key={g.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Avatar src={g.owner?.avatar && g.owner.avatar !== 'default.jpg' ? `http://localhost:5006/uploads/profiles/${g.owner.avatar}` : undefined}>
                              {g.owner?.nom?.charAt(0)?.toUpperCase() || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>{g.name}</Typography>
                              <Typography variant="caption" color="text.secondary">Créé par {g.owner?.nom}</Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {g.description || 'Groupe d\'étude'}
                          </Typography>
                          <Box display="flex" flexDirection="column" gap={1}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Chip label={`${g.memberCount} membres`} size="small" />
                              {user && (
                                g.isMember ? (
                                  <Button size="small" variant='outlined' disabled={togglingGroupId === g.id} onClick={() => handleToggleGroupMembership(g.id, true)}>
                                    Quitter
                                  </Button>
                                ) : g.isOwner ? (
                                  <Chip label="Vous êtes propriétaire" size="small" color="primary" variant="outlined" />
                                ) : (
                                  <Chip label="Invitation requise" size="small" variant="outlined" />
                                )
                              )}
                            </Box>

                            {/* Invitation par le propriétaire */}
                            {user && g.isOwner && (
                              <Box display="flex" gap={1} alignItems="center">
                                <TextField
                                  size="small"
                                  placeholder="Inviter par email"
                                  value={inviteInputs[g.id] || ''}
                                  onChange={(e) => handleInviteChange(g.id, e.target.value)}
                                />
                                <Button size="small" variant="contained" disabled={invitingGroupId === g.id || !((inviteInputs[g.id] || '').trim())} onClick={() => handleInviteMember(g.id)}>
                                  Inviter
                                </Button>
                              </Box>
                            )}

                            {/* Informations pour non-membres */}
                            {user && !g.isMember && !g.isOwner && (
                              <Typography variant="caption" color="text.secondary">
                                Vous devez être invité par votre formateur pour accéder aux publications de ce groupe.
                              </Typography>
                            )}

                            {/* Publications du groupe (réservées aux membres et au propriétaire) */}
                            {user && (g.isMember || g.isOwner) && (
                              <Box mt={1}>
                                <Typography variant="subtitle2" gutterBottom>Publications</Typography>
                                {/* Saisie de publication: autorisée à tous les membres (y compris propriétaire) */}
                                {(g.isOwner || g.isMember) && (
                                  <Box display="flex" gap={1} alignItems="center" mb={1}>
                                    <TextField
                                      size="small"
                                      fullWidth
                                      placeholder="Publier dans le groupe..."
                                      value={groupPostInputs[g.id] || ''}
                                      onChange={(e) => handleGroupPostInputChange(g.id, e.target.value)}
                                    />
                                    <Button size="small" variant="contained" onClick={() => handleCreateGroupPost(g.id)} disabled={!((groupPostInputs[g.id] || '').trim())}>
                                      Publier
                                    </Button>
                                  </Box>
                                )}
                                <Box mb={1}>
                                  <Button size="small" variant="outlined" onClick={() => fetchGroupPosts(g.id)} disabled={loadingGroupPosts[g.id] === true}>
                                    {loadingGroupPosts[g.id] ? 'Chargement...' : 'Afficher les publications'}
                                  </Button>
                                </Box>
                                {(groupPosts[g.id] || []).map((p: any) => (
                                  <Card key={p.id} variant="outlined" sx={{ mb: 1 }}>
                                    <CardContent>
                                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        <Avatar src={p.author?.avatar && p.author.avatar !== 'default.jpg' ? `http://localhost:5006/uploads/profiles/${p.author.avatar}` : undefined} sx={{ width: 28, height: 28 }}>
                                          {p.author?.nom?.charAt(0)?.toUpperCase() || 'U'}
                                        </Avatar>
                                        <Box>
                                          <Typography variant="subtitle2">{p.author?.nom}</Typography>
                                          <Typography variant="caption" color="text.secondary">{formatTimeAgo(new Date(p.timestamp))}</Typography>
                                        </Box>
                                      </Box>
                                      <Typography variant="body2" paragraph>{p.content}</Typography>
                                      {/* Commentaires */}
                                      <Box>
                                        {(p.comments || []).map((c: any) => (
                                          <Box key={c.id} display="flex" gap={1} alignItems="flex-start" mb={1}>
                                            <Avatar src={c.user?.avatar && c.user.avatar !== 'default.jpg' ? `http://localhost:5006/uploads/profiles/${c.user.avatar}` : undefined} sx={{ width: 24, height: 24 }}>
                                              {c.user?.nom?.charAt(0)?.toUpperCase() || 'U'}
                                            </Avatar>
                                            <Box bgcolor="grey.100" borderRadius={2} px={1.5} py={1} flex={1}>
                                              <Typography variant="subtitle2">{c.user?.nom}</Typography>
                                              <Typography variant="body2">{c.content}</Typography>
                                              <Typography variant="caption" color="text.secondary">{formatTimeAgo(new Date(c.date))}</Typography>
                                            </Box>
                                          </Box>
                                        ))}
                                      </Box>
                                      {/* Ajouter un commentaire */}
                                      <Box display="flex" gap={1} mt={1}>
                                        <TextField
                                          size="small"
                                          fullWidth
                                          placeholder="Commenter..."
                                          value={groupCommentInputs[g.id]?.[p.id] || ''}
                                          onChange={(e) => handleGroupCommentInputChange(g.id, p.id, e.target.value)}
                                        />
                                        <Button size="small" variant="contained" disabled={!((groupCommentInputs[g.id]?.[p.id] || '').trim())} onClick={() => handleCreateGroupComment(g.id, p.id)}>
                                          Envoyer
                                        </Button>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  {!groups.length && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Aucun groupe trouvé.</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Astuces
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rejoignez des groupes alignés avec vos objectifs. Partagez vos questions et aidez les autres pour progresser plus vite.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default Community;
