# CivicHub - Civic Issue Reporting Platform

A modern, full-stack civic issue reporting web application built with Next.js, React, and Tailwind CSS. CivicHub enables citizens to easily report infrastructure problems and track their resolution status.

## Features

### Homepage
- Clean, modern hero section with call-to-action buttons
- Real-time city statistics (total complaints, pending, in-progress, resolved)
- Category showcase (Garbage, Roads, Water, Electricity)
- "How It Works" section explaining the reporting process
- Responsive design for all devices

### Report Issue Page
- Comprehensive form with validation
- Category selection (Garbage, Roads, Water, Electricity, Other)
- Image upload capability with preview
- Location input
- Contact information fields (email, phone)
- Loading states and error handling
- Form validation with helpful error messages

### User Dashboard
- View all submitted complaints
- Filter by category and status
- Search and sort functionality
- Real-time status updates
- Delete option for complaints
- Responsive card layout

### Admin Panel
- View all complaints in the system
- Change complaint status (Pending → In Progress → Resolved)
- Filter by category and status
- Statistics overview (total, pending, in-progress, resolved)
- Category breakdown
- Manage all complaints

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Node.js API routes
- **Database**: In-memory storage (easily replaceable with MongoDB, PostgreSQL, etc.)
- **UI Components**: shadcn/ui with Radix UI
- **Form Handling**: React Hook Form
- **Styling**: Tailwind CSS with custom color theme

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

1. **Clone or Download the Project**
   ```bash
   # If using GitHub
   git clone <repository-url>
   cd civichub
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Run Development Server**
   ```bash
   pnpm dev
   ```

4. **Open in Browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
civichub/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── report/
│   │   └── page.tsx               # Report issue page
│   ├── dashboard/
│   │   └── page.tsx               # User dashboard
│   ├── admin/
│   │   └── page.tsx               # Admin panel
│   ├── api/
│   │   ├── complaints/
│   │   │   ├── route.ts           # GET/POST complaints
│   │   │   └── [id]/
│   │   │       └── route.ts       # GET/PATCH/DELETE individual complaint
│   │   └── stats/
│   │       └── route.ts           # GET statistics
│   ├── layout.tsx                 # Root layout
│   ├── globals.css                # Global styles with theme
│   └── not-found.tsx              # 404 page
├── components/
│   ├── header.tsx                 # Navigation header
│   ├── stats-display.tsx          # Statistics display
│   ├── categories-grid.tsx        # Category showcase
│   ├── report-form.tsx            # Report submission form
│   ├── complaint-card.tsx         # Complaint display card
│   ├── dashboard-view.tsx         # Dashboard view
│   ├── admin-view.tsx             # Admin panel view
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── db.ts                      # Database layer with CRUD operations
│   ├── utils-civic.ts             # Utility functions and constants
│   └── utils.ts                   # General utilities
├── hooks/
│   └── use-toast.ts               # Toast notification hook
└── public/                        # Static assets
```

## API Routes

### Complaints
- **GET /api/complaints** - Fetch all complaints (with optional filters)
  - Query params: `category`, `status`
  - Returns: Array of complaints

- **POST /api/complaints** - Create a new complaint
  - Body: { title, description, category, location, image?, contactEmail?, contactPhone? }
  - Returns: Created complaint object

- **GET /api/complaints/[id]** - Fetch a specific complaint
  - Returns: Complaint object

- **PATCH /api/complaints/[id]** - Update complaint status
  - Body: { status: 'pending' | 'in-progress' | 'resolved' }
  - Returns: Updated complaint object

- **DELETE /api/complaints/[id]** - Delete a complaint
  - Returns: { success: true }

### Statistics
- **GET /api/stats** - Get system statistics
  - Returns: { total, pending, inProgress, resolved, byCategory }

## Database Layer

The application uses an in-memory database layer in `lib/db.ts` that can be easily swapped for a real database:

```typescript
// Current implementation uses dummy data for demonstration
const dummyComplaints: Complaint[] = [...]

// API: db.getAllComplaints()
// API: db.getComplaintById(id)
// API: db.createComplaint(data)
// API: db.updateComplaintStatus(id, status)
// API: db.deleteComplaint(id)
// API: db.getStats()
```

### To Integrate a Real Database:

1. **MongoDB Example**:
   ```typescript
   import { MongoClient } from 'mongodb';
   const client = new MongoClient(process.env.MONGODB_URI);
   ```

2. **PostgreSQL Example**:
   ```typescript
   import { Pool } from 'pg';
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   ```

3. **Supabase Example**:
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
   ```

## Customization

### Theme Colors
Edit `app/globals.css` to change the color scheme:
```css
:root {
  --primary: oklch(0.55 0.25 240);    /* Blue */
  --secondary: oklch(0.65 0.18 160);  /* Teal */
  --accent: oklch(0.60 0.20 140);     /* Green */
  /* ... more colors ... */
}
```

### Categories
Modify `lib/utils-civic.ts` to add/remove categories:
```typescript
export const categoryLabels = {
  garbage: 'Garbage',
  roads: 'Roads',
  water: 'Water',
  electricity: 'Electricity',
  other: 'Other',
};
```

### Validation Rules
Update form validation in `components/report-form.tsx`:
```typescript
if (formData.title.length < 5) {
  // Add your custom validation
}
```

## Features Implemented

✅ Modern responsive UI with Tailwind CSS
✅ Form validation and error handling
✅ Image upload preview
✅ Real-time statistics
✅ Category filtering
✅ Status tracking (Pending, In Progress, Resolved)
✅ Admin status management
✅ Delete functionality
✅ Loading states with spinners
✅ Toast notifications
✅ Mobile-first design
✅ Accessibility features
✅ SEO-optimized metadata

## Future Enhancements

- **Authentication**: Add user registration and login
- **User Profiles**: Track user complaints
- **Real Database**: Replace in-memory storage
- **Image Storage**: Integrate Vercel Blob or similar
- **Email Notifications**: Send updates via email
- **Maps Integration**: Show complaint locations on map
- **Analytics**: Track complaint trends
- **Comments**: Allow discussion on complaints
- **Voting**: Let users upvote important issues
- **API Documentation**: Add Swagger/OpenAPI docs

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Vercel automatically deploys on push
4. Set environment variables if using database

### Deploy to Other Platforms

- **Next.js Output**: `next build && next start`
- **Docker**: Create Dockerfile with Node.js
- **Self-hosted**: Deploy to your own server

## Contributing

To add new features or fix bugs:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT - Feel free to use this project for personal or commercial purposes

## Support

For questions or issues, please open an issue in the repository or contact the development team.

---

**Built with ❤️ using Next.js and Tailwind CSS**
