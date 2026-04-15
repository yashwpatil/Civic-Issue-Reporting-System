import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';

/**
 * GET /api/departments/[department]/live-issues
 * Get live issues for a department with statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { department: string } }
) {
  try {
    const departmentCode = params.department;

    // Validate department code
    const validCodes = ['water', 'roads', 'electricity', 'garbage'];
    if (!validCodes.includes(departmentCode)) {
      return NextResponse.json(
        { message: 'Invalid department code' },
        { status: 400 }
      );
    }

    // Get department info
    const department = await db.departments.getDepartmentByCode(departmentCode);
    if (!department) {
      return NextResponse.json(
        { message: 'Department not found' },
        { status: 404 }
      );
    }

    // Get all issues for department
    const issues = await db.complaints.getComplaintsByDepartment(departmentCode);

    // Calculate statistics
    const total = issues.length;
    const pending = issues.filter((i: any) => i.status === 'pending').length;
    const inProgress = issues.filter((i: any) => i.status === 'in-progress').length;
    const resolved = issues.filter((i: any) => i.status === 'resolved').length;

    const priority = {
      high: issues.filter((i: any) => i.priority === 'high').length,
      medium: issues.filter((i: any) => i.priority === 'medium').length,
      low: issues.filter((i: any) => i.priority === 'low').length,
    };

    const latest = issues.slice(0, 3);

    return NextResponse.json(
      {
        department,
        issues,
        stats: {
          total,
          pending,
          inProgress,
          resolved,
          priority,
          latest,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Department] GET issues error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch department issues' },
      { status: 500 }
    );
  }
}
