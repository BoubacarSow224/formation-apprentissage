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
  Avatar,
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
  InputAdornment
} from '@mui/material';
import {
  Edit,
  Delete,
  Block,
  CheckCircle,
  Search,
  Add,
  Visibility,
  Email,
  Phone
} from '@mui/icons-material';
import { User } from '../../types';

interface UserManagementProps {
  onUserUpdate?: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onUserUpdate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'edit' | 'view' | 'delete'>('view');

  // Données simulées
  const mockUsers: User[] = [
    {
      _id: '1',
      nom: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      telephone: '+33123456789',
      role: 'apprenant',
      dateInscription: new Date('2024-01-15'),
      estActif: true,
      coursSuivis: [
        { cours: 'react-basics', progression: 75, termine: false, dateInscription: new Date() }
      ],
      badgesObtenus: []
    },
    {
      _id: '2',
      nom: 'Marie Martin',
      email: 'marie.martin@email.com',
      telephone: '+33987654321',
      role: 'formateur',
      dateInscription: new Date('2024-02-10'),
      estActif: true,
      coursCrees: ['react-advanced', 'javascript-es6'],
      evaluationMoyenne: 4.8
    },
    {
      _id: '3',
      nom: 'Pierre Durand',
      email: 'pierre.durand@email.com',
      telephone: '+33456789123',
      role: 'apprenant',
      dateInscription: new Date('2024-03-05'),
      estActif: false,
      coursSuivis: [
        { cours: 'html-css', progression: 100, termine: true, dateInscription: new Date() }
      ],
      badgesObtenus: [
        { badge: 'html-master', dateObtention: new Date(), cours: 'html-css' }
      ]
    },
    {
      _id: '4',
      nom: 'TechCorp SARL',
      email: 'contact@techcorp.com',
      telephone: '+33111222333',
      role: 'entreprise',
      dateInscription: new Date('2024-01-20'),
      estActif: true,
      nomEntreprise: 'TechCorp',
      secteurActivite: 'Informatique',
      offresEmploi: ['dev-react', 'dev-node']
    }
  ];

  useEffect(() => {
    loadUsers();
  }, [searchTerm, roleFilter, statusFilter, page]);

  // Charger les utilisateurs depuis l'API
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter as "active" | "inactive" | undefined,
        page,
        limit: 10
      });
      
      setUsers(response.users);
      setFilteredUsers(response.users);
      setTotalUsers(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      // En cas d'erreur, utiliser les données mock
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setTotalUsers(mockUsers.length);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };


  const handleOpenDialog = (user: User, type: 'edit' | 'view' | 'delete') => {
    setSelectedUser(user);
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await adminService.deleteUser(userId);
        await loadUsers();
        onUserUpdate?.();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await adminService.toggleUserStatus(userId);
      await loadUsers();
      onUserUpdate?.();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'formateur': return 'primary';
      case 'apprenant': return 'success';
      case 'entreprise': return 'warning';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'formateur': return 'Formateur';
      case 'apprenant': return 'Apprenant';
      case 'entreprise': return 'Entreprise';
      default: return role;
    }
  };

  return (
    <Box>
      {/* Filtres et recherche */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Rechercher un utilisateur..."
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

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Rôle</InputLabel>
          <Select
            value={roleFilter}
            label="Rôle"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="formateur">Formateur</MenuItem>
            <MenuItem value="apprenant">Apprenant</MenuItem>
            <MenuItem value="entreprise">Entreprise</MenuItem>
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
            <MenuItem value="active">Actif</MenuItem>
            <MenuItem value="inactive">Inactif</MenuItem>
          </Select>
        </FormControl>

        <Button
          startIcon={<Add />}
          variant="contained"
          onClick={() => handleOpenDialog({} as User, 'edit')}
        >
          Ajouter
        </Button>
      </Box>

      {/* Table des utilisateurs */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Inscription</TableCell>
              <TableCell>Statistiques</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2 }}>
                      {user.nom.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {user.nom}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ID: {user._id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {user.email || 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {user.telephone}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={user.estActif ? 'Actif' : 'Inactif'}
                    color={user.estActif ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {new Date(user.dateInscription).toLocaleDateString()}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box>
                    {user.role === 'apprenant' && (
                      <>
                        <Typography variant="caption" display="block">
                          Cours: {user.coursSuivis?.length || 0}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Badges: {user.badgesObtenus?.length || 0}
                        </Typography>
                      </>
                    )}
                    {user.role === 'formateur' && (
                      <>
                        <Typography variant="caption" display="block">
                          Cours créés: {user.coursCrees?.length || 0}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Note: {user.evaluationMoyenne || 'N/A'}/5
                        </Typography>
                      </>
                    )}
                    {user.role === 'entreprise' && (
                      <>
                        <Typography variant="caption" display="block">
                          Secteur: {user.secteurActivite || 'N/A'}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Offres: {user.offresEmploi?.length || 0}
                        </Typography>
                      </>
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Voir détails">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user, 'view')}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Modifier">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user, 'edit')}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={user.estActif ? 'Désactiver' : 'Activer'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(user._id)}
                        color={user.estActif ? 'error' : 'success'}
                      >
                        {user.estActif ? <Block /> : <CheckCircle />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Supprimer">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user, 'delete')}
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
          {dialogType === 'view' && 'Détails de l\'utilisateur'}
          {dialogType === 'edit' && (selectedUser?._id ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur')}
          {dialogType === 'delete' && 'Confirmer la suppression'}
        </DialogTitle>

        <DialogContent>
          {dialogType === 'delete' ? (
            <Alert severity="warning">
              Êtes-vous sûr de vouloir supprimer l'utilisateur "{selectedUser?.nom}" ?
              Cette action est irréversible.
            </Alert>
          ) : (
            <Box sx={{ pt: 2 }}>
              {selectedUser && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedUser.nom}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Email: {selectedUser.email || 'N/A'}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Téléphone: {selectedUser.telephone}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Rôle: {getRoleLabel(selectedUser.role)}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Statut: {selectedUser.estActif ? 'Actif' : 'Inactif'}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Inscription: {new Date(selectedUser.dateInscription).toLocaleDateString()}
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
            <Button onClick={() => handleDeleteUser(selectedUser?._id || '')} color="error" variant="contained">
              Supprimer
            </Button>
          )}
          {dialogType === 'edit' && (
            <Button variant="contained">
              {selectedUser?._id ? 'Modifier' : 'Ajouter'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
