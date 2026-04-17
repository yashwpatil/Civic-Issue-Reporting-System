import { NextRequest, NextResponse } from 'next/server';
import { complaintDb } from '@/lib/db-supabase-departments';

const VALID_DEPARTMENTS = ['water', 'roads', 'electricity', 'garbage'] as const;

type DepartmentCode = (typeof VALID_DEPARTMENTS)[number];

async function findComplaintById(id: string) {
  for (const department of VALID_DEPARTMENTS) {
    const complaint = await complaintDb.getComplaintByIdAdmin(id, department);
    if (complaint) {
      return {
        complaint: { ...complaint, category: department },
        department,
        source: 'department' as const,
      };
    }
  }

  const legacyComplaint = await complaintDb.getLegacyComplaintByIdAdmin(id);
  if (legacyComplaint) {
    const legacyDepartment =
      (VALID_DEPARTMENTS.includes(
        legacyComplaint.assigned_department as DepartmentCode
      )
        ? legacyComplaint.assigned_department
        : VALID_DEPARTMENTS.includes(legacyComplaint.category as DepartmentCode)
          ? legacyComplaint.category
          : 'garbage') as DepartmentCode;

    return {
      complaint: { ...legacyComplaint, category: legacyDepartment },
      department: legacyDepartment,
      source: 'legacy' as const,
    };
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await findComplaintById(id);

    if (!result) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json(result.complaint, { status: 200 });
  } catch (error) {
    console.error('[Complaints-Supabase] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['pending', 'in-progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await findComplaintById(id);
    if (!result) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const updatedComplaint =
      result.source === 'legacy'
        ? await complaintDb.updateLegacyComplaintStatusAdmin(
            id,
            status as 'pending' | 'in-progress' | 'resolved'
          )
        : await complaintDb.updateComplaintStatus(
            id,
            result.department,
            status as 'pending' | 'in-progress' | 'resolved'
          );

    return NextResponse.json(
      { ...updatedComplaint, category: result.department },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Complaints-Supabase] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update complaint status' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await findComplaintById(id);
    if (!result) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    if (result.source === 'legacy') {
      await complaintDb.deleteLegacyComplaintByIdAdmin(id);
    } else {
      await complaintDb.deleteComplaint(id, result.department);
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Complaints-Supabase] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
  }
}
