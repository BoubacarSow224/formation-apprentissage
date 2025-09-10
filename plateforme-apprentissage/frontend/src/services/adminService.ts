import api from './api';
import { User, Cours, Quiz, ActivityLog } from '../types';

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalQuizzes: number;
  totalJobs: number;
  activeUsers: number;
  newUsersThisMonth: number;
  coursesCompleted: number;
  revenue: number;
  pendingModeration: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export interface CourseFilters {
  search?: string;
  category?: string;
  level?: string;
  status?: string;
  page?: number;
  limit?: number;
}


export const adminService = {
  // Statistiques générales
  async getStats(): Promise<AdminStats> {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  async getActivityLogs(limit: number = 20): Promise<ActivityLog[]> {
    const response = await api.get(`/admin/activity?limit=${limit}`);
    return response.data;
  },

  // Gestion des utilisateurs
  async getUsers(filters?: UserFilters): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  async toggleUserStatus(id: string): Promise<User> {
    const response = await api.patch(`/admin/users/${id}/toggle-status`);
    return response.data;
  },

  async resetUserPassword(id: string): Promise<{ temporaryPassword: string }> {
    const response = await api.post(`/admin/users/${id}/reset-password`);
    return response.data;
  },

  // Gestion des cours
  async getCourses(filters?: CourseFilters): Promise<{
    courses: Cours[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/admin/courses?${params.toString()}`);
    return response.data;
  },

  async getCourseById(id: string): Promise<Cours> {
    const response = await api.get(`/admin/courses/${id}`);
    return response.data;
  },

  async createCourse(courseData: Partial<Cours>): Promise<Cours> {
    const response = await api.post('/admin/courses', courseData);
    return response.data;
  },

  async updateCourse(id: string, courseData: Partial<Cours>): Promise<Cours> {
    const response = await api.put(`/admin/courses/${id}`, courseData);
    return response.data;
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(`/admin/courses/${id}`);
  },

  async toggleCourseStatus(id: string): Promise<Cours> {
    const response = await api.patch(`/admin/courses/${id}/toggle-status`);
    return response.data;
  },

  async getCourseStats(id: string): Promise<{
    enrollments: number;
    completions: number;
    averageRating: number;
    revenue: number;
  }> {
    const response = await api.get(`/admin/courses/${id}/stats`);
    return response.data;
  },

  // Gestion des quiz
  async getQuizzes(filters?: any): Promise<{
    quizzes: Quiz[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/admin/quizzes?${params.toString()}`);
    return response.data;
  },

  async getQuizById(id: string): Promise<Quiz> {
    const response = await api.get(`/admin/quizzes/${id}`);
    return response.data;
  },

  async createQuiz(quizData: Partial<Quiz>): Promise<Quiz> {
    const response = await api.post('/admin/quizzes', quizData);
    return response.data;
  },

  async updateQuiz(id: string, quizData: Partial<Quiz>): Promise<Quiz> {
    const response = await api.put(`/admin/quizzes/${id}`, quizData);
    return response.data;
  },

  async deleteQuiz(id: string): Promise<void> {
    await api.delete(`/admin/quizzes/${id}`);
  },

  async toggleQuizStatus(id: string): Promise<Quiz> {
    const response = await api.patch(`/admin/quizzes/${id}/toggle-status`);
    return response.data;
  },

  async getQuizStats(id: string): Promise<{
    attempts: number;
    averageScore: number;
    passRate: number;
  }> {
    const response = await api.get(`/admin/quizzes/${id}/stats`);
    return response.data;
  },

  // Gestion des offres d'emploi
  async getJobs(filters?: any): Promise<any> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/admin/jobs?${params.toString()}`);
    return response.data;
  },

  async approveJob(id: string): Promise<void> {
    await api.patch(`/admin/jobs/${id}/approve`);
  },

  async rejectJob(id: string, reason?: string): Promise<void> {
    await api.patch(`/admin/jobs/${id}/reject`, { reason });
  },

  // Rapports et analytics
  async getUserGrowthData(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    labels: string[];
    data: number[];
  }> {
    const response = await api.get(`/admin/analytics/user-growth?period=${period}`);
    return response.data;
  },

  async getCourseCompletionData(): Promise<{
    completed: number;
    inProgress: number;
    abandoned: number;
  }> {
    const response = await api.get('/admin/analytics/course-completion');
    return response.data;
  },

  async getRevenueData(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    labels: string[];
    data: number[];
  }> {
    const response = await api.get(`/admin/analytics/revenue?period=${period}`);
    return response.data;
  },

  async getTopCourses(limit: number = 10): Promise<Array<{
    course: Cours;
    enrollments: number;
    revenue: number;
    rating: number;
  }>> {
    const response = await api.get(`/admin/analytics/top-courses?limit=${limit}`);
    return response.data;
  },

  async getTopInstructors(limit: number = 10): Promise<Array<{
    instructor: User;
    coursesCreated: number;
    totalEnrollments: number;
    averageRating: number;
    revenue: number;
  }>> {
    const response = await api.get(`/admin/analytics/top-instructors?limit=${limit}`);
    return response.data;
  },

  // Export de données
  async exportUsers(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await api.get(`/admin/export/users?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async exportCourses(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await api.get(`/admin/export/courses?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async exportRevenue(
    startDate: Date,
    endDate: Date,
    format: 'csv' | 'xlsx' = 'csv'
  ): Promise<Blob> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      format
    });
    const response = await api.get(`/admin/export/revenue?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Configuration système
  async getSystemConfig(): Promise<any> {
    const response = await api.get('/admin/config');
    return response.data;
  },

  async updateSystemConfig(config: any): Promise<any> {
    const response = await api.put('/admin/config', config);
    return response.data;
  },

  // Notifications système
  async sendSystemNotification(notification: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    targetUsers?: string[];
    targetRoles?: string[];
  }): Promise<void> {
    await api.post('/admin/notifications/system', notification);
  },

  // Maintenance
  async clearCache(): Promise<void> {
    await api.post('/admin/maintenance/clear-cache');
  },

  async backupDatabase(): Promise<{ backupId: string; downloadUrl: string }> {
    const response = await api.post('/admin/maintenance/backup');
    return response.data;
  },

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    database: boolean;
    redis: boolean;
    storage: boolean;
    memory: number;
    cpu: number;
  }> {
    const response = await api.get('/admin/maintenance/health');
    return response.data;
  }
};

export default adminService;
