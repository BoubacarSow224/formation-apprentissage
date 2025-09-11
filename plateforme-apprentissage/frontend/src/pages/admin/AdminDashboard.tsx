import React from 'react';
import { Container, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import SuperAdminPanel from '../../components/admin/SuperAdminPanel';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Vérifier si l'utilisateur est admin
  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          Accès refusé. Vous devez être administrateur pour accéder à cette page.
        </Alert>
      </Container>
    );
  }

  return <SuperAdminPanel />;
};

export default AdminDashboard;
