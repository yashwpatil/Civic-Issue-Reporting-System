import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDepartmentByCode } from '@/lib/department-data';

// Map complaint categories to departments
const categoryToDepartment: Record<string, string> = {
  water: 'water',
  roads: 'roads',
  electricity: 'electricity',
  garbage: 'garbage',
  other: 'water', // Default to water for uncategorized
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ department: string }> }
) {
  try {
    const { department } = await params;
    const dept = getDepartmentByCode(department);

    if (!dept) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Get all complaints and filter by department's category
    const allComplaints = db.getAllComplaints();
    const departmentIssues = allComplaints.filter(
      (complaint) => categoryToDepartment[complaint.category] === dept.code
    );

    // Transform complaints to issue format with stats
    const issues = departmentIssues.map((complaint) => ({
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: calculatePriority(complaint),
      status: complaint.status,
      location: complaint.location,
      reportedAt: complaint.createdAt,
      assignedDepartment: dept.code,
      image: complaint.image,
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      address: complaint.address,
      audio: complaint.audio,
      contactEmail: complaint.contactEmail,
      contactPhone: complaint.contactPhone,
    }));

    // Calculate stats
    const total = issues.length;
    const pending = issues.filter((i) => i.status === 'pending').length;
    const inProgress = issues.filter((i) => i.status === 'in-progress').length;
    const resolved = issues.filter((i) => i.status === 'resolved').length;

    const stats = {
      total,
      pending,
      inProgress,
      resolved,
      priority: {
        high: issues.filter((i) => i.priority === 'high').length,
        medium: issues.filter((i) => i.priority === 'medium').length,
        low: issues.filter((i) => i.priority === 'low').length,
      },
      latest: issues
        .sort(
          (a, b) =>
            new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
        )
        .slice(0, 3),
    };

    return NextResponse.json({ issues, stats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching live issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live issues' },
      { status: 500 }
    );
  }
}

function calculatePriority(
  complaint: any
): 'high' | 'medium' | 'low' {
  // Determine priority based on category and time
  const ageHours =
    (Date.now() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60);

  if (ageHours > 48) return 'high'; // Old complaints become urgent
  if (
    complaint.category === 'water' ||
    complaint.category === 'electricity'
  ) {
    return 'high'; // Water and electricity are critical
  }
  if (complaint.category === 'roads' || complaint.category === 'garbage') {
    return 'medium';
  }
  return 'low';
}
