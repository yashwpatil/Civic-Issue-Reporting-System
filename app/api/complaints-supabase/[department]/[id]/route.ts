import { complaintDb, remarksDb, fileDb } from '@/lib/db-supabase-departments';
import { NextRequest, NextResponse } from 'next/server';

const VALID_DEPARTMENTS = ['water', 'roads', 'electricity', 'garbage'];

function validateDepartment(dept: string): boolean {
  return VALID_DEPARTMENTS.includes(dept.toLowerCase());
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ department: string; id: string }> }
) {
  try {
    const { department, id } = await params;

    if (!validateDepartment(department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be: ${VALID_DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Complaint ID is required' },
        { status: 400 }
      );
    }

    const complaint = await complaintDb.getComplaintById(
      id,
      department.toLowerCase()
    );

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    const remarks = await remarksDb.getRemarksForComplaint(
      id,
      department.toLowerCase()
    );

    return NextResponse.json(
      { complaint, remarks },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching complaint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch complaint' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ department: string; id: string }> }
) {
  try {
    const { department, id } = await params;

    if (!validateDepartment(department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be: ${VALID_DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Complaint ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, remark, userId, resolutionProofUrl } = body;

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Update complaint status
    const updated = await complaintDb.updateComplaintStatus(
      id,
      department.toLowerCase(),
      status as 'pending' | 'in-progress' | 'resolved',
      resolutionProofUrl
    );

    // Add remark if provided
    if (remark && userId) {
      await remarksDb.addRemark(
        id,
        department.toLowerCase(),
        remark,
        userId
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update complaint' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ department: string; id: string }> }
) {
  try {
    const { department, id } = await params;

    if (!validateDepartment(department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be: ${VALID_DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Complaint ID is required' },
        { status: 400 }
      );
    }

    await complaintDb.deleteComplaint(id, department.toLowerCase());

    return NextResponse.json(
      { message: 'Complaint deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete complaint' },
      { status: 500 }
    );
  }
}
