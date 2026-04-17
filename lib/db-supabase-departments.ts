import { supabaseClient } from './supabase-client';
import { supabaseServer } from './supabase-server';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  type: 'user' | 'admin' | 'department';
  department_code?: string;
  created_at?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  address: string;
  image_url: string;
  audio_url: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  user_id: string;
  contact_email: string;
  contact_phone: string;
  resolution_proof_url: string;
  reported_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Remark {
  id: string;
  department?: string | null;
  complaint_id?: string | null;
  report_id?: string | null;
  remark: string;
  ai_reason?: string | null;
  confidence?: number | string | null;
  status?: string | null;
  reporter_name?: string | null;
  reporter_contact?: string | null;
  location?: string | null;
  user_id?: string | null;
  created_at: string;
}

export interface ReviewQueueItem {
  complaint: Complaint;
  currentDepartment: DepartmentCode;
  reviewDepartment: DepartmentCode;
  latestRemark: Remark;
  remarks: Remark[];
  source: 'department' | 'legacy' | 'remark-only';
  reviewId: string;
  reportId?: string | null;
}

export interface DepartmentStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  avg_resolution_days: number;
}

export const VALID_DEPARTMENTS = [
  'water',
  'roads',
  'electricity',
  'garbage',
] as const;

export type DepartmentCode = (typeof VALID_DEPARTMENTS)[number];

// ============================================================================
// HELPER FUNCTION: GET TABLE NAME BY DEPARTMENT
// ============================================================================

function getComplaintsTableName(department: string): string {
  const tableMap: Record<DepartmentCode, string> = {
    water: 'water_complaints',
    roads: 'roads_complaints',
    electricity: 'electricity_complaints',
    garbage: 'garbage_complaints',
  };

  const normalizedDepartment = department.toLowerCase() as DepartmentCode;
  const tableName = tableMap[normalizedDepartment];
  if (!tableName) {
    throw new Error(
      `Invalid department: ${department}. Must be one of: water, roads, electricity, garbage`
    );
  }

  return tableName;
}

function isUuid(value?: string | null): value is string {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function getDepartmentComplaintByIdAdmin(
  complaintId: string,
  department: DepartmentCode
): Promise<Complaint | null> {
  if (!isUuid(complaintId)) {
    return null;
  }

  const tableName = getComplaintsTableName(department);

  const { data, error } = await supabaseServer
    .from(tableName)
    .select('*')
    .eq('id', complaintId)
    .maybeSingle();

  if (error) {
    console.error(
      `Error fetching complaint from ${department}:`,
      error.message
    );
    throw new Error(
      `Failed to fetch complaint from ${department}: ${error.message}`
    );
  }

  return data || null;
}

async function getLegacyComplaintByIdAdmin(complaintId: string): Promise<any | null> {
  if (!isUuid(complaintId)) {
    return null;
  }

  const { data, error } = await supabaseServer
    .from('complaints')
    .select('*')
    .eq('id', complaintId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching legacy complaint:', error.message);
    throw new Error(`Failed to fetch legacy complaint: ${error.message}`);
  }

  return data || null;
}

async function deleteLegacyComplaintByIdAdmin(complaintId: string): Promise<void> {
  if (!isUuid(complaintId)) {
    return;
  }

  const { error } = await supabaseServer
    .from('complaints')
    .delete()
    .eq('id', complaintId);

  if (error) {
    console.error('Error deleting legacy complaint:', error.message);
    throw new Error(`Failed to delete legacy complaint: ${error.message}`);
  }
}

async function updateLegacyComplaintStatusAdmin(
  complaintId: string,
  status: 'pending' | 'in-progress' | 'resolved'
): Promise<any> {
  if (!isUuid(complaintId)) {
    throw new Error('Invalid complaint ID');
  }

  const updateData: Record<string, string> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'resolved') {
    updateData.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabaseServer
    .from('complaints')
    .update(updateData)
    .eq('id', complaintId)
    .select()
    .single();

  if (error) {
    console.error('Error updating legacy complaint:', error.message);
    throw new Error(`Failed to update legacy complaint: ${error.message}`);
  }

  return data;
}

function parseCoordinates(location?: string | null): {
  latitude: number;
  longitude: number;
  address: string;
} {
  if (!location) {
    return { latitude: 0, longitude: 0, address: '' };
  }

  const match = location.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
  );

  if (!match) {
    return {
      latitude: 0,
      longitude: 0,
      address: location,
    };
  }

  return {
    latitude: Number(match[1]),
    longitude: Number(match[2]),
    address: location,
  };
}

