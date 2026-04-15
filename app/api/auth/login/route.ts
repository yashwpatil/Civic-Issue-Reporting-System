import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password, type, adminCode } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { message: 'Invalid input format' },
        { status: 400 }
      );
    }

    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return NextResponse.json(
        { message: 'Email and password cannot be empty' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate user credentials
    const user = db.validateUser(trimmedEmail, trimmedPassword);

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if requesting admin login
    if (type === 'admin') {
      if (!adminCode) {
        return NextResponse.json(
          { message: 'Admin code is required' },
          { status: 400 }
        );
      }

      if (adminCode !== 'ADMIN2024') {
        return NextResponse.json(
          { message: 'Invalid admin code' },
          { status: 401 }
        );
      }

      if (user.type !== 'admin') {
        return NextResponse.json(
          { message: 'This user is not an admin' },
          { status: 403 }
        );
      }
    }

    // Check if login type matches user type
    if (type === 'user' && user.type !== 'user') {
      return NextResponse.json(
        { message: user.type === 'admin' ? 'Please log in as admin' : 'Please log in as department' },
        { status: 403 }
      );
    }

    if (type === 'admin' && user.type !== 'admin') {
      return NextResponse.json(
        { message: 'This account is not an admin account' },
        { status: 403 }
      );
    }

    if (type === 'department' && user.type !== 'department') {
      return NextResponse.json(
        { message: user.type === 'admin' ? 'Please log in as admin' : 'Please log in as a citizen' },
        { status: 403 }
      );
    }

    // Return user without password
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      type: user.type,
      departmentCode: user.departmentCode,
    };

    return NextResponse.json(
      { message: 'Login successful', user: userResponse },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
