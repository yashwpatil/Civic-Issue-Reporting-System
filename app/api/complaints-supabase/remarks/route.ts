import { NextResponse } from 'next/server';
import { remarksDb } from '@/lib/db-supabase-departments';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const queue = await remarksDb.getReviewQueue();

    return NextResponse.json(
      {
        complaints: queue.map((item) => ({
          reviewId: item.reviewId,
          reportId: item.reportId,
          source: item.source,
          ...item.complaint,
          category: item.currentDepartment,
          reviewDepartment: item.reviewDepartment,
          latestRemark: item.latestRemark,
          remarks: item.remarks,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Complaints-Supabase] REMARKS GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load remarks queue' },
      { status: 500 }
    );
  }
}