function createComplaintFromRemarkOnlyRow(
  remark: Remark,
  department: DepartmentCode
): Complaint {
  const parsedLocation = parseCoordinates(remark.location);
  const descriptionParts = [remark.remark, remark.ai_reason]
    .filter(Boolean)
    .join(' ');

  return {
    id: remark.report_id || remark.id,
    title: `Reviewed Report ${remark.report_id || remark.id}`,
    description: descriptionParts || 'Pending reviewed report.',
    location: remark.location || 'Location not provided',
    latitude: parsedLocation.latitude,
    longitude: parsedLocation.longitude,
    address: parsedLocation.address,
    image_url: '',
    audio_url: '',
    status: 'pending',
    priority: 'medium',
    user_id: '',
    contact_email: '',
    contact_phone: remark.reporter_contact || '',
    resolution_proof_url: '',
    reported_at: remark.created_at,
    resolved_at: null,
    created_at: remark.created_at,
    updated_at: remark.created_at,
  };
}

// ============================================================================
// USER DATABASE OPERATIONS
// ============================================================================

export const userDb = {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabaseServer.from('users').select('*');

    if (error) {
      console.error('Error fetching users:', error.message);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user:', error.message);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data || null;
  },

  // Check if user exists by ID
  async userExists(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      return !!user;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user by email:', error.message);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data || null;
  },

  // Create new user
  async createUser(
    email: string,
    name: string,
    password: string,
    type: 'user' | 'admin' = 'user',
    departmentCode?: string
  ): Promise<User> {
    const { data, error } = await supabaseServer
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password,
        type,
        department_code: departmentCode || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error.message);
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  },

  // Validate user credentials
  async validateUser(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('password', password)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error validating user:', error.message);
      throw new Error(`Failed to validate user: ${error.message}`);
    }

    return data || null;
  },

  // Update user
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabaseServer
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error.message);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabaseServer.from('users').delete().eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error.message);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },

  // Get user statistics
  async getUserStats(userId: string): Promise<{
    totalComplaints: number;
    resolvedComplaints: number;
  }> {
    const complaints: { total: number; resolved: number }[] = [];

    for (const dept of ['water', 'roads', 'electricity', 'garbage']) {
      const tableName = getComplaintsTableName(dept);
      const { data, error } = await supabaseServer
        .from(tableName)
        .select('status')
        .eq('user_id', userId);

      if (!error && data) {
        complaints.push({
          total: data.length,
          resolved: data.filter((c) => c.status === 'resolved').length,
        });
      }
    }

    return {
      totalComplaints: complaints.reduce((sum, c) => sum + c.total, 0),
      resolvedComplaints: complaints.reduce((sum, c) => sum + c.resolved, 0),
    };
  },
};

// ============================================================================
// COMPLAINT DATABASE OPERATIONS (DEPARTMENT-SPECIFIC)
// ============================================================================

