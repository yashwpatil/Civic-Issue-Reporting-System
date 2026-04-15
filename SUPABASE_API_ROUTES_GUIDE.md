# Department-Specific API Routes Structure

This guide shows the recommended folder structure and implementation for the new department-specific API routes.

## Folder Structure

```
app/api/
├── auth-supabase/
│   ├── login/
│   │   └── route.ts          (unchanged)
│   └── register/
│       └── route.ts          (unchanged)
│
├── complaints-supabase/
│   ├── [department]/
│   │   ├── route.ts          (NEW - Create/Get complaints for department)
│   │   ├── [id]/
│   │   │   └── route.ts      (NEW - Get/Update/Delete specific complaint)
│   │   ├── stats/
│   │   │   └── route.ts      (OPTIONAL - Get department stats)
│   │   └── live-issues/
│   │       └── route.ts      (MOVED HERE - Department dashboard data)
│   │
│   └── user/
│       └── route.ts          (OPTIONAL - Get user's complaints from all departments)
│
└── departments-supabase/
    ├── route.ts              (OPTIONAL - Get all departments)
    └── [code]/
        └── route.ts          (OPTIONAL - Get department by code)
```

## File 1: Create/Get Department Complaints

**File:** `app/api/complaints-supabase/[department]/route.ts`

```typescript
import { complaintDb, fileDb } from '@/lib/db-supabase-departments';
import { NextRequest, NextResponse } from 'next/server';

const VALID_DEPARTMENTS = ['water', 'roads', 'electricity', 'garbage'];

function validateDepartment(dept: string): boolean {
  return VALID_DEPARTMENTS.includes(dept.toLowerCase());
}

export async function GET(
  request: NextRequest,
  { params }: { params: { department: string } }
) {
  try {
    const { department } = params;

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
  { params }: { params: { department: string } }
) {
  try {
    const { department } = params;

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

    // Extract files
    const imageFile = formData.get('image') as File | null;
    const audioFile = formData.get('audio') as File | null;

    // Validate required fields
    if (!title || !location || !userId || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        {
          error: 'Missing or invalid required fields',
          required: ['title', 'location', 'userId', 'latitude', 'longitude'],
        },
        { status: 400 }
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
        complaint.image_url = imageUrl;
      } catch (uploadError) {
        console.warn('Failed to upload image:', uploadError);
        // Don't fail the request if image upload fails
      }
    }

    // Upload audio if provided
    if (audioFile && audioFile.size > 0) {
      try {
        const audioUrl = await fileDb.uploadComplaintAudio(audioFile, complaint.id);
        complaint.audio_url = audioUrl;
      } catch (uploadError) {
        console.warn('Failed to upload audio:', uploadError);
        // Don't fail the request if audio upload fails
      }
    }

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create complaint' },
      { status: 500 }
    );
  }
}
```

## File 2: Get/Update Specific Complaint

**File:** `app/api/complaints-supabase/[department]/[id]/route.ts`

```typescript
import { complaintDb, remarksDb, fileDb } from '@/lib/db-supabase-departments';
import { NextRequest, NextResponse } from 'next/server';

const VALID_DEPARTMENTS = ['water', 'roads', 'electricity', 'garbage'];

function validateDepartment(dept: string): boolean {
  return VALID_DEPARTMENTS.includes(dept.toLowerCase());
}

export async function GET(
  request: NextRequest,
  { params }: { params: { department: string; id: string } }
) {
  try {
    const { department, id } = params;

    if (!validateDepartment(department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be: ${VALID_DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Complaint ID is required' },
        { status: 400 }
      );
    }

    const complaint = await complaintDb.getComplaintById(
      id,
      department.toLowerCase()
    );

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    const remarks = await remarksDb.getRemarksForComplaint(
      id,
      department.toLowerCase()
    );

    return NextResponse.json(
      { complaint, remarks },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching complaint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch complaint' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { department: string; id: string } }
) {
  try {
    const { department, id } = params;

    if (!validateDepartment(department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be: ${VALID_DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Complaint ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, remark, userId, resolutionProofUrl } = body;

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Update complaint status
    const updated = await complaintDb.updateComplaintStatus(
      id,
      department.toLowerCase(),
      status as 'pending' | 'in-progress' | 'resolved',
      resolutionProofUrl
    );

    // Add remark if provided
    if (remark && userId) {
      await remarksDb.addRemark(
        id,
        department.toLowerCase(),
        remark,
        userId
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update complaint' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { department: string; id: string } }
) {
  try {
    const { department, id } = params;

    if (!validateDepartment(department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be: ${VALID_DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Complaint ID is required' },
        { status: 400 }
      );
    }

    await complaintDb.deleteComplaint(id, department.toLowerCase());

    return NextResponse.json(
      { message: 'Complaint deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete complaint' },
      { status: 500 }
    );
  }
}
```

## File 3: Department Dashboard (Live Issues)

**File:** `app/api/complaints-supabase/[department]/live-issues/route.ts`

