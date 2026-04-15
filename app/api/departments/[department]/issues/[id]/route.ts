import { NextRequest, NextResponse } from 'next/server';
import { updateIssueStatus } from '@/lib/department-data';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ department: string; id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const issue = updateIssueStatus(id, body.status, body.remark);

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(issue, { status: 200 });
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}