import { NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';

export async function GET() {
  try {
    const users = await db.users.getAllUsers();
    const stats = await db.users.getUserStats();

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
