import { userDb } from '@/lib/db-supabase-departments';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, type, adminCode } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return NextResponse.json(
        { error: 'Email and password cannot be empty' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate user credentials
    const user = await userDb.validateUser(trimmedEmail, trimmedPassword);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Type validation
    const validTypes = ['user', 'admin', 'department'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Check if user type matches requested type
    if (type && user.type !== type) {
      return NextResponse.json(
        { error: `User type mismatch. User is ${user.type}` },
        { status: 401 }
      );
    }

    // For admin type, validate admin code if provided
    if (type === 'admin' && adminCode) {
      const validAdminCode = 'admin123';
      if (adminCode !== validAdminCode) {
        return NextResponse.json(
          { error: 'Invalid admin code' },
          { status: 401 }
        );
      }
    }

    // Return user without password and convert snake_case to camelCase
    const { password: _, department_code, ...rest } = user;
    const userResponse = {
      ...rest,
      departmentCode: department_code,
    };

    return NextResponse.json(
      {
        success: true,
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    );
  }
}
