# CivicHub Authentication System

## Overview

CivicHub includes a professional, dual-mode authentication system with separate user and admin login flows. The system uses React Context API for state management with localStorage persistence.

## Features

- **Dual Login Modes**: Separate login flows for citizens and administrators
- **Smooth Animations**: Cross-fade transitions between user/admin login screens with professional images
- **Route Protection**: Protected routes that redirect unauthorized users
- **Session Persistence**: User sessions persist across page refreshes
- **Professional UI**: Modern, gradient-based login interface with animated toggles

## Login Credentials (Demo)

### Citizen Login
- **Email**: Any valid email address
- **Password**: Any password
- **Access**: Dashboard and Report Issue pages

### Admin Login
- **Email**: Any valid email address
- **Password**: Any password
- **Admin Code**: `ADMIN2024` (required for admin access)
- **Access**: Admin Panel for managing all complaints

## Architecture

### Components

1. **Auth Context (`lib/auth-context.tsx`)**
   - React Context providing authentication state
   - `useAuth()` hook for accessing user session
   - Login and logout methods
   - localStorage persistence

2. **Login View (`components/login-view.tsx`)**
   - Professional dual-mode login interface
   - Animated toggle between citizen and admin modes
   - Smooth image transitions
   - Form validation and error handling

3. **Protected Route (`components/protected-route.tsx`)**
   - Wraps pages requiring authentication
   - Redirects unauthenticated users to login
   - Role-based access control

4. **Header Component (Updated)**
   - Dynamic navigation based on auth state
   - User profile display
   - Logout functionality

## Usage

### Protecting a Page

```tsx
'use client';

import { ProtectedRoute } from '@/components/protected-route';

export default function MyPage() {
  return (
    <ProtectedRoute requiredRole="user">
      {/* Page content */}
    </ProtectedRoute>
  );
}
```

### Using Auth in Components

```tsx
'use client';

import { useAuth } from '@/lib/auth-context';

export default function MyComponent() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }

  return <p>Welcome, {user?.name}!</p>;
}
```

## User Flow

### First-Time User
1. User visits homepage
2. Homepage shows "Get Started" and "Sign In" buttons
3. User clicks "Get Started" → redirected to login
4. User enters email and password, selects "Citizen" mode
5. User redirected to dashboard
6. Dashboard shows empty state (no complaints yet)
7. User can click "New Report" or "Report Issue" button to create a complaint

### Returning User
1. User visits homepage
2. Browser restores user session from localStorage
3. Homepage shows welcome message with their name
4. Navigation shows "Report Issue" and "My Dashboard" links
5. Header shows user profile with logout option

### Admin Flow
1. Admin visits `/admin` directly or clicks from homepage
2. Redirected to login if not authenticated
3. Clicks "Admin" toggle button
4. Enters email, password, and admin code
5. Redirected to admin panel
6. Can view and manage all complaints, change statuses

## Protected Routes

- `/report` - Report Issue page (requires user login)
- `/dashboard` - User Dashboard (requires user login)
- `/admin` - Admin Panel (requires admin login)

## File Structure

```
app/
├── login/
│   └── page.tsx              # Login page wrapper
├── report/
│   └── page.tsx              # Protected report page
├── dashboard/
│   └── page.tsx              # Protected dashboard page
├── admin/
│   └── page.tsx              # Protected admin page
└── layout.tsx                # AuthProvider wrapper

components/
├── login-view.tsx            # Login form with dual modes
├── protected-route.tsx       # Route protection wrapper
├── header.tsx                # Auth-aware header
└── ...

lib/
└── auth-context.tsx          # Authentication context and hooks

public/
├── login-user-illustration.jpg    # Citizen login image
└── login-admin-illustration.jpg   # Admin login image
```

## Styling & Animations

### Login Page Animations
- **Mode Toggle**: Smooth button color and shadow transitions
- **Admin Code Field**: Animated height expansion (max-h-24 → max-h-0)
- **Image Transition**: Cross-fade effect between user/admin images (1000ms)
- **Error Messages**: Fade in with slide animation
- **Form Inputs**: Focus state with ring animation

### Design System
- **Colors**: Blue primary (#240°), Green secondary (#140°-160°)
- **Spacing**: Tailwind spacing scale
- **Radius**: 0.625rem (rounded-lg)
- **Duration**: 300ms for most transitions, 1000ms for image fades

## Production Considerations

### Security
For production deployment:

1. **Backend Validation**: Move authentication to backend API
   ```tsx
   const response = await fetch('/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, password, type })
   });
   ```

2. **Secure Cookies**: Use HTTP-only, secure cookies instead of localStorage
3. **JWT/Sessions**: Implement proper token-based or session-based authentication
4. **Admin Verification**: Store admin codes securely in database
5. **Password Hashing**: Hash passwords with bcrypt on backend

### Example Backend Integration

```typescript
// api/auth/login route
export async function POST(request: Request) {
  const { email, password, type, adminCode } = await request.json();

  // Validate credentials against database
  const user = await db.users.findOne({ email });
  
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (type === 'admin' && !user.isAdmin) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Create session/token
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  
  // Return token in secure cookie
  const response = Response.json({ user });
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  });
  
  return response;
}
```

## Troubleshooting

### User Keeps Getting Redirected to Login
- Check localStorage is enabled in browser
- Verify `AuthProvider` wraps the root layout
- Check browser console for errors in auth-context

### Images Not Loading on Login Page
- Verify image files exist in `/public/`:
  - `login-user-illustration.jpg`
  - `login-admin-illustration.jpg`
- Check Image optimization settings

### Admin Code Not Working
- Demo code is `ADMIN2024` (case-sensitive)
- For production, implement backend validation

## Future Enhancements

- Google/GitHub OAuth integration
- Two-factor authentication
- Email verification
- Password reset flow
- Role-based dashboard customization
- Audit logging for admin actions