```typescript
import { complaintDb } from '@/lib/db-supabase-departments';
import { NextRequest, NextResponse } from 'next/server';

const VALID_DEPARTMENTS = ['water', 'roads', 'electricity', 'garbage'];

function validateDepartment(dept: string): boolean {
  return VALID_DEPARTMENTS.includes(dept.toLowerCase());
}

export async function GET(
  request: NextRequest,
  { params }: { params: { department: string } }
) {
  try {
    const { department } = params;

    if (!validateDepartment(department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be: ${VALID_DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch all issues
    const issues = await complaintDb.getComplaintsByDepartment(
      department.toLowerCase()
    );

    // Get comprehensive statistics
    const stats = await complaintDb.getDepartmentStats(
      department.toLowerCase()
    );

    const closureRate = await complaintDb.getClosureRate(
      department.toLowerCase()
    );

    // Get latest issues (first 5)
    const latestIssues = issues.slice(0, 5);

    // Get issues by priority
    const highPriority = issues.filter((i) => i.priority === 'high');
    const mediumPriority = issues.filter((i) => i.priority === 'medium');
    const lowPriority = issues.filter((i) => i.priority === 'low');

    return NextResponse.json(
      {
        department: department.toLowerCase(),
        summary: {
          total: stats.total,
          pending: stats.pending,
          in_progress: stats.in_progress,
          resolved: stats.resolved,
          avg_resolution_days: stats.avg_resolution_days,
          closure_rate: `${closureRate.percentage}%`,
          closure_resolved: closureRate.resolved,
        },
        priorityBreakdown: {
          high: highPriority.length,
          medium: mediumPriority.length,
          low: lowPriority.length,
        },
        latestIssues,
        allIssues: issues,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
```

## File 4: Department Stats (Optional)

**File:** `app/api/complaints-supabase/[department]/stats/route.ts`

```typescript
import { complaintDb } from '@/lib/db-supabase-departments';
import { NextRequest, NextResponse } from 'next/server';

const VALID_DEPARTMENTS = ['water', 'roads', 'electricity', 'garbage'];

export async function GET(
  request: NextRequest,
  { params }: { params: { department: string } }
) {
  try {
    const { department } = params;

    if (!VALID_DEPARTMENTS.includes(department.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid department' },
        { status: 400 }
      );
    }

    const stats = await complaintDb.getDepartmentStats(
      department.toLowerCase()
    );

    const closureRate = await complaintDb.getClosureRate(
      department.toLowerCase()
    );

    return NextResponse.json(
      {
        department: department.toLowerCase(),
        stats: {
          ...stats,
          closure_rate_percent: closureRate.percentage,
          closure_resolved: closureRate.resolved,
          closure_total: closureRate.total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
```

## File 5: User Complaints (All Departments)

**File:** `app/api/complaints-supabase/user/route.ts`

```typescript
import { complaintDb } from '@/lib/db-supabase-departments';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Get complaints from all departments for this user
    const complaints = await complaintDb.getComplaintsByUser(userId);

    return NextResponse.json(
      {
        userId,
        count: complaints.length,
        complaints,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}
```

## Usage Examples

### Create Complaint for Water Department

```bash
curl -X POST http://localhost:3000/api/complaints-supabase/water \
  -F "title=Water leak at Main St" \
  -F "description=Broken pipe leaking water" \
  -F "location=Main Street" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "address=123 Main St, City" \
  -F "userId=user-id-here" \
  -F "contactEmail=user@email.com" \
  -F "contactPhone=555-1234" \
  -F "priority=high" \
  -F "image=@path/to/image.jpg" \
  -F "audio=@path/to/audio.wav"
```

### Get All Water Complaints

```bash
curl http://localhost:3000/api/complaints-supabase/water
```

### Get Specific Complaint

```bash
curl http://localhost:3000/api/complaints-supabase/water/complaint-id-here
```

### Update Complaint Status

```bash
curl -X PATCH http://localhost:3000/api/complaints-supabase/water/complaint-id-here \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-progress",
    "remark": "Team dispatched for inspection",
    "userId": "department-user-id"
  }'
```

### Mark as Resolved

```bash
curl -X PATCH http://localhost:3000/api/complaints-supabase/water/complaint-id-here \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "remark": "Pipe replaced successfully",
    "userId": "department-user-id",
    "resolutionProofUrl": "https://..."
  }'
```

### Get Department Dashboard

```bash
curl http://localhost:3000/api/complaints-supabase/water/live-issues
```

### Get User's All Complaints

```bash
curl "http://localhost:3000/api/complaints-supabase/user?userId=user-id-here"
```

## Testing Checklist

- [ ] Create complaints for each department
- [ ] Get all complaints for each department
- [ ] Get specific complaint details
- [ ] Update complaint status (pending → in-progress → resolved)
- [ ] Add remarks to complaints
- [ ] Upload images and audio files
- [ ] Check department dashboard data
- [ ] Verify statistics calculations
- [ ] Test user's all complaints endpoint
- [ ] Verify department isolation (complaints only in correct table)
