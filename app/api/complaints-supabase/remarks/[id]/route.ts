import { NextRequest, NextResponse } from 'next/server';
import {
  complaintDb,
  remarksDb,
  type DepartmentCode,
  VALID_DEPARTMENTS,
} from '@/lib/db-supabase-departments';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const targetDepartment = body.targetDepartment as DepartmentCode | undefined;

    if (!targetDepartment || !VALID_DEPARTMENTS.includes(targetDepartment)) {
      return NextResponse.json(
        { error: 'Invalid target department' },
        { status: 400 }
      );
    }

    const queue = await remarksDb.getReviewQueue();
    const item = queue.find((entry) => entry.reviewId === id);

    if (!item) {
      return NextResponse.json(
        { error: 'Review item not found' },
        { status: 404 }
      );
    }

    if (item.source === 'remark-only') {
      const createdComplaint = await complaintDb.createComplaintRecord(
        {
          title: item.complaint.title,
          description: item.complaint.description,
          location: item.complaint.location,
          latitude: item.complaint.latitude,
          longitude: item.complaint.longitude,
          address: item.complaint.address,
          image_url: item.complaint.image_url,
          audio_url: item.complaint.audio_url,
          status: 'pending',
          priority: item.complaint.priority,
          user_id: '',
          contact_email: '',
          contact_phone: item.complaint.contact_phone,
          resolution_proof_url: '',
          reported_at: item.complaint.reported_at,
          created_at: item.complaint.created_at,
          updated_at: new Date().toISOString(),
        },
        targetDepartment
      );

      await remarksDb.resolveReviewItem(id, {
        status: 'allocated',
        department: targetDepartment,
      });

      return NextResponse.json(
        { success: true, complaint: createdComplaint, source: item.source },
        { status: 200 }
      );
    }

    if (!item.complaint.id) {
      return NextResponse.json(
        { error: 'Complaint not found for review item' },
        { status: 404 }
      );
    }

    if (item.source === 'legacy') {
      const createdComplaint = await complaintDb.createComplaintRecord(
        {
          title: item.complaint.title,
          description: item.complaint.description,
          location: item.complaint.location,
          latitude: item.complaint.latitude,
          longitude: item.complaint.longitude,
          address: item.complaint.address,
          image_url: item.complaint.image_url,
          audio_url: item.complaint.audio_url,
          status: item.complaint.status,
          priority: item.complaint.priority,
          user_id: item.complaint.user_id || '',
          contact_email: item.complaint.contact_email || '',
          contact_phone: item.complaint.contact_phone || '',
          resolution_proof_url: item.complaint.resolution_proof_url || '',
          reported_at: item.complaint.reported_at,
          resolved_at: item.complaint.resolved_at,
          created_at: item.complaint.created_at,
          updated_at: new Date().toISOString(),
        },
        targetDepartment
      );

      await complaintDb.deleteLegacyComplaintByIdAdmin(item.complaint.id);
      await remarksDb.resolveReviewItem(id, {
        status: 'allocated',
        department: targetDepartment,
      });

      return NextResponse.json(
        { success: true, complaint: createdComplaint, source: item.source },
        { status: 200 }
      );
    }

    const updatedComplaint = await complaintDb.reassignComplaint(
      item.complaint.id,
      item.currentDepartment,
      targetDepartment,
      body.remark,
      body.userId
    );

    await remarksDb.resolveReviewItem(id, {
      status: 'allocated',
      department: targetDepartment,
    });

    return NextResponse.json(
      { success: true, complaint: updatedComplaint, source: item.source },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Remarks] PATCH error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to submit review item',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const queue = await remarksDb.getReviewQueue();
    const item = queue.find((entry) => entry.reviewId === id);

    if (!item) {
      return NextResponse.json(
        { error: 'Review item not found' },
        { status: 404 }
      );
    }

    if (item.source === 'legacy') {
      await complaintDb.deleteLegacyComplaintByIdAdmin(item.complaint.id);
    } else if (item.source === 'department') {
      await complaintDb.deleteComplaint(item.complaint.id, item.currentDepartment);
    }

    await remarksDb.resolveReviewItem(id, {
      status: 'rejected',
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Remarks] DELETE error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to reject review item',
      },
      { status: 500 }
    );
  }
}
