# Authentication System - Quick Start

## What's New

CivicHub now features a professional, dual-mode authentication system with:

✓ Separate citizen and admin login modes
✓ Smooth animated transitions between modes
✓ Professional images that fade between user/admin perspectives
✓ Protected routes with automatic redirects
✓ User session persistence
✓ Professional UI with gradient design

## Getting Started

### 1. Login at `/login`

The login page shows:
- **Left side**: Professional illustration that smoothly transitions between citizen and admin perspectives
- **Right side**: Login form with toggle between "Citizen" and "Admin" modes

### 2. Citizen Login

1. Toggle to "Citizen" mode (default)
2. Enter any email and password
3. Click "Sign In"
4. Redirected to `/dashboard`

**Authorized Pages:**
- `/` (Homepage)
- `/report` (Create new complaint)
- `/dashboard` (View my complaints)

### 3. Admin Login

1. Toggle to "Admin" mode
2. Enter any email and password
3. Enter admin code: `ADMIN2024`
4. Click "Sign In"
5. Redirected to `/admin`

**Authorized Pages:**
- `/` (Homepage)
- `/admin` (Manage all complaints, change statuses)

### 4. Logout

Click "Logout" button in header. Redirects to homepage.

## Key Features

### Image Transitions
- 1000ms smooth cross-fade between citizen and admin images
- Images are pre-loaded for smooth animation
- `login-user-illustration.jpg` - Citizen perspective
- `login-admin-illustration.jpg` - Admin perspective

### Form Validation
- Email validation
- Password requirement
- Admin code requirement (only for admin mode)
- Real-time error messages with animations

### Route Protection

Protected pages automatically redirect to `/login`:
```
/report          → requires "user" role
/dashboard       → requires "user" role
/admin           → requires "admin" role
```

### User Profile Display
Header shows:
- User name with emoji (👤 for citizen, 👨‍💼 for admin)
- Logout button
- Role-appropriate navigation links

## Demo Credentials

### Citizen
- Email: `citizen@example.com` (or any email)
- Password: `password` (or any password)

### Admin
- Email: `admin@example.com` (or any email)
- Password: `password` (or any password)
- Code: `ADMIN2024` (required - case sensitive)

## Architecture

### Auth Context (`lib/auth-context.tsx`)
- Global authentication state
- `useAuth()` hook for accessing user data
- Login/logout methods
- localStorage persistence

### Protected Route Component (`components/protected-route.tsx`)
- Wraps pages needing authentication
- Redirects if not authenticated
- Shows loading spinner while checking auth
- Role-based access control

### Login Component (`components/login-view.tsx`)
- Dual-mode toggle (Citizen/Admin)
- Form with validation
- Image carousel with animations
- Error handling and loading states

### Updated Header (`components/header.tsx`)
- Shows user profile when logged in
- Shows login button when logged out
- Role-aware navigation
- Logout functionality

## File Locations

### New Files
```
lib/auth-context.tsx                  (Auth state management)
components/login-view.tsx             (Login page component)
components/protected-route.tsx        (Route protection)
app/login/page.tsx                    (Login page)
public/login-user-illustration.jpg    (Citizen image)
public/login-admin-illustration.jpg   (Admin image)
```

### Modified Files
```
app/layout.tsx                        (Added AuthProvider)
components/header.tsx                 (Auth-aware navigation)
app/page.tsx                          (Dynamic homepage)
app/report/page.tsx                   (Protected with ProtectedRoute)
app/dashboard/page.tsx                (Protected with ProtectedRoute)
app/admin/page.tsx                    (Protected with ProtectedRoute)
```

## Testing the System

### Test Citizen Flow
1. Go to `/login`
2. Ensure "Citizen" toggle is selected
3. Enter email: `test@example.com`
4. Enter password: `test123`
5. Click "Sign In"
6. Should redirect to `/dashboard`
7. Header should show your name and logout button
8. Homepage should show welcome message

### Test Admin Flow
1. Go to `/login`
2. Click "Admin" toggle
3. Image should fade to admin perspective
4. Admin Code field should appear
5. Enter email: `admin@example.com`
6. Enter password: `admin123`
7. Enter code: `ADMIN2024`
8. Click "Sign In"
9. Should redirect to `/admin`
10. Header should show "Admin" label

### Test Route Protection
1. Login as citizen
2. Try to access `/admin` → redirected to login
3. Logout from header
4. Try to access `/report` → redirected to login
5. Try to access `/dashboard` → redirected to login

### Test Session Persistence
1. Login as citizen
2. Close browser tab
3. Open new tab to same URL
4. Should still be logged in (session restored from localStorage)
5. Hard refresh (Ctrl+Shift+R) should maintain session

### Test Image Transitions
1. Go to `/login`
2. Click toggle between "Citizen" and "Admin"
3. Left image should smoothly fade (1000ms)
4. No loading flickering should occur

## Customization

### Change Admin Code
Edit `lib/auth-context.tsx`:
```tsx
if (type === 'admin' && adminCode !== 'YOUR_NEW_CODE') {
  throw new Error('Invalid admin code');
}
```

### Adjust Transition Duration
Edit `components/login-view.tsx`:
```tsx
// Change from 1000 to any milliseconds
<div className={`transition-opacity duration-1000 ...`}>
```

### Change Color Theme
Auth components use your existing theme colors:
- Primary (blue) for buttons and highlights
- Muted (gray) for backgrounds
- Destructive (red) for logout button

All colors in `app/globals.css`

## Security Notes for Production

Current system is for demo/development. For production:

1. **Hash passwords** using bcrypt on backend
2. **Validate credentials** against secure database
3. **Use HTTP-only cookies** instead of localStorage
4. **Implement JWT tokens** or secure sessions
5. **Add HTTPS** requirement
6. **Rate limit** login attempts
7. **Add email verification** for citizen accounts
8. **Secure admin codes** in environment variables

See `AUTH_GUIDE.md` for full production setup.

## Troubleshooting

**Problem**: "Admin code input not appearing"
- Solution: Make sure "Admin" toggle is selected

**Problem**: "Can't login to admin"
- Solution: Check admin code is exactly `ADMIN2024` (case-sensitive)

**Problem**: "Session doesn't persist"
- Solution: Check localStorage is enabled in browser settings

**Problem**: "Images not loading"
- Solution: Verify `login-user-illustration.jpg` and `login-admin-illustration.jpg` exist in `/public`

**Problem**: "Smooth transitions are jerky"
- Solution: Check browser hardware acceleration is enabled

## Next Steps

1. Test the demo authentication system
2. Create some complaints as a citizen
3. Login as admin to manage them
4. For production: See `AUTH_GUIDE.md` for backend integration
