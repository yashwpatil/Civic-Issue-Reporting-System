import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentByCode, getDepartmentStats } from '@/lib/department-data';

export async function GET(request: NextRequest, { params }: { params: { department: string } }) {
  const department = getDepartmentByCode(params.department);
  if (!department) {
    return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  }

  const stats = getDepartmentStats(department.code);
  return NextResponse.json({ department, stats }, { status: 200 });
}
