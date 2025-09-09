# Authentication System Migration to Supabase

This document describes the migration from demo credentials to a full Supabase authentication system with role-based access control.

## Overview

The Petrogreen authentication system has been migrated from hardcoded demo credentials to a proper Supabase authentication system that includes:

- Real user authentication via Supabase Auth
- User profiles with role management
- Row Level Security (RLS) policies
- Permission-based access control
- Secure session management

## Architecture

### Components

1. **Supabase Auth**: Handles user authentication, session management
2. **User Profiles Table**: Stores additional user information and roles
3. **RLS Policies**: Secures data access based on user roles
4. **Permission System**: Maps roles to specific permissions

### User Roles

- **Admin**: Full system access including user management, reports, and settings
- **Stock Manager**: Limited access to inventory operations and basic reports

## Setup Instructions

### Prerequisites

1. Supabase project with valid credentials
2. `.env.local` file with Supabase configuration:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Step 1: Database Setup

Run the authentication setup script in your Supabase SQL Editor:

```sql
-- Copy and paste the content of scripts/setup-authentication-system.sql
```

This script will:
- Create the `user_profiles` table
- Set up RLS policies
- Create helper functions for role management
- Configure triggers for automatic profile creation

### Step 2: Create Demo Users

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" and create:

**Admin User:**
- Email: `admin@petrogreen.com`
- Password: `admin123`
- User Metadata: 
  ```json
  {
    "full_name": "Administrator",
    "role": "admin"
  }
  ```

**Stock Manager User:**
- Email: `stockman@petrogreen.com`
- Password: `stock123`
- User Metadata:
  ```json
  {
    "full_name": "Stock Manager", 
    "role": "stockman"
  }
  ```

### Step 3: Verify Setup

Run the user profile creation script:

```sql
-- Copy and paste the content of scripts/create-demo-users.sql
```

### Step 4: Test Authentication

1. Start the development server: `npm run dev`
2. Navigate to `/login`
3. Test login with both demo accounts
4. Verify role-based permissions work correctly

## Database Schema

### user_profiles Table

```sql
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'stockman')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Key Functions

- `get_user_role(user_uuid)`: Returns the role of a user
- `has_permission(permission_name)`: Checks if current user has permission
- `handle_new_user()`: Automatically creates user profile on registration

## Permissions Matrix

| Permission | Admin | Stock Manager |
|-----------|-------|---------------|
| view_dashboard | ✅ | ✅ |
| add_product | ✅ | ✅ |
| delete_product | ✅ | ❌ |
| stock_movements | ✅ | ✅ |
| view_reports | ✅ | ✅ |
| backup_restore | ✅ | ❌ |
| manage_settings | ✅ | ❌ |
| manage_users | ✅ | ❌ |
| view_costing | ✅ | ❌ |
| manage_costing | ✅ | ❌ |

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow users to read data they have permission to access
- Restrict modifications based on user roles
- Ensure data isolation and security

### Session Management

- Automatic session refresh
- Secure logout functionality  
- Session persistence across page reloads

### Password Security

- Passwords handled by Supabase (bcrypt hashing)
- Configurable password policies
- Email verification (can be enabled)

## Migration Changes

### Code Changes

1. **Authentication Context** (`contexts/auth-context.tsx`):
   - Removed hardcoded credentials
   - Added Supabase Auth integration
   - Implemented user profile fetching

2. **Supabase Integration** (`lib/supabase.ts`):
   - Removed demo mode authentication
   - Added user profile functions
   - Simplified auth functions

3. **Login Page** (`app/login/page.tsx`):
   - Updated to use Supabase authentication
   - Maintained demo credentials display for reference

### Removed Files/Code

- Demo credentials from constants
- localStorage-based session management
- Hardcoded user role assignments

## Production Considerations

### Security Hardening

1. **Change Default Passwords**: Update demo user passwords
2. **Enable Email Confirmation**: Require email verification for new users
3. **Configure Password Policies**: Set minimum password requirements
4. **Set Up Email Templates**: Customize auth emails
5. **Enable MFA**: Add multi-factor authentication

### Environment Configuration

```env
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# Optional: Additional Supabase configuration
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server-side only)
```

### Monitoring

- Set up Supabase auth event monitoring
- Configure failed login attempt alerts
- Monitor user session activities

## Troubleshooting

### Common Issues

1. **"User profile not found"**: Ensure user profiles are created after registration
2. **Permission denied**: Check RLS policies and user roles
3. **Session expired**: Implement proper session refresh logic

### Debug Steps

1. Check Supabase logs in dashboard
2. Verify RLS policies are correctly configured
3. Ensure user_profiles table has correct data
4. Test permissions with different user roles

## API Reference

### Authentication Functions

```typescript
// Sign in user
const { user, error } = await signIn(email, password)

// Sign out user  
await signOut()

// Get current user
const { user, error } = await getCurrentUser()

// Get user profile with role
const { data: profile, error } = await getCurrentUserProfile()
```

### Permission Checking

```typescript
// Check permission in components
const { hasPermission } = useAuth()
const canDelete = hasPermission('delete_product')

// Check permission in database functions
SELECT has_permission('delete_product')
```

This migration provides a robust, secure, and scalable authentication system that can grow with your application needs.