export const complaintDb = {
  async createComplaintRecord(
    complaint: Partial<Complaint> &
      Pick<
        Complaint,
        | 'title'
        | 'location'
        | 'status'
        | 'priority'
        | 'user_id'
        | 'reported_at'
        | 'created_at'
        | 'updated_at'
      >,
    department: string
  ): Promise<Complaint> {
    const tableName = getComplaintsTableName(department);

    const payload = {
      ...(complaint.id ? { id: complaint.id } : {}),
      title: complaint.title?.trim() || '',
      description: complaint.description?.trim() || '',
      location: complaint.location?.trim() || '',
      latitude: complaint.latitude ?? 0,
      longitude: complaint.longitude ?? 0,
      address: complaint.address?.trim() || '',
      image_url: complaint.image_url || '',
      audio_url: complaint.audio_url || '',
      status: complaint.status || 'pending',
      priority: complaint.priority || 'medium',
      user_id: complaint.user_id || null,
      contact_email: complaint.contact_email?.trim() || '',
      contact_phone: complaint.contact_phone?.trim() || '',
      resolution_proof_url: complaint.resolution_proof_url || '',
      reported_at: complaint.reported_at || new Date().toISOString(),
      resolved_at: complaint.resolved_at || null,
      created_at: complaint.created_at || new Date().toISOString(),
      updated_at: complaint.updated_at || new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from(tableName)
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(`Error creating complaint in ${department}:`, error);
      throw new Error(
        `Failed to create complaint in ${department}: ${error.message}`
      );
    }

    return data;
  },

  // Create complaint in specific department table
  async createComplaint(
    complaint: Omit<Complaint, 'id' | 'created_at' | 'updated_at'>,
    department: string
  ): Promise<Complaint> {
    console.log('Creating complaint with data:', {
      title: complaint.title,
      location: complaint.location,
      user_id: complaint.user_id,
    });

    return this.createComplaintRecord(
      {
        ...complaint,
        reported_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      department
    );
  },

  // Get all complaints from specific department
  async getComplaintsByDepartment(department: string): Promise<Complaint[]> {
    const tableName = getComplaintsTableName(department);

    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(
        `Error fetching complaints from ${department}:`,
        error.message
      );
      throw new Error(
        `Failed to fetch complaints from ${department}: ${error.message}`
      );
    }

    return data || [];
  },

  // Get complaints by specific user
  async getComplaintsByUser(userId: string): Promise<Complaint[]> {
    const allComplaints: Complaint[] = [];

    for (const dept of ['water', 'roads', 'electricity', 'garbage']) {
      const tableName = getComplaintsTableName(dept);
      const { data, error } = await supabaseClient
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        allComplaints.push(...data);
      }
    }

    return allComplaints;
  },

  // Get complaint by ID from specific department
  async getComplaintById(
    complaintId: string,
    department: string
  ): Promise<Complaint | null> {
    const tableName = getComplaintsTableName(department);

    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      .eq('id', complaintId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(
        `Error fetching complaint from ${department}:`,
        error.message
      );
      throw new Error(
        `Failed to fetch complaint from ${department}: ${error.message}`
      );
    }

    return data || null;
  },

  // Update complaint status in specific department
  async updateComplaintStatus(
    complaintId: string,
    department: string,
    status: 'pending' | 'in-progress' | 'resolved',
    resolutionProofUrl?: string
  ): Promise<Complaint> {
    const tableName = getComplaintsTableName(department);

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    if (resolutionProofUrl) {
      updateData.resolution_proof_url = resolutionProofUrl;
    }

    const { data, error } = await supabaseServer
      .from(tableName)
      .update(updateData)
      .eq('id', complaintId)
      .select()
      .single();

    if (error) {
      console.error(
        `Error updating complaint in ${department}:`,
        error.message
      );
      throw new Error(
        `Failed to update complaint in ${department}: ${error.message}`
      );
    }

    return data;
  },

  // Update complaint in specific department
  async updateComplaint(
    complaintId: string,
    department: string,
    updates: Partial<Complaint>
  ): Promise<Complaint> {
    const tableName = getComplaintsTableName(department);

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from(tableName)
      .update(updateData)
      .eq('id', complaintId)
      .select()
      .single();

    if (error) {
      console.error(
        `Error updating complaint in ${department}:`,
        error.message
      );
      throw new Error(
        `Failed to update complaint in ${department}: ${error.message}`
      );
    }

    return data;
  },

  // Get department statistics
  async getDepartmentStats(department: string): Promise<DepartmentStats> {
    const tableName = getComplaintsTableName(department);

    const { data, error } = await supabaseClient
      .from(tableName)
      .select(
        `
        id,
        status,
        reported_at,
        resolved_at
      `
      );

    if (error) {
      console.error(`Error fetching stats for ${department}:`, error.message);
      throw new Error(
        `Failed to fetch stats for ${department}: ${error.message}`
      );
    }

    const complaints = data || [];
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === 'pending').length;
    const in_progress = complaints.filter(
      (c) => c.status === 'in-progress'
    ).length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;

    // Calculate average resolution time
    let avgResolutionDays = 0;
    const resolvedComplaints = complaints.filter(
      (c) => c.status === 'resolved' && c.resolved_at
    );

    if (resolvedComplaints.length > 0) {
      const totalDays = resolvedComplaints.reduce((sum, c) => {
        const reported = new Date(c.reported_at).getTime();
        const resolved = new Date(c.resolved_at).getTime();
        const days = (resolved - reported) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);

      avgResolutionDays = Math.round(
        (totalDays / resolvedComplaints.length) * 10
      ) / 10;
    }

    return {
      total,
      pending,
      in_progress,
      resolved,
      avg_resolution_days: avgResolutionDays,
    };
  },

  // Get closure rate
  async getClosureRate(department: string): Promise<{
    resolved: number;
    total: number;
    percentage: number;
  }> {
    const tableName = getComplaintsTableName(department);

    const { data, error } = await supabaseClient
      .from(tableName)
      .select('status');

    if (error) {
      console.error(
        `Error calculating closure rate for ${department}:`,
        error.message
      );
      throw new Error(
        `Failed to calculate closure rate for ${department}: ${error.message}`
      );
    }

    const complaints = data || [];
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { resolved, total, percentage };
  },

  // Delete complaint
  async deleteComplaint(complaintId: string, department: string): Promise<void> {
    const tableName = getComplaintsTableName(department);

    const { error } = await supabaseServer
      .from(tableName)
      .delete()
      .eq('id', complaintId);

    if (error) {
      console.error(
        `Error deleting complaint from ${department}:`,
        error.message
      );
      throw new Error(
        `Failed to delete complaint from ${department}: ${error.message}`
      );
    }
  },

  getComplaintByIdAdmin: getDepartmentComplaintByIdAdmin,
  deleteLegacyComplaintByIdAdmin,
  updateLegacyComplaintStatusAdmin,
  getLegacyComplaintByIdAdmin,

  async reassignComplaint(
    complaintId: string,
    fromDepartment: string,
    toDepartment: string,
    note?: string,
    userId?: string
  ): Promise<Complaint> {
    const normalizedSource = fromDepartment.toLowerCase();
    const normalizedTarget = toDepartment.toLowerCase();

    if (normalizedSource === normalizedTarget) {
      throw new Error('Complaint is already assigned to this department');
    }

    const complaint = await this.getComplaintById(complaintId, normalizedSource);

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    const movedComplaint = await this.createComplaintRecord(
      {
        ...complaint,
        id: complaint.id,
        updated_at: new Date().toISOString(),
      },
      normalizedTarget
    );

    const remarkText =
      note?.trim() ||
      `Reassigned by admin from ${normalizedSource} to ${normalizedTarget}.`;

    await remarksDb.addRemark(
      complaintId,
      normalizedSource,
      remarkText,
      userId
    );

    await this.deleteComplaint(complaintId, normalizedSource);

    return movedComplaint;
  },
};

