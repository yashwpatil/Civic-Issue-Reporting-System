import { NextRequest, NextResponse } from 'next/server';
import {
  complaintDb,
  VALID_DEPARTMENTS,
  type DepartmentCode,
} from '@/lib/db-supabase-departments';

async function findComplaintById(id: string) {
  for (const department of VALID_DEPARTMENTS) {
    const complaint = await complaintDb.getComplaintByIdAdmin(id, department);
    if (complaint) {
      return { complaint, department, source: 'department' as const };
    }
  }

  const legacyComplaint = await complaintDb.getLegacyComplaintByIdAdmin(id);
  if (legacyComplaint) {
    return {
      complaint: legacyComplaint,
      department:
        (legacyComplaint.assigned_department as DepartmentCode) ||
        ((VALID_DEPARTMENTS.includes(
          legacyComplaint.category as DepartmentCode
        )
          ? legacyComplaint.category
          : 'garbage') as DepartmentCode),
      source: 'legacy' as const,
    };
  }

  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const targetDepartment = body.targetDepartment as DepartmentCode | undefined;
    const remark = body.remark as string | undefined;
    const userId = body.userId as string | undefined;

    if (!targetDepartment || !VALID_DEPARTMENTS.includes(targetDepartment)) {
      return NextResponse.json(
        {
          error: `Invalid target department. Must be one of: ${VALID_DEPARTMENTS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const result = await findComplaintById(id);
    if (!result) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    if (result.source === 'legacy') {
      const migratedComplaint = await complaintDb.createComplaintRecord(
        {
          id: result.complaint.id,
          title: result.complaint.title,
          description: result.complaint.description || '',
          location: result.complaint.location,
          latitude: Number(result.complaint.latitude || 0),
          longitude: Number(result.complaint.longitude || 0),
          address: result.complaint.address || '',
          image_url: result.complaint.image_url || '',
          audio_url: result.complaint.audio_url || '',
          status: result.complaint.status,
          priority: result.complaint.priority || 'medium',
          user_id: result.complaint.user_id || '',
          contact_email: result.complaint.contact_email || '',
          contact_phone: result.complaint.contact_phone || '',
          resolution_proof_url: result.complaint.resolution_proof_url || '',
          reported_at:
            result.complaint.reported_at ||
            result.complaint.created_at ||
            new Date().toISOString(),
          resolved_at: result.complaint.resolved_at || null,
          created_at: result.complaint.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        targetDepartment
      );

      await complaintDb.deleteLegacyComplaintByIdAdmin(id);

      return NextResponse.json(
        {
          ...migratedComplaint,
          category: targetDepartment,
          previousDepartment: result.department,
        },
        { status: 200 }
      );
    }

    const updatedComplaint = await complaintDb.reassignComplaint(
      id,
      result.department,
      targetDepartment,
      remark,
      userId
    );

    return NextResponse.json(
      {
        ...updatedComplaint,
        category: targetDepartment,
        previousDepartment: result.department,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Complaints-Supabase] REASSIGN error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to reassign complaint',
      },
      { status: 500 }
    );
  }
}
