import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';

/**
 * PATCH /api/departments/[department]/issues/[id]/status
 * Update complaint status for a department
 */
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: { department: string; id: string };
  }
) {
  try {
    const { department, id } = params;
    const { status, remark } = await request.json();

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get complaint
    const complaint = await db.complaints.getComplaintById(id);
    if (!complaint) {
      return NextResponse.json(
        { message: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Verify complaint is assigned to this department
    if (complaint.assigned_department !== department) {
      return NextResponse.json(
        { message: 'Complaint not assigned to this department' },
        { status: 403 }
      );
    }

    // Update status
    const updated = await db.complaints.updateComplaintStatus(id, status);

    // Add remark if provided
    if (remark) {
      await db.remarks.addRemark({
        complaint_id: id,
        remark,
      });
    }

    return NextResponse.json(
      {
        message: 'Status updated successfully',
        complaint: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Department] PATCH status error:', error);
    return NextResponse.json(
      { message: 'Failed to update status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/departments/[department]/issues/[id]
 * Get complaint details with remarks
 */
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { department: string; id: string };
  }
) {
  try {
    const { id } = params;

    // Get complaint
    const complaint = await db.complaints.getComplaintById(id);
    if (!complaint) {
      return NextResponse.json(
        { message: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Get remarks
    const remarks = await db.remarks.getRemarksForComplaint(id);

    return NextResponse.json(
      {
        complaint,
        remarks,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Department] GET complaint error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch complaint' },
      { status: 500 }
    );
  }
}
