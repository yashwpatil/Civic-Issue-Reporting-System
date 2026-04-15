import { complaintDb } from '@/lib/db-supabase-departments';
import { NextRequest, NextResponse } from 'next/server';

const VALID_DEPARTMENTS = ['water', 'roads', 'electricity', 'garbage'];

function validateDepartment(dept: string): boolean {
  return VALID_DEPARTMENTS.includes(dept.toLowerCase());
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ department: string }> }
) {
  try {
    const { department } = await params;

    if (!validateDepartment(department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be: ${VALID_DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch all issues
    const issues = await complaintDb.getComplaintsByDepartment(
      department.toLowerCase()
    );

    // Get comprehensive statistics
    const stats = await complaintDb.getDepartmentStats(
      department.toLowerCase()
    );

    const closureRate = await complaintDb.getClosureRate(
      department.toLowerCase()
    );

    // Get latest issues (first 5)
    const latestIssues = issues.slice(0, 5);

    // Get issues by priority
    const highPriority = issues.filter((i) => i.priority === 'high');
    const mediumPriority = issues.filter((i) => i.priority === 'medium');
    const lowPriority = issues.filter((i) => i.priority === 'low');

    return NextResponse.json(
      {
        department: department.toLowerCase(),
        summary: {
          total: stats.total,
          pending: stats.pending,
          in_progress: stats.in_progress,
          resolved: stats.resolved,
          avg_resolution_days: stats.avg_resolution_days,
          closure_rate: `${closureRate.percentage}%`,
          closure_resolved: closureRate.resolved,
        },
        priorityBreakdown: {
          high: highPriority.length,
          medium: mediumPriority.length,
          low: lowPriority.length,
        },
        latestIssues,
        allIssues: issues,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
