// types/technician.ts
export interface Technician {
  id: number;
  userId: number;
  speciality: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    lastLogin: string | null;
    createdAt: string;
  };
  tasks: Array<{
    id: number;
    complaint: {
      id: number;
      status: string;
      category: string;
      urgency: string;
    };
  }>;
  stats?: {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    efficiency: number;
  };
}

export interface TechnicianStats {
  id: number;
  name: string;
  email: string;
  speciality: string | null;
  status: string;
  totalTasks: number;
  completedTasks: number;
  efficiency: number;
  avgResolutionTime: number;
}

export interface PaginatedTechnicians {
  technicians: Technician[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}