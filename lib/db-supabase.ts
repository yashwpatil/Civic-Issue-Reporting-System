// lib/db-supabase.ts
/**
 * Supabase Database Layer
 * This replaces lib/db.ts with Supabase backend integration
 */

import { supabaseServer } from './supabase-server';
import { supabase } from './supabase-client';

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
  audio_url?: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority?: 'high' | 'medium' | 'low';
  user_id?: string;
  assigned_department?: string;
  contact_email?: string;
  contact_phone?: string;
  resolution_proof_url?: string;
  reported_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  type: 'user' | 'admin' | 'department';
  department_code?: 'water' | 'roads' | 'electricity' | 'garbage';
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  code: 'water' | 'roads' | 'electricity' | 'garbage';
  name: string;
  description?: string;
  email: string;
  aliases?: string[];
  created_at: string;
  updated_at: string;
}

export interface IssueRemark {
  id: string;
  complaint_id: string;
  remark: string;
  user_id?: string;
  created_at: string;
}

/**
 * USER OPERATIONS
 */
export const userDb = {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    return (data || []).map(u => ({ ...u, password: '' }));
  },

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? { ...data, password: '' } : null;
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .ilike('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Create user
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    // Check if user already exists
    const existing = await userDb.getUserByEmail(userData.email);
    if (existing) throw new Error('User with this email already exists');

    const { data, error } = await supabaseServer
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return { ...data, password: '' };
  },

  // Validate user (login)
  async validateUser(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .ilike('email', email)
      .single();

    if (error) return null;
    if (data?.password === password) {
      return { ...data, password: '' };
    }
    return null;
  },

  // Update user
  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabaseServer
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user: ${error.message}`);
    return data ? { ...data, password: '' } : null;
  },

  // Delete user
  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabaseServer
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete user: ${error.message}`);
    return true;
  },

  // Get user stats
  async getUserStats() {
    const { data, error } = await supabaseServer
      .from('users')
      .select('type');

    if (error) throw new Error(`Failed to get stats: ${error.message}`);

    const stats = {
      totalUsers: data?.length || 0,
      admins: data?.filter((u: any) => u.type === 'admin').length || 0,
      citizens: data?.filter((u: any) => u.type === 'user').length || 0,
      departments: data?.filter((u: any) => u.type === 'department').length || 0,
    };

    return stats;
  },
};

/**
 * COMPLAINT OPERATIONS
 */
