# Thamanyah Frontend - Angular Workspace

This Angular workspace contains two applications:

1. **CMS (Content Management System)** - Internal admin interface
2. **Discovery** - Public program discovery interface

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore enabled

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Copy your Firebase config to both apps' environment files:
     - `projects/cms/src/environments/environment.ts`
     - `projects/discovery/src/environments/environment.ts`
   - Replace the placeholder values with your actual Firebase config

3. **Build the shared library:**
   ```bash
   npm run build shared
   ```

### Running the Applications

#### CMS App (Port 4200)
```bash
# Development
npm run serve cms

# Production build
npm run build cms
```

#### Discovery App (Port 4201)
```bash
# Development
npm run serve discovery

# Production build
npm run build discovery
```

#### Both Apps Simultaneously
```bash
# Terminal 1
npm run serve cms

# Terminal 2
npm run serve discovery
```

## 📁 Project Structure

```
frontend/
├── projects/
│   ├── cms/                    # CMS Application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── components/
│   │   │   │   │   ├── login/          # Google Auth login
│   │   │   │   │   ├── dashboard/      # Program management
│   │   │   │   │   └── program-form/   # Add/edit programs
│   │   │   │   └── app.routes.ts
│   │   │   └── environments/
│   │   └── ...
│   ├── discovery/              # Discovery Application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── components/
│   │   │   │   │   ├── home/           # Program listing & search
│   │   │   │   │   └── program-detail/ # Program details
│   │   │   │   └── app.routes.ts
│   │   │   └── environments/
│   │   └── ...
│   └── shared/                 # Shared Library
│       ├── src/lib/
│       │   ├── models/         # Data models
│       │   └── services/       # Firebase services
│       └── ...
└── ...
```

## 🔧 Configuration

### Firebase Setup

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com)

2. **Enable Authentication:**
   - Go to Authentication > Sign-in method
   - Enable Google sign-in

3. **Enable Firestore:**
   - Go to Firestore Database
   - Create database in test mode

4. **Update environment files:**
   ```typescript
   // projects/cms/src/environments/environment.ts
   // projects/discovery/src/environments/environment.ts
   
   export const environment = {
     production: false,
     firebase: {
       apiKey: "your-api-key",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "your-sender-id",
       appId: "your-app-id"
     },
     apiUrl: 'http://localhost:3000/api/v1'
   };
   ```

### Initial Data Setup

Run the backend scripts to create initial collections:

```bash
# From the backend directory
npm run init:firestore
npm run verify:collections
```

## 🎯 Features

### CMS App (http://localhost:4200)
- ✅ Google Authentication
- ✅ Protected routes (login required)
- ✅ Program CRUD operations
- ✅ Category and language dropdowns
- ✅ Responsive dashboard with Material Design
- ✅ Form validation
- ✅ Success/error notifications

### Discovery App (http://localhost:4201)
- ✅ Public access (no login required)
- ✅ Program listing with search
- ✅ Filter by category, language, date
- ✅ Program detail pages
- ✅ Responsive design
- ✅ Material Design components

### Shared Library
- ✅ Firebase services (Auth, Firestore)
- ✅ Data models and interfaces
- ✅ Reusable components and utilities

## 🛠️ Development

### Available Scripts

```bash
# Build shared library
npm run build shared

# Build both apps
npm run build cms
npm run build discovery

# Run tests
npm run test cms
npm run test discovery

# Lint code
npm run lint cms
npm run lint discovery
```

### Adding New Components

```bash
# CMS app
npx @angular/cli generate component components/new-component --project=cms

# Discovery app
npx @angular/cli generate component components/new-component --project=discovery
```

### Adding New Services

```bash
# Shared library
npx @angular/cli generate service services/new-service --project=shared
```

## 🔒 Security

- CMS app requires Google authentication
- Discovery app is public
- All Firebase operations use proper security rules
- Environment variables for sensitive data

## 📱 Responsive Design

Both applications are fully responsive and work on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🚀 Deployment

### Build for Production

```bash
# Build both apps
npm run build cms --configuration=production
npm run build discovery --configuration=production
```

### Deploy to Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase:**
   ```bash
   firebase init hosting
   ```

3. **Deploy:**
   ```bash
   firebase deploy
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Firebase connection errors:**
   - Verify environment configuration
   - Check Firebase project settings
   - Ensure Firestore is enabled

2. **Build errors:**
   - Run `npm run build shared` first
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

3. **Port conflicts:**
   - CMS runs on port 4200
   - Discovery runs on port 4201
   - Change ports in `angular.json` if needed

### Getting Help

- Check the console for error messages
- Verify Firebase configuration
- Ensure all dependencies are installed
- Check that the backend is running on port 3000

## 📄 License

This project is licensed under the MIT License.
