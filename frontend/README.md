# Frontend README - Angular CMS & Discovery UI

This document provides setup and running instructions for the Angular frontend applications that power the CMS Thamanyah content management and discovery system.

## 🏗️ Overview

The frontend consists of two main Angular applications:

### CMS Dashboard (Port 4200)
An internal application for editors and content managers to:
- Create, edit, and manage video programs
- Organize content by categories and languages
- Manage user roles and permissions
- Monitor content performance

### Discovery Platform (Port 4201)
A public-facing application for end users to:
- Browse and search content
- Filter programs by various criteria
- View program details and metadata
- Access content through multiple delivery methods

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Angular CLI** (v17 or higher)
- **Backend API** running on port 3000

## 🚀 Setup and Installation

### 1. Install Dependencies
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### 2. Environment Configuration

Create environment files for different environments:

#### Development Environment (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'your-sender-id',
    appId: 'your-app-id'
  }
};
```

#### Production Environment (`src/environments/environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',
  firebase: {
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'your-sender-id',
    appId: 'your-app-id'
  }
};
```

## 🏃‍♂️ Running the Applications

### Development Mode

#### CMS Dashboard (Port 4200)
```bash
# Start CMS Dashboard
npm run serve:cms

# Or using Angular CLI directly
ng serve cms --port 4200
```

#### Discovery Platform (Port 4201)
```bash
# Start Discovery Platform
npm run serve:discovery

# Or using Angular CLI directly
ng serve discovery --port 4201
```

#### Running Both Applications
```bash
# Start both applications simultaneously
npm run serve:cms & npm run serve:discovery
```

### Production Mode
```bash
# Build CMS for production
npm run build:cms

# Build Discovery for production
npm run build:discovery

# Build both applications
npm run build
```

## 🎨 Angular Material and Responsive Design

The applications use Angular Material for consistent, accessible UI components and responsive design:

### Key Features
- **Material Design Components**: Toolbar, Sidenav, Cards, Tables, Forms, Buttons, Icons, Dialogs
- **Responsive Layout**: Mobile-first approach with flexible layouts
- **Touch-friendly**: Optimized for touch interactions
- **Accessibility**: WCAG 2.1 AA compliance

### Responsive Breakpoints
- **Mobile**: 0-600px
- **Tablet**: 600-960px
- **Desktop**: 960px+

## 🔧 Project Structure

### CMS Dashboard Structure
```
projects/cms/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── programs/       # Program management
│   │   │   ├── categories/     # Category management
│   │   │   ├── languages/      # Language management
│   │   │   └── shared/         # Shared components
│   │   ├── services/
│   │   ├── guards/
│   │   └── app.component.ts
│   ├── assets/
│   └── styles/
```

### Discovery Platform Structure
```
projects/discovery/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── home/           # Home page components
│   │   │   ├── search/         # Search functionality
│   │   │   ├── program/        # Program details
│   │   │   ├── player/         # Video/audio player
│   │   │   └── shared/         # Shared components
│   │   ├── services/
│   │   └── app.component.ts
│   ├── assets/
│   └── styles/
```

### Shared Library Structure
```
projects/shared/
├── src/
│   ├── lib/
│   │   ├── components/         # Shared components
│   │   ├── services/           # Shared services
│   │   ├── models/             # Data models
│   │   ├── pipes/              # Custom pipes
│   │   └── utils/              # Utility functions
│   └── public-api.ts
```

## 🔐 Authentication

The frontend integrates with the backend JWT authentication system:

### Features
- **Login/Logout**: Secure authentication flow
- **Token Management**: Automatic token refresh
- **Route Guards**: Protected routes based on user roles
- **Role-based Access**: Different permissions for different user types

### User Roles
- **Admin**: Full access to CMS features
- **Editor**: Content creation and editing
- **Viewer**: Read-only access to published content

## 🎥 Content Management Features

### Program Management
- **Create/Edit Programs**: Full CRUD operations
- **Metadata Management**: Title, description, category, language, duration, publish date
- **File Upload**: Support for video files and thumbnails
- **Status Management**: Draft, published, archived states

### Search and Filtering
- **Full-text Search**: Search across titles, descriptions, and tags
- **Advanced Filtering**: Filter by category, language, content type, duration
- **Date Range Filtering**: Filter by publish date ranges
- **Status-based Filtering**: Filter by content status

## 🔍 Discovery Features

### Content Browsing
- **Grid Layout**: Responsive program grid
- **Card Design**: Material Design cards for programs
- **Hover Effects**: Interactive program cards
- **Quick Actions**: View, edit, delete options

### User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Fast Loading**: Optimized for performance
- **Smooth Interactions**: Material Design animations
- **Real-time Updates**: Live content updates

## 🚀 Build Steps for Production

### Environment-specific Builds
```bash
# Development build
ng build cms --configuration development
ng build discovery --configuration development

# Production build
ng build cms --configuration production
ng build discovery --configuration production

# Build with optimization
ng build cms --prod --aot --build-optimizer
ng build discovery --prod --aot --build-optimizer
```

### Build Output
- **CMS Dashboard**: `dist/cms/`
- **Discovery Platform**: `dist/discovery/`
- **Shared Library**: `dist/shared/`

## 🧪 Testing

### Unit Testing
```bash
# Run all tests
npm run test

# Run CMS tests
npm run test:cms

# Run Discovery tests
npm run test:discovery

# Run tests in watch mode
ng test cms --watch
ng test discovery --watch
```

### E2E Testing
```bash
# Run E2E tests
ng e2e cms
ng e2e discovery
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process using port 4200
lsof -ti:4200 | xargs kill -9

# Or use different port
ng serve cms --port 4202
```

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
ng cache clean
```

#### Material Design Issues
```bash
# Ensure Material is properly installed
npm install @angular/material @angular/cdk

# Import Material modules in your app.module.ts
```

### Debug Mode
```bash
# Enable source maps for debugging
ng serve cms --source-map

# Use browser developer tools
# Navigate to Sources tab in Chrome DevTools
```

## 📚 Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular Material](https://material.angular.io/)
- [Angular CLI](https://cli.angular.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📞 Support

For frontend-specific issues:
- Check browser console for errors
- Review Angular CLI output
- Test in different browsers
- Create an issue with detailed error information
