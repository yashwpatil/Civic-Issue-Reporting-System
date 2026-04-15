# Complete Authentication System Guide

## Overview

The CivicHub application now features a complete authentication system with user registration, login, password management, and admin user management capabilities.

## Key Features

### 1. User Authentication
- **Registration**: Users can create new accounts with email and password
- **Password Strength Indicator**: Real-time feedback on password strength with visual progress bar
- **Login**: Secure login with email and password validation
- **Session Persistence**: User sessions persist across browser refreshes using localStorage

### 2. Admin Authentication
- **Admin Login**: Separate admin login flow requiring an admin code
- **Admin Code**: `ADMIN2024` (demo code)
- **Admin-Only Access**: Admin panel is protected and only accessible to admin users

### 3. User Management
- **Admin Dashboard**: Admins can view all registered users
- **User Statistics**: Total users, admins, and citizens count
- **User Deletion**: Admins can delete user accounts with confirmation
- **User Information**: View user details including name, email, type, and registration date

### 4. Database Integration
- All user data is stored in-memory with the provided database layer
- Password validation happens at the server level
- Users cannot update passwords via standard endpoints (security measure)

## How to Use

### Registration Flow

1. **Visit Login Page**: Navigate to `/login`
2. **Click "Sign Up"**: Switch to the sign-up mode
3. **Enter Details**:
   - Full Name: Your name
   - Email: Valid email address (must be unique)
   - Password: Minimum 6 characters
   - Confirm Password: Must match the password
4. **Password Requirements**:
   - At least 6 characters
   - Mix of uppercase and lowercase letters recommended
   - At least one number recommended
   - Special characters recommended
5. **Create Account**: Click "Create Account" to register

### Login Flow - Citizen

1. **Visit Login Page**: Navigate to `/login`
2. **Stay in "Sign In" mode**
3. **Select "Citizen"**: Toggle to citizen mode (default)
4. **Enter Credentials**:
   - Email: Your registered email
   - Password: Your account password
5. **Sign In**: Click "Sign In" button
6. **Redirect**: You'll be redirected to `/dashboard`

### Login Flow - Admin

1. **Visit Login Page**: Navigate to `/login`
2. **Stay in "Sign In" mode**
3. **Select "Admin"**: Toggle to admin mode
4. **Enter Credentials**:
   - Email: Your registered email (must be admin account)
   - Password: Your account password
   - Admin Code: `ADMIN2024` (demo)
5. **Sign In**: Click "Sign In" button
6. **Redirect**: You'll be redirected to `/admin`

## Demo Credentials

### Pre-loaded Admin Account
- **Email**: `admin@civichub.com`
- **Password**: `Admin@123`
- **Admin Code**: `ADMIN2024`
- **Type**: Admin

### Registration
You can create new citizen accounts through the registration form.

## Database Schema

### User Collection

```typescript
interface User {
  id: string;           // Unique identifier
  name: string;         // User's full name
  email: string;        // Email address (unique)
  password: string;     // Hashed password (in production)
  type: 'user' | 'admin'; // Account type
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}
```

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`
Create a new user account

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response**:
```json
{
  "message": "Registration successful",
  "user": {
    "id": "user-123456",
    "name": "John Doe",
    "email": "john@example.com",
    "type": "user"
  }
}
```

**Status Codes**:
- `201`: Account created successfully
- `400`: Validation error (missing fields, weak password, etc.)
- `409`: Email already exists

#### POST `/api/auth/login`
Authenticate a user

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123",
  "type": "user",
  "adminCode": null
}
```

**For Admin Login**:
```json
{
  "email": "admin@example.com",
  "password": "AdminPassword123",
  "type": "admin",
  "adminCode": "ADMIN2024"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-123456",
    "name": "John Doe",
    "email": "john@example.com",
    "type": "user"
  }
}
```

**Status Codes**:
- `200`: Login successful
- `400`: Missing required fields
- `401`: Invalid credentials or admin code
- `403`: User type mismatch or insufficient permissions

### User Management Endpoints

#### GET `/api/users`
Get all users and statistics (Admin only)

**Response**:
```json
{
  "users": [
    {
      "id": "user-123456",
      "name": "John Doe",
      "email": "john@example.com",
      "type": "user",
      "createdAt": "2024-04-09T10:00:00Z"
    }
  ],
  "stats": {
    "totalUsers": 10,
    "admins": 1,
    "citizens": 9
  }
}
```

#### GET `/api/users/[id]`
Get a specific user

**Response**:
```json
{
  "user": {
    "id": "user-123456",
    "name": "John Doe",
    "email": "john@example.com",
    "type": "user",
    "createdAt": "2024-04-09T10:00:00Z"
  }
}
```

#### PATCH `/api/users/[id]`
Update user information (Admin only)

