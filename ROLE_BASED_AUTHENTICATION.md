# Role-Based Authentication Implementation

## Overview
Implemented a comprehensive role-based authentication system with automatic redirection based on user roles. The system now supports four user roles: Admin, Editor, User, and Viewer.

## User Roles

### 1. Admin Role
- **Access**: Full access to CMS dashboard and all features
- **Redirect**: Automatically redirected to CMS dashboard (`/dashboard`)
- **Permissions**: Can create, edit, delete programs, manage categories, languages, and users

### 2. Editor Role
- **Access**: Similar to admin but with limited permissions
- **Redirect**: Automatically redirected to CMS dashboard (`/dashboard`)
- **Permissions**: Can create and edit programs, limited administrative functions

### 3. User Role
- **Access**: Discovery frontend access
- **Redirect**: Automatically redirected to Discovery app (`http://localhost:4201`)
- **Permissions**: Can view programs, use search and filters

### 4. Viewer Role
- **Access**: Discovery frontend access (read-only)
- **Redirect**: Automatically redirected to Discovery app (`http://localhost:4201`)
- **Permissions**: Can view programs, use search and filters

## Implementation Details

### 1. Enhanced User Model
```typescript
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  role?: string; // Added role property
}
```

### 2. Updated Authentication Service
- **Role Storage**: User role is stored in localStorage as `userRole`
- **Role Methods**: Added `isAdmin()`, `isUser()`, `getUserRole()` methods
- **Redirect Logic**: `getRedirectUrlByRole()` method determines redirect URL based on role
- **Enhanced Login/Register**: Both methods now return user data and redirect URL

### 3. Registration Form Enhancement
- **Role Selection**: Added dropdown to select user role during registration
- **Available Roles**: User, Admin, Editor, Viewer
- **Default Role**: User (for new registrations)

### 4. Role-Based Redirection

#### Login Flow:
1. User enters credentials
2. Backend validates and returns user data with role
3. Frontend determines redirect URL based on role:
   - Admin/Editor → CMS Dashboard (`http://localhost:4200/dashboard`)
   - User/Viewer → Discovery App (`http://localhost:4201`)

#### Registration Flow:
1. User fills registration form including role selection
2. Backend creates user with specified role
3. Frontend redirects based on selected role

### 5. Route Protection

#### CMS Routes Protected:
- `/dashboard` - Requires admin/editor role
- `/programs/new` - Requires admin/editor role
- `/programs/:id/edit` - Requires admin/editor role

#### Admin Guard:
```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate() {
    return this.authService.user$.pipe(
      take(1),
      map(user => {
        if (user && this.authService.isAdmin()) {
          return true;
        } else {
          // Redirect non-admin users to discovery
          window.location.href = 'http://localhost:4201';
          return false;
        }
      })
    );
  }
}
```

### 6. Discovery App Enhancements
- **Role Display**: Shows user role in header and user menu
- **Admin Detection**: Automatically redirects admin users to CMS
- **CMS Navigation**: Admin users see "Go to CMS" option in user menu
- **Cross-App Navigation**: Seamless navigation between Discovery and CMS

## Files Modified

### Backend Changes
- No changes required (backend already supports role-based authentication)

### Frontend Changes
1. **Models**:
   - `user.model.ts` - Added role property

2. **Services**:
   - `auth.service.ts` - Enhanced with role management and redirection logic

3. **Components**:
   - `login.component.ts` - Added role selection and redirection logic
   - `home.component.ts` - Added role-based navigation and admin detection

4. **Templates**:
   - `login.html` - Added role selection dropdown
   - `home.html` - Added role display and admin navigation

5. **Guards**:
   - `admin.guard.ts` - New route protection for CMS

6. **Routes**:
   - `app.routes.ts` - Added admin guard to protected routes

## Security Features

### 1. Role Validation
- Frontend validates user roles before allowing access
- Backend enforces role-based permissions
- Route guards prevent unauthorized access

### 2. Session Management
- User role stored in localStorage for persistence
- Automatic role validation on app initialization
- Secure token-based authentication

### 3. Cross-App Security
- Admin users automatically redirected to appropriate app
- Non-admin users cannot access CMS routes
- Seamless authentication across both applications

## User Experience

### 1. Seamless Navigation
- Automatic redirection based on user role
- No manual navigation required
- Consistent user experience across apps

### 2. Clear Role Indication
- User role displayed in header
- Role-specific navigation options
- Intuitive interface for different user types

### 3. Error Handling
- Graceful handling of authentication errors
- Clear error messages for users
- Automatic logout on authentication failure

## Testing Scenarios

### 1. Registration Testing
- Test registration with each role type
- Verify correct redirection after registration
- Test role selection validation

### 2. Login Testing
- Test login with different user roles
- Verify automatic redirection
- Test session persistence

### 3. Route Protection Testing
- Test CMS access with admin/editor roles
- Test CMS access with user/viewer roles
- Verify automatic redirection to Discovery

### 4. Cross-App Navigation Testing
- Test navigation from Discovery to CMS (admin users)
- Test navigation from CMS to Discovery
- Verify role persistence across apps

## Future Enhancements

### 1. Role Management
- Admin interface for managing user roles
- Role assignment and modification
- Role hierarchy management

### 2. Permission System
- Granular permissions per role
- Feature-based access control
- Dynamic permission loading

### 3. Audit Logging
- Track user role changes
- Log authentication events
- Monitor access patterns

### 4. Multi-Tenant Support
- Organization-based roles
- Tenant-specific permissions
- Cross-tenant access control