// ============================================================================
// REMARKS DATABASE OPERATIONS
// ============================================================================

export const remarksDb = {
  async getAllRemarks(): Promise<Remark[]> {
    const { data, error } = await supabaseServer
      .from('issue_remarks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching remarks:', error.message);
      throw new Error(`Failed to fetch remarks: ${error.message}`);
    }

    return data || [];
  },

  // Get remarks for complaint
  async getRemarksForComplaint(
    complaintId: string,
    department: string
  ): Promise<Remark[]> {
    const { data, error } = await supabaseServer
      .from('issue_remarks')
      .select('*')
      .eq('complaint_id', complaintId)
      .eq('department', department)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching remarks:', error.message);
      throw new Error(`Failed to fetch remarks: ${error.message}`);
    }

    return data || [];
  },

  async getReviewQueue(): Promise<ReviewQueueItem[]> {
    const allRemarks = await this.getAllRemarks();
    const groupedRemarks = new Map<string, Remark[]>();

    for (const remark of allRemarks) {
      const hasComplaintId = isUuid(remark.complaint_id);
      const hasReportId = Boolean(remark.report_id);

      if (!hasComplaintId && !hasReportId) {
        console.warn(
          '[Remarks Queue] Skipping invalid issue_remarks row',
          {
            remarkId: remark.id,
            complaintId: remark.complaint_id,
            reportId: remark.report_id,
          }
        );
        continue;
      }

      const normalizedRemarkDepartment = remark.department?.toLowerCase();
      const remarkDepartment = VALID_DEPARTMENTS.includes(
        normalizedRemarkDepartment as DepartmentCode
      )
        ? (normalizedRemarkDepartment as DepartmentCode)
        : undefined;

      const reviewKey = remark.complaint_id || remark.report_id || remark.id;
      const key = `${reviewKey}:${remarkDepartment || 'legacy'}`;
      const existing = groupedRemarks.get(key) || [];
      existing.push({
        ...remark,
        department: remarkDepartment || null,
      });
      groupedRemarks.set(key, existing);
    }

    const queue: ReviewQueueItem[] = [];

    for (const [, remarkList] of groupedRemarks) {
      const sortedRemarks = [...remarkList].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latestRemark = sortedRemarks[0];

      if (!latestRemark || isHandledReviewRemark(latestRemark.remark)) {
        continue;
      }

      const complaintId = latestRemark.complaint_id;
      if (
        latestRemark.status &&
        latestRemark.status.toLowerCase() !== 'pending_review'
      ) {
        continue;
      }

      const reviewDepartment = resolveReviewDepartment(latestRemark);
      let complaint = reviewDepartment
        ? await getDepartmentComplaintByIdAdmin(complaintId || '', reviewDepartment)
        : null;
      let currentDepartment = reviewDepartment || 'garbage';
      let source: 'department' | 'legacy' | 'remark-only' = 'department';

      if (!complaint && isUuid(complaintId)) {
        for (const department of VALID_DEPARTMENTS) {
          complaint = await getDepartmentComplaintByIdAdmin(complaintId, department);
          if (complaint) {
            currentDepartment = department;
            source = 'department';
            break;
          }
        }
      }

      if (!complaint && isUuid(complaintId)) {
        const legacyComplaint = await getLegacyComplaintByIdAdmin(complaintId);
        if (!legacyComplaint) {
          complaint = null;
        }
        if (legacyComplaint) {
          currentDepartment = resolveLegacyDepartment(legacyComplaint);
          complaint = mapLegacyComplaintToDepartmentComplaint(
            legacyComplaint,
            currentDepartment
          );
          source = 'legacy';
        }
      }

      if (!complaint && latestRemark.report_id) {
        currentDepartment = reviewDepartment || 'garbage';
        complaint = createComplaintFromRemarkOnlyRow(
          latestRemark,
          currentDepartment
        );
        source = 'remark-only';
      }

      if (!complaint) {
        continue;
      }

      queue.push({
        complaint,
        currentDepartment,
        reviewDepartment: reviewDepartment || currentDepartment,
        latestRemark,
        remarks: sortedRemarks.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
        source,
        reviewId: latestRemark.id,
        reportId: latestRemark.report_id,
      });
    }

    return queue.sort(
      (a, b) =>
        new Date(b.latestRemark.created_at).getTime() -
        new Date(a.latestRemark.created_at).getTime()
    );
  },

  // Add remark to complaint
  async addRemark(
    complaintId: string,
    department: string,
    remark: string,
    userId?: string
  ): Promise<Remark> {
    const { data, error } = await supabaseServer
      .from('issue_remarks')
      .insert({
        complaint_id: complaintId,
        department: department.toLowerCase(),
        remark: remark.trim(),
        user_id: userId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding remark:', error.message);
      throw new Error(`Failed to add remark: ${error.message}`);
    }

    return data;
  },

  async resolveReviewItem(
    reviewId: string,
    updates: { status?: string; department?: string }
  ): Promise<void> {
    const { error } = await supabaseServer
      .from('issue_remarks')
      .update({
        ...updates,
      })
      .eq('id', reviewId);

    if (error) {
      console.error('Error updating review item:', error.message);
      throw new Error(`Failed to update review item: ${error.message}`);
    }
  },

  // Delete remark
  async deleteRemark(remarkId: string): Promise<void> {
    const { error } = await supabaseServer
      .from('issue_remarks')
      .delete()
      .eq('id', remarkId);

    if (error) {
      console.error('Error deleting remark:', error.message);
      throw new Error(`Failed to delete remark: ${error.message}`);
    }
  },
};

