import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentByCode, getIssuesForDepartment } from '@/lib/department-data';

export async function GET(request: NextRequest, { params }: { params: { department: string } }) {
  const department = getDepartmentByCode(params.department);
  if (!department) {
    return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  }

  const issues = getIssuesForDepartment(department.code);
  return NextResponse.json({ issues }, { status: 200 });
}
