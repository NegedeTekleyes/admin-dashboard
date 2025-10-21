export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  } | null;
  userId: number;
  user: {
    phone: string;
    id: number;
    name: string;
    email: string;
  };
  tasks: Array<{
    status: any;
    createdAt(createdAt: any): import("react").ReactNode;
    updatedAt: any;
    notes: any;
    id: number;
    technician: {
      speciality: any;
      id: number;
      user: {
        id: number;
        name: string;
        email: string;
      };
    };
    assignedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  adminNotes?: string;
}

export interface ComplaintStats {
  total: number;
  byStatus: {
    submitted: number;
    assigned: number;
    in_progress: number;
    resolved: number;
    rejected: number;
  };
  recentCount: number;
}

export interface PaginatedComplaints {
  complaints: Complaint[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}