function isHandledReviewRemark(remark: string): boolean {
  const normalizedRemark = remark.trim().toLowerCase();

  return (
    normalizedRemark.startsWith('admin moved complaint') ||
    normalizedRemark.startsWith('reassigned by admin')
  );
}

function resolveReviewDepartment(remark: Remark): DepartmentCode | undefined {
  const normalizedDepartment = remark.department?.toLowerCase();
  if (VALID_DEPARTMENTS.includes(normalizedDepartment as DepartmentCode)) {
    return normalizedDepartment as DepartmentCode;
  }

  return undefined;
}

function resolveLegacyDepartment(complaint: {
  assigned_department?: string;
  category?: string;
}): DepartmentCode {
  const assignedDepartment = complaint.assigned_department?.toLowerCase();
  if (VALID_DEPARTMENTS.includes(assignedDepartment as DepartmentCode)) {
    return assignedDepartment as DepartmentCode;
  }

  const category = complaint.category?.toLowerCase();
  if (VALID_DEPARTMENTS.includes(category as DepartmentCode)) {
    return category as DepartmentCode;
  }

  return 'garbage';
}

function mapLegacyComplaintToDepartmentComplaint(
  complaint: any,
  department: DepartmentCode
): Complaint {
  return {
    id: complaint.id,
    title: complaint.title || '',
    description: complaint.description || '',
    location: complaint.location || '',
    latitude: Number(complaint.latitude || 0),
    longitude: Number(complaint.longitude || 0),
    address: complaint.address || '',
    image_url: complaint.image_url || '',
    audio_url: complaint.audio_url || '',
    status: complaint.status || 'pending',
    priority: complaint.priority || 'medium',
    user_id: complaint.user_id || '',
    contact_email: complaint.contact_email || '',
    contact_phone: complaint.contact_phone || '',
    resolution_proof_url: complaint.resolution_proof_url || '',
    reported_at: complaint.reported_at || complaint.created_at || new Date().toISOString(),
    resolved_at: complaint.resolved_at || null,
    created_at: complaint.created_at || new Date().toISOString(),
    updated_at: complaint.updated_at || new Date().toISOString(),
  };
}

