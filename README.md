# CMS Thamanyah - Content Management System

A comprehensive content management system with a Discovery frontend for educational content, built with NestJS backend and Angular frontend.

## 🚀 Features

### Backend (NestJS)
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Program Management**: CRUD operations for educational programs
- **Category & Language Management**: Organize content by categories and languages
- **Video Upload**: Support for video file uploads and YouTube integration
- **Search & Filtering**: Advanced search capabilities with pagination
- **Firebase Integration**: Firestore database with real-time updates
- **API Documentation**: Swagger/OpenAPI documentation

### Frontend (Angular)
- **CMS Dashboard**: Admin interface for content management
- **Discovery Platform**: Public-facing content discovery interface
- **Responsive Design**: Material Design components
- **Authentication**: Secure login/registration system
- **Content Player**: YouTube and HTML5 video/audio support
- **Advanced Filtering**: Search and filter content by various criteria

## 🏗️ Project Structure

```
CMS_Thamanyah/
├── src/                          # Backend (NestJS)
│   ├── modules/
│   │   ├── auth/                 # Authentication module
│   │   ├── programs/             # Program management
│   │   ├── categories/           # Category management
│   │   └── languages/            # Language management
│   ├── common/                   # Shared utilities
│   └── config/                   # Configuration files
├── frontend/                     # Frontend (Angular)
│   ├── projects/
│   │   ├── cms/                  # CMS Dashboard
│   │   ├── discovery/            # Discovery Platform
│   │   └── shared/               # Shared components & services
│   └── package.json
├── uploads/                      # File uploads directory
└── scripts/                      # Development scripts
```

## 🛠️ Technology Stack

### Backend
- **NestJS**: Progressive Node.js framework
- **Firebase/Firestore**: NoSQL database
- **JWT**: JSON Web Tokens for authentication
- **Passport.js**: Authentication strategies
- **Multer**: File upload handling
- **Swagger**: API documentation

### Frontend
- **Angular 17**: Latest Angular framework
- **Angular Material**: UI component library
- **RxJS**: Reactive programming
- **TypeScript**: Type-safe JavaScript
- **SCSS**: Advanced CSS preprocessing

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Firestore enabled
- Angular CLI (for frontend development)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Fatimah281/cms-thamanyah.git
cd cms-thamanyah
```

### 2. Backend Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your Firebase credentials

# Initialize Firestore (first time only)
npm run init-firestore

# Start the development server
npm run start:dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start CMS Dashboard (port 4200)
npm run start:cms

# Start Discovery Platform (port 4201)
npm run start:discovery
```

## 🔧 Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

## 🔐 Authentication

The system supports multiple user roles:
- **Admin**: Full access to CMS and content management
- **Editor**: Content creation and editing
- **Viewer**: Read-only access to published content
- **User**: Basic access to Discovery platform

## 🎥 Content Management

### Supported Content Types
- **Videos**: YouTube links, direct video files, external URLs
- **Audio**: Podcast files and audio streams
- **Documents**: PDF and other document formats

### File Upload Limits
- **Video Files**: Up to 500MB
- **Supported Formats**: MP4, WebM, OGG, AVI, MOV

## 🔍 Search & Discovery

### Advanced Filtering
- Search by title, description, and tags
- Filter by category, language, content type
- Date range filtering
- Status-based filtering

### Content Organization
- **Categories**: Organize content by subject matter
- **Languages**: Support for multiple languages
- **Tags**: Flexible tagging system
- **Metadata**: Custom metadata fields

## 🚀 Deployment

### Backend Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

### Frontend Deployment
```bash
cd frontend

# Build CMS for production
npm run build:cms

# Build Discovery for production
npm run build:discovery
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Fatimah281**: Project Lead & Full-Stack Developer

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact: [Your Contact Information]

## 🔄 Version History

- **v1.0.0**: Initial release with CMS and Discovery platforms
- Complete authentication system
- Program management functionality
- Advanced search and filtering
- Responsive design implementation
