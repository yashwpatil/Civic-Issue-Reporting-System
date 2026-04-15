import { NextResponse } from 'next/server';
import { complaintDb } from '@/lib/db-supabase-departments';

export async function GET() {
  try {
    const departments = ['water', 'roads', 'electricity', 'garbage'];
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;

    // Fetch stats from all department tables
    for (const dept of departments) {
      try {
        const stats = await complaintDb.getDepartmentStats(dept);
        total += stats.total;
        pending += stats.pending;
        inProgress += stats.in_progress;
        resolved += stats.resolved;
      } catch (error) {
        console.warn(`Error fetching stats for ${dept}:`, error);
      }
    }

    const response = {
      total,
      pending,
      inProgress: inProgress,
      resolved,
      byCategory: {
        water: 0,
        roads: 0,
        electricity: 0,
        garbage: 0,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