// ============================================================================
// FILE UPLOAD OPERATIONS
// ============================================================================

export const fileDb = {
  // Upload complaint image
  async uploadComplaintImage(
    file: File,
    complaintId: string
  ): Promise<string> {
    const fileName = `${complaintId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabaseServer.storage
      .from('complaint-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error.message);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Generate public URL
    const {
      data: { publicUrl },
    } = supabaseServer.storage.from('complaint-images').getPublicUrl(fileName);

    return publicUrl;
  },

  // Upload complaint audio
  async uploadComplaintAudio(
    file: File,
    complaintId: string
  ): Promise<string> {
    const fileName = `${complaintId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabaseServer.storage
      .from('complaint-audio')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading audio:', error.message);
      throw new Error(`Failed to upload audio: ${error.message}`);
    }

    // Generate public URL
    const {
      data: { publicUrl },
    } = supabaseServer.storage.from('complaint-audio').getPublicUrl(fileName);

    return publicUrl;
  },

  // Upload resolution proof
  async uploadResolutionProof(
    file: File,
    complaintId: string
  ): Promise<string> {
    const fileName = `${complaintId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabaseServer.storage
      .from('resolution-proofs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading proof:', error.message);
      throw new Error(`Failed to upload proof: ${error.message}`);
    }

    // Generate public URL
    const {
      data: { publicUrl },
    } = supabaseServer.storage
      .from('resolution-proofs')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  // Delete file
  async deleteFile(bucket: string, fileName: string): Promise<void> {
    const { error } = await supabaseServer.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error(`Error deleting file from ${bucket}:`, error.message);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },
};

// ============================================================================
// DEPARTMENT DATABASE OPERATIONS
// ============================================================================

export const departmentDb = {
  // Get all departments
  async getAllDepartments() {
    const { data, error } = await supabaseClient.from('departments').select('*');

    if (error) {
      console.error('Error fetching departments:', error.message);
      throw new Error(`Failed to fetch departments: ${error.message}`);
    }

    return data || [];
  },

  // Get department by code
  async getDepartmentByCode(code: string) {
    const { data, error } = await supabaseClient
      .from('departments')
      .select('*')
      .eq('code', code.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching department:', error.message);
      throw new Error(`Failed to fetch department: ${error.message}`);
    }

    return data || null;
  },

  // Get department by ID
  async getDepartmentById(id: string) {
    const { data, error } = await supabaseClient
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching department:', error.message);
      throw new Error(`Failed to fetch department: ${error.message}`);
    }

    return data || null;
  },
};
