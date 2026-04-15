import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';

/**
 * GET /api/complaints
 * Fetch all complaints or filter by user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const department = searchParams.get('department');

    let complaints;

    if (userId) {
      complaints = await db.complaints.getComplaintsByUser(userId);
    } else if (department) {
      complaints = await db.complaints.getComplaintsByDepartment(department);
    } else {
      complaints = await db.complaints.getAllComplaints();
    }

    return NextResponse.json({ complaints }, { status: 200 });
  } catch (error) {
    console.error('[Complaints] GET error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/complaints
 * Create a new complaint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      location,
      latitude,
      longitude,
      address,
      contactEmail,
      contactPhone,
      image,
      audio,
      userId,
    } = body;

    // Validate required fields
    if (!title || !category || !location) {
      return NextResponse.json(
        { message: 'Title, category, and location are required' },
        { status: 400 }
      );
    }

    if (title.length < 5) {
      return NextResponse.json(
        { message: 'Title must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (!description && !audio) {
      return NextResponse.json(
        { message: 'Description or audio is required' },
        { status: 400 }
      );
    }

    try {
      // Handle image upload if provided
      let imageUrl: string | undefined;
      if (image) {
        // Convert base64 to blob
        const response = await fetch(image);
        const blob = await response.blob();
        const file = new File([blob], 'complaint-image.jpg', { type: 'image/jpeg' });
        imageUrl = await db.files.uploadComplaintImage(file, 'new-complaint');
      }

      // Handle audio upload if provided
      let audioUrl: string | undefined;
      if (audio) {
        const response = await fetch(audio);
        const blob = await response.blob();
        audioUrl = await db.files.uploadComplaintAudio(blob, 'new-complaint');
      }

      // Create complaint
      const complaint = await db.complaints.createComplaint({
        title,
        description: description || '',
        category,
        location,
        latitude,
        longitude,
        address,
        image_url: imageUrl,
        audio_url: audioUrl,
        status: 'pending',
        contact_email: contactEmail,
        contact_phone: contactPhone,
        user_id: userId,
        assigned_department: category,
        reported_at: new Date().toISOString(),
      });

      return NextResponse.json({ id: complaint.id, ...complaint }, { status: 201 });
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      return NextResponse.json(
        { message: 'Failed to upload files' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Complaints] POST error:', error);
    return NextResponse.json(
      { message: 'Failed to create complaint' },
      { status: 500 }
    );
  }
}
