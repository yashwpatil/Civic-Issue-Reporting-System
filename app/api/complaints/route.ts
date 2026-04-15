import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let complaints = db.getAllComplaints();

    if (category && category !== 'all') {
      complaints = complaints.filter((c) => c.category === category);
    }

    if (status && status !== 'all') {
      complaints = complaints.filter((c) => c.status === status);
    }

    return NextResponse.json(complaints, { status: 200 });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.title?.trim() || !body.category || !body.location?.trim() || (!body.description?.trim() && !body.audio)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const complaint = db.createComplaint({
      title: body.title,
      description: body.description || '',
      category: body.category,
      location: body.location,
      image: body.image,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      latitude: body.latitude,
      longitude: body.longitude,
      address: body.address,
      audio: body.audio,
      userId: body.userId,
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { error: 'Failed to create complaint' },
      { status: 500 }
    );
  }
}