**Request Body**:
```json
{
  "name": "Jane Doe",
  "type": "user"
}
```

**Note**: Password cannot be updated via this endpoint

#### DELETE `/api/users/[id]`
Delete a user (Admin only)

**Response**:
```json
{
  "message": "User deleted successfully"
}
```

## Protected Routes

The following routes are protected and require authentication:

- `/report` - Report Issue (Citizens only)
- `/dashboard` - User Dashboard (Citizens only)
- `/admin` - Admin Panel (Admins only)

Unauthorized access will redirect to `/login`.

## Context API

### useAuth Hook

Available in any component wrapped by `AuthProvider`:

```typescript
const { user, isLoading, login, register, logout, isAuthenticated } = useAuth();

// user: Current user object or null
// isLoading: Loading state during auth operations
// login: Async function to authenticate user
// register: Async function to create new account
// logout: Function to clear session
// isAuthenticated: Boolean indicating if user is logged in
```

## Password Security

### Current Implementation (Development)
- Passwords stored in plaintext in-memory database
- For demo purposes only

### Production Implementation
Should include:
- bcrypt hashing for passwords
- Secure password recovery
- Password reset tokens
- Rate limiting on login attempts
- Two-factor authentication option

## Session Management

### Storage
- User sessions stored in browser localStorage
- Key: `civichub_user`
- Format: JSON stringified user object

### Persistence
- Session survives page refresh
- Session cleared on logout
- Session cleared when browser storage is cleared

### Security Considerations
- Implement HTTP-only cookies in production
- Use secure transport (HTTPS)
- Implement CSRF protection
- Add session timeout
- Implement refresh token rotation

## Admin Panel Features

### User Management Tab
- View all registered users
- See user statistics (total, admins, citizens)
- Delete user accounts with confirmation
- View user registration dates and types

### Complaint Management Tab
- View all submitted complaints
- Filter by status and category
- Update complaint status
- Delete complaints
- View complaint statistics

## Role-Based Access Control

### Citizen Role
- Can view homepage
- Can report civic issues
- Can view their own complaints
- Can delete their own complaints
- Cannot access admin panel

### Admin Role
- Can access admin panel
- Can view all complaints
- Can update complaint status
- Can manage user accounts
- Can view system statistics
- Can delete any complaint

## Error Handling

### Common Errors

**Invalid Email Format**
```
Status: 400
Message: "Invalid email format"
```

**Weak Password**
```
Status: 400
Message: "Password must be at least 6 characters"
```

**Email Already Exists**
```
Status: 409
Message: "User with this email already exists"
```

**Invalid Credentials**
```
Status: 401
Message: "Invalid email or password"
```

**Invalid Admin Code**
```
Status: 401
Message: "Invalid admin code"
```

## Testing

### Test Scenarios

1. **Register New Account**
   - Go to `/login`
   - Click "Sign Up"
   - Fill in details
   - Verify account is created
   - Verify you're logged in and redirected to dashboard

2. **Login as Citizen**
   - Go to `/login`
   - Enter registered email and password
   - Verify redirect to `/dashboard`

3. **Login as Admin**
   - Go to `/login`
   - Toggle to "Admin"
   - Enter credentials + admin code
   - Verify redirect to `/admin`

4. **Access Control**
   - Try accessing `/admin` without admin login
   - Should redirect to `/login`
   - Try accessing `/dashboard` without login
   - Should redirect to `/login`

5. **Session Persistence**
   - Login and navigate away
   - Refresh page
   - Verify you're still logged in
   - Logout and refresh
   - Verify you're logged out

## Troubleshooting

### "Invalid email or password"
- Verify email and password are correct
- Check email for typos
- Try resetting credentials through registration

### "User with this email already exists"
- Email is already registered
- Try logging in instead of registering
- Use different email for new account

### "Invalid admin code"
- Verify admin code is `ADMIN2024` for demo
- Only admin accounts can login with admin code

### "This user is not an admin"
- Account is registered as citizen, not admin
- Ask an admin to change your account type (in production)

### Session Lost After Refresh
- Clear browser cache/cookies and try again
- Check if localStorage is enabled
- Try a different browser

## Future Enhancements

1. **Password Management**
   - Password reset/recovery
   - Password change endpoint
   - Password history

2. **Security**
   - Bcrypt password hashing
   - Rate limiting
   - Two-factor authentication
   - Account lockout after failed attempts

3. **User Management**
   - Edit user details
   - Change account type
   - Bulk user operations
   - User activity logging

4. **Email Notifications**
   - Welcome email
   - Password reset email
   - Complaint status updates

5. **Advanced Features**
   - OAuth/Social login
   - Single Sign-On (SSO)
   - Account permissions/roles
   - API keys for integrations
