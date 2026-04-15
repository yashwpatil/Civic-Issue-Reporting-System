import { complaintDb, fileDb, userDb } from '@/lib/db-supabase-departments';
import { NextRequest, NextResponse } from 'next/server';

const VALID_DEPARTMENTS = ['water', 'roads', 'electricity', 'garbage'];

function validateDepartment(dept: string): boolean {
  return VALID_DEPARTMENTS.includes(dept.toLowerCase());
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ department: string }> }
) {
  try {
    const { department } = await params;

    if (!validateDepartment(department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be: ${VALID_DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    // Get all complaints for this department
    const complaints = await complaintDb.getComplaintsByDepartment(
      department.toLowerCase()
    );

    return NextResponse.json(
      {
        department: department.toLowerCase(),
        count: complaints.length,
        complaints,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ department: string }> }
) {
  try {
    const { department } = await params;

    if (!validateDepartment(department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be: ${VALID_DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    // Extract form fields
    const title = (formData.get('title') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    const location = (formData.get('location') as string)?.trim();
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const address = (formData.get('address') as string)?.trim();
    const userId = (formData.get('userId') as string)?.trim();
    const contactEmail = (formData.get('contactEmail') as string)?.trim();
    const contactPhone = (formData.get('contactPhone') as string)?.trim();
    const priority = ((formData.get('priority') as string) || 'medium') as
      | 'high'
      | 'medium'
      | 'low';

    console.log('=== COMPLAINT SUBMISSION DEBUG ===');
    console.log('Department:', department);
    console.log('Received FormData:', {
      title: title?.substring(0, 50),
      description: description?.substring(0, 50),
      location: location?.substring(0, 50),
      latitude,
      longitude,
      userId: userId?.substring(0, 20),
      contactEmail: contactEmail?.substring(0, 30),
      contactPhone: contactPhone?.substring(0, 15),
      priority,
    });

    // Extract files
    const imageFile = formData.get('image') as File | null;
    const audioFile = formData.get('audio') as File | null;

    // Validate required fields
    if (!title || !location || !userId || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        {
          error: 'Missing or invalid required fields',
          required: ['title', 'location', 'userId', 'latitude', 'longitude'],
          received: {
            title: title ? 'present' : 'missing',
            location: location ? 'present' : 'missing',
            userId: userId ? 'present' : 'missing',
            latitude: isNaN(latitude) ? 'invalid' : 'valid',
            longitude: isNaN(longitude) ? 'invalid' : 'valid',
          },
        },
        { status: 400 }
      );
    }

    // Validate user exists in database
    const userExists = await userDb.userExists(userId);
    if (!userExists) {
      return NextResponse.json(
        {
          error: `User with ID ${userId} not found. Please ensure you are logged in.`,
        },
        { status: 404 }
      );
    }

    // Create complaint in department table
    let complaint = await complaintDb.createComplaint(
      {
        title,
        description: description || '',
        location,
        latitude,
        longitude,
        address: address || '',
        image_url: '',
        audio_url: '',
        status: 'pending',
        priority,
        user_id: userId,
        contact_email: contactEmail || '',
        contact_phone: contactPhone || '',
        resolution_proof_url: '',
      },
      department.toLowerCase()
    );

    // Upload image if provided
    if (imageFile && imageFile.size > 0) {
      try {
        const imageUrl = await fileDb.uploadComplaintImage(
          imageFile,
          complaint.id
        );
        // Update the complaint with the image URL
        complaint = await complaintDb.updateComplaint(
          complaint.id,
          department.toLowerCase(),
          { image_url: imageUrl }
        );
      } catch (uploadError) {
        console.warn('Failed to upload image:', uploadError);
      }
    }

    // Upload audio if provided
    if (audioFile && audioFile.size > 0) {
      try {
        const audioUrl = await fileDb.uploadComplaintAudio(audioFile, complaint.id);
        // Update the complaint with the audio URL
        complaint = await complaintDb.updateComplaint(
          complaint.id,
          department.toLowerCase(),
          { audio_url: audioUrl }
        );
      } catch (uploadError) {
        console.warn('Failed to upload audio:', uploadError);
      }
    }

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Full error in POST /api/complaints-supabase/[department]:', {
      message: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return error as JSON
    return NextResponse.json(
      { error: errorMessage || 'Failed to create complaint' },
      { status: 500 }
    );
  }
}
