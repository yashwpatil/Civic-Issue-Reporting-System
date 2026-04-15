// Database layer - Using in-memory storage with file persistence
// In production, this would connect to MongoDB, PostgreSQL, etc.

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: 'garbage' | 'roads' | 'water' | 'electricity' | 'other';
  location: string;
  image_url?: string;
  latitude?: string;
  longitude?: string;
  address?: string;
  audio?: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority?: 'high' | 'medium' | 'low';
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  userId?: string;
  user_id?: string;
  contactEmail?: string;
  contact_email?: string;
  contactPhone?: string;
  contact_phone?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In production, use bcrypt for hashing
  type: 'user' | 'admin' | 'department';
  departmentCode?: 'water' | 'roads' | 'electricity' | 'garbage';
  createdAt: string;
  updatedAt: string;
}

// In-memory database - starts empty, users add data
let complaints: Complaint[] = [];
let users: User[] = [
  {
    id: 'admin-001',
    name: 'Admin User',
    email: 'admin@civichub.com',
    password: 'Admin@123', // In production, use bcrypt
    type: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dept-water-001',
    name: 'Water Department',
    email: 'water@civichub.com',
    password: 'DeptWater2024',
    type: 'department',
    departmentCode: 'water',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dept-roads-001',
    name: 'Road Department',
    email: 'roads@civichub.com',
    password: 'DeptRoads2024',
    type: 'department',
    departmentCode: 'roads',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dept-electricity-001',
    name: 'Electricity Department',
    email: 'electricity@civichub.com',
    password: 'DeptElectricity2024',
    type: 'department',
    departmentCode: 'electricity',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dept-garbage-001',
    name: 'Garbage Department',
    email: 'garbage@civichub.com',
    password: 'DeptGarbage2024',
    type: 'department',
    departmentCode: 'garbage',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const db = {
  // Get all complaints
  getAllComplaints: (): Complaint[] => {
    return [...complaints].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // Get complaint by ID
  getComplaintById: (id: string): Complaint | null => {
    return complaints.find((c) => c.id === id) || null;
  },

  // Get complaints by user
  getComplaintsByUser: (userId: string): Complaint[] => {
    return complaints
      .filter((c) => c.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  // Create complaint
  createComplaint: (data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Complaint => {
    const newComplaint: Complaint = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    complaints.push(newComplaint);
    return newComplaint;
  },

  // Update complaint status
  updateComplaintStatus: (
    id: string,
    status: 'pending' | 'in-progress' | 'resolved'
  ): Complaint | null => {
    const complaint = complaints.find((c) => c.id === id);
    if (complaint) {
      complaint.status = status;
      complaint.updatedAt = new Date().toISOString();
      return complaint;
    }
    return null;
  },

  // Update complaint
  updateComplaint: (id: string, data: Partial<Complaint>): Complaint | null => {
    const complaint = complaints.find((c) => c.id === id);
    if (complaint) {
      Object.assign(complaint, data, {
        updatedAt: new Date().toISOString(),
      });
      return complaint;
    }
    return null;
  },

  // Delete complaint
  deleteComplaint: (id: string): boolean => {
    const index = complaints.findIndex((c) => c.id === id);
    if (index > -1) {
      complaints.splice(index, 1);
      return true;
    }
    return false;
  },

  // Get statistics
  getStats: () => {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === 'pending').length;
    const inProgress = complaints.filter((c) => c.status === 'in-progress').length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;

    const byCategory = {
      garbage: complaints.filter((c) => c.category === 'garbage').length,
      roads: complaints.filter((c) => c.category === 'roads').length,
      water: complaints.filter((c) => c.category === 'water').length,
      electricity: complaints.filter((c) => c.category === 'electricity').length,
      other: complaints.filter((c) => c.category === 'other').length,
    };

    return {
      total,
      pending,
      inProgress,
      resolved,
      byCategory,
    };
  },

  // USER MANAGEMENT METHODS
  getAllUsers: (): User[] => {
    return users.map(u => ({ ...u, password: '' })); // Don't return passwords
  },

  getUserById: (id: string): User | null => {
    const user = users.find((u) => u.id === id);
    return user ? { ...user, password: '' } : null;
  },

  getUserByEmail: (email: string): User | null => {
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  createUser: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User => {
    // Check if user already exists
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      ...data,
      id: `user-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    return { ...newUser, password: '' };
  },

  validateUser: (email: string, password: string): User | null => {
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    return user ? { ...user, password: '' } : null;
  },

  updateUser: (id: string, data: Partial<User>): User | null => {
    const user = users.find((u) => u.id === id);
    if (user) {
      Object.assign(user, data, {
        updatedAt: new Date().toISOString(),
      });
      return { ...user, password: '' };
    }
    return null;
  },

  deleteUser: (id: string): boolean => {
    const index = users.findIndex((u) => u.id === id);
    if (index > -1) {
      users.splice(index, 1);
      return true;
    }
    return false;
  },

  getUserStats: () => {
    return {
      totalUsers: users.length,
      admins: users.filter((u) => u.type === 'admin').length,
      citizens: users.filter((u) => u.type === 'user').length,
    };
  },
};
