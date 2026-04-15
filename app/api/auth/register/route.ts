import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { message: 'Invalid input format' },
        { status: 400 }
      );
    }

    // Trim inputs
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      return NextResponse.json(
        { message: 'Name, email, and password cannot be empty' },
        { status: 400 }
      );
    }

    // Validate name length
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { message: 'Name must be at least 2 characters' },
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

    // Validate password strength
    if (trimmedPassword.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = db.getUserByEmail(trimmedEmail);
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = db.createUser({
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword, // In production, use bcrypt
      type: 'user',
    });

    // Return user without password
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      type: newUser.type,
    };

    return NextResponse.json(
      { message: 'Registration successful', user: userResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred during registration. Please try again.';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
