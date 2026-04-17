import { NextResponse } from 'next/server';
import { complaintDb } from '@/lib/db-supabase-departments';

const VALID_DEPARTMENTS = ['water', 'roads', 'electricity', 'garbage'] as const;

type DepartmentCode = (typeof VALID_DEPARTMENTS)[number];

export async function GET() {
  try {
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    const byCategory: Record<string, number> = {
      garbage: 0,
      roads: 0,
      water: 0,
      electricity: 0,
      other: 0,
    };

    for (const department of VALID_DEPARTMENTS) {
      const complaints = await complaintDb.getComplaintsByDepartment(department);
      const count = complaints.length;
      total += count;
      pending += complaints.filter((c) => c.status === 'pending').length;
      inProgress += complaints.filter((c) => c.status === 'in-progress').length;
      resolved += complaints.filter((c) => c.status === 'resolved').length;
      byCategory[department] = count;
    }

    return NextResponse.json(
      { total, pending, inProgress, resolved, byCategory },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
