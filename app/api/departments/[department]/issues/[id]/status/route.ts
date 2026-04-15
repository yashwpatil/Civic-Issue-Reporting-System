import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentByCode } from '@/lib/department-data';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ department: string; id: string }> }) {
  const { department, id } = await params;
  const dept = getDepartmentByCode(department);
  if (!dept) {
    return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const status = body.status as 'pending' | 'in-progress' | 'resolved';

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Update the complaint status in the database
    const updatedComplaint = db.updateComplaintStatus(id, status);
    if (!updatedComplaint) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ issue: updatedComplaint }, { status: 200 });
  } catch (error) {
    console.error('Status update failed:', error);
    return NextResponse.json({ error: 'Unable to update issue' }, { status: 500 });
  }
}