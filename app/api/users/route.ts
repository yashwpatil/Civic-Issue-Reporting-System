import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = db.getAllUsers();
    const stats = db.getUserStats();

    return NextResponse.json(
      { users, stats },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Get users error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
