import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AccountCircle, Logout } from '@mui/icons-material';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const goToDashboard = () => {
    if (!user) {
      navigate('/');
      return;
    }
    switch (user.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'formateur':
        navigate('/formateur');
        break;
      case 'apprenant':
        navigate('/apprenant');
        break;
      case 'entreprise':
        navigate('/entreprise');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleClose();
  };

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <span onClick={goToDashboard} style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            Plateforme d'Apprentissage
          </span>
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={Link} to="/courses">
            Cours
          </Button>
          {user && (user.role === 'formateur' || user.role === 'apprenant') && (
            <Button color="inherit" component={Link} to="/community">
              Communauté
            </Button>
          )}
          <Button color="inherit" component={Link} to="/jobs">
            Emplois
          </Button>
          {user && user.role !== 'apprenant' && user.role !== 'admin' && (
            <Button color="inherit" component={Link} to="/groupes">
              Groupes
            </Button>
          )}
          
          {user ? (
            <>
              {user.role === 'formateur' && (
                <>
                  <Button color="inherit" component={Link} to="/formateur">
                    Formateur
                  </Button>
                  <Button color="inherit" component={Link} to="/formateur/cours/nouveau">
                    Créer un cours
                  </Button>
                </>
              )}
              {user.role === 'apprenant' && (
                <Button color="inherit" component={Link} to="/apprenant">
                  Apprenant
                </Button>
              )}
              {user.role === 'entreprise' && (
                <Button color="inherit" component={Link} to="/entreprise">
                  Entreprise
                </Button>
              )}
              {user.role === 'admin' && (
                <Button color="inherit" component={Link} to="/admin">
                  Admin
                </Button>
              )}
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                {user.photoProfil ? (
                  <Avatar src={user.photoProfil} sx={{ width: 32, height: 32 }} />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
                  Profil
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} />
                  Déconnexion
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Connexion
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Inscription
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