export const complaintDb = {
  // Get all complaints
  async getAllComplaints(): Promise<Complaint[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch complaints: ${error.message}`);
    return data || [];
  },

  // Get complaint by ID
  async getComplaintById(id: string): Promise<Complaint | null> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Get complaints by user
  async getComplaintsByUser(userId: string): Promise<Complaint[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch user complaints: ${error.message}`);
    return data || [];
  },

  // Get complaints by department
  async getComplaintsByDepartment(departmentCode: string): Promise<Complaint[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('assigned_department', departmentCode)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch department complaints: ${error.message}`);
    return data || [];
  },

  // Create complaint
  async createComplaint(complaintData: Omit<Complaint, 'id' | 'created_at' | 'updated_at'>): Promise<Complaint> {
    const { data, error } = await supabase
      .from('complaints')
      .insert([{
        ...complaintData,
        reported_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create complaint: ${error.message}`);
    return data;
  },

  // Update complaint (partial)
  async updateComplaint(id: string, complaintData: Partial<Complaint>): Promise<Complaint | null> {
    const { data, error } = await supabase
      .from('complaints')
      .update(complaintData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update complaint: ${error.message}`);
    return data || null;
  },

  // Update complaint status
  async updateComplaintStatus(id: string, status: 'pending' | 'in-progress' | 'resolved'): Promise<Complaint | null> {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update complaint status: ${error.message}`);
    return data || null;
  },

  // Delete complaint
  async deleteComplaint(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete complaint: ${error.message}`);
    return true;
  },

  // Get stats
  async getStats() {
    const { data, error } = await supabase
      .from('complaints')
      .select('status, category');

    if (error) throw new Error(`Failed to get stats: ${error.message}`);

    const total = data?.length || 0;
    const pending = data?.filter((c: any) => c.status === 'pending').length || 0;
    const inProgress = data?.filter((c: any) => c.status === 'in-progress').length || 0;
    const resolved = data?.filter((c: any) => c.status === 'resolved').length || 0;

    const byCategory = {
      garbage: data?.filter((c: any) => c.category === 'garbage').length || 0,
      roads: data?.filter((c: any) => c.category === 'roads').length || 0,
      water: data?.filter((c: any) => c.category === 'water').length || 0,
      electricity: data?.filter((c: any) => c.category === 'electricity').length || 0,
      other: data?.filter((c: any) => c.category === 'other').length || 0,
    };

    return { total, pending, inProgress, resolved, byCategory };
  },
};

/**
 * DEPARTMENT OPERATIONS
 */
export const departmentDb = {
  // Get all departments
  async getAllDepartments(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch departments: ${error.message}`);
    return data || [];
  },

  // Get department by code
  async getDepartmentByCode(code: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Get department by ID
  async getDepartmentById(id: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
};

/**
 * ISSUE REMARKS OPERATIONS
 */
export const remarksDb = {
  // Get remarks for a complaint
  async getRemarksForComplaint(complaintId: string): Promise<IssueRemark[]> {
    const { data, error } = await supabase
      .from('issue_remarks')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch remarks: ${error.message}`);
    return data || [];
  },

  // Add remark to complaint
  async addRemark(remarkData: Omit<IssueRemark, 'id' | 'created_at'>): Promise<IssueRemark> {
    const { data, error } = await supabase
      .from('issue_remarks')
      .insert([remarkData])
      .select()
      .single();

    if (error) throw new Error(`Failed to add remark: ${error.message}`);
    return data;
  },
};

/**
 * FILE UPLOAD OPERATIONS
 */
export const fileDb = {
  // Upload complaint image
  async uploadComplaintImage(file: File, complaintId: string): Promise<string> {
    const filename = `${complaintId}-${Date.now()}-${file.name}`;
    
    const { error } = await supabase.storage
      .from('complaint-images')
      .upload(filename, file);

    if (error) throw new Error(`Failed to upload image: ${error.message}`);

    const { data } = supabase.storage
      .from('complaint-images')
      .getPublicUrl(filename);

    return data.publicUrl;
  },

  // Upload complaint audio
  async uploadComplaintAudio(file: Blob, complaintId: string): Promise<string> {
    const filename = `${complaintId}-${Date.now()}.webm`;
    
    const { error } = await supabase.storage
      .from('complaint-audio')
      .upload(filename, file);

    if (error) throw new Error(`Failed to upload audio: ${error.message}`);

    const { data } = supabase.storage
      .from('complaint-audio')
      .getPublicUrl(filename);

    return data.publicUrl;
  },

  // Upload resolution proof
  async uploadResolutionProof(file: File, complaintId: string): Promise<string> {
    const filename = `${complaintId}-${Date.now()}-${file.name}`;
    
    const { error } = await supabase.storage
      .from('resolution-proofs')
      .upload(filename, file);

    if (error) throw new Error(`Failed to upload proof: ${error.message}`);

    const { data } = supabase.storage
      .from('resolution-proofs')
      .getPublicUrl(filename);

    return data.publicUrl;
  },

  // Delete file
  async deleteFile(bucket: string, filename: string): Promise<boolean> {
    const { error } = await supabase.storage.from(bucket).remove([filename]);

    if (error) throw new Error(`Failed to delete file: ${error.message}`);
    return true;
  },
};

// Export combined db object for easier access
export const db = {
  users: userDb,
  complaints: complaintDb,
  departments: departmentDb,
  remarks: remarksDb,
  files: fileDb,
};

export default db;
