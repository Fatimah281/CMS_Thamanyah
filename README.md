# CMS Thamanyah - Content Management & Discovery System

A comprehensive content management and discovery system for managing and displaying program episodes to end users. This system consists of two main components: a Content Management System (CMS) for editors and content managers, and a Discovery System for public content exploration.

## 🎯 System Overview

### Content Management System (CMS)
An internal system designed for editors and content managers to:
- Insert and edit video programs (podcasts, documentaries, educational content)
- Manage comprehensive metadata including title, description, category, language, duration, and publish date
- Support future data import from multiple sources
- Provide role-based access control for different user types

### Discovery System
A public-facing system that enables users to:
- Search and explore content stored in the CMS
- Filter content by various criteria (category, language, duration, etc.)
- View program details and metadata
- Access content through multiple delivery methods

## 🏗️ Project Structure

```
CMS_Thamanyah/
├──
│   ├── README.md               # Backend documentation
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Authentication & authorization
│   │   │   ├── programs/       # Program management
│   │   │   ├── categories/     # Category management
│   │   │   ├── languages/      # Language management
│   │   │   └── health/         # Health checks
│   │   ├── common/             # Shared utilities & decorators
│   │   ├── config/             # Configuration files
│   │   └── entities/           # Data models
│   ├── package.json
│   └── tsconfig.json
├── frontend/                    # Angular CMS & Discovery UI
│   ├── README.md               # Frontend documentation
│   ├── projects/
│   │   ├── cms/                # CMS Dashboard (port 4200)
│   │   ├── discovery/          # Discovery Platform (port 4201)
│   │   └── shared/             # Shared components & services
│   ├── package.json
│   └── angular.json
├── uploads/                     # File uploads directory
├── scripts/                     # Development & deployment scripts
└── docs/                        # Additional documentation
```

## 🛠️ Technology Stack

### Backend Technologies
- **NestJS**: Progressive Node.js framework for building scalable server-side applications
- **Firebase/Firestore**: NoSQL database for flexible data storage
- **JWT**: JSON Web Tokens for secure authentication
- **Swagger/OpenAPI**: API documentation

### Frontend Technologies
- **Angular 17**: Latest Angular framework with standalone components
- **Angular Material**: Material Design component library
- **RxJS**: Reactive programming for state management
- **TypeScript**: Type-safe frontend development
- **SCSS**: Advanced CSS preprocessing
- **Angular CDK**: Component development kit

### Testing & Monitoring
- **K6**: Load testing for performance validation
- **Express**: Real-time dashboard for monitoring
- **Chart.js**: Performance visualization

## 📋 Prerequisites

Before setting up the system, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Angular CLI** (for frontend development)
- **Firebase project** with Firestore enabled
- **Git** for version control

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
cp .env.example .env
# Edit .env with your Firebase credentials

# Initialize Firestore (first time only)
npm run init:firestore

# Start the development server
npm run start:dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start CMS Dashboard (port 4200)
npm run serve:cms

# Start Discovery Platform (port 4201)
npm run serve:discovery
```

### 4. Load Testing Dashboard (Optional)
```bash
cd load-testing

# Install dependencies
npm install

# Start dashboard (port 8080)
npm run dashboard

# Run load test with dashboard
npm run test:with-dashboard
```

## 🔧 System Architecture

### Data Flow
1. **Content Creation**: Editors use the CMS Dashboard to create and manage programs
2. **Data Storage**: Content is stored in Firebase Firestore with structured metadata
3. **Content Discovery**: Users access content through the Discovery Platform
4. **Search & Filtering**: Advanced search capabilities across all content metadata

### Security Model
- **Role-based Access Control**: Different permissions for admins and viewers
- **JWT Authentication**: Secure token-based authentication
- **API Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive validation on all inputs

## 🎥 Content Management Features

### Supported Content Types
- **Videos**: YouTube links, direct video files, external URLs
- **Audio**: Podcast files and audio streams
- **Documents**: PDF and other document formats

### Metadata Management
- **Title & Description**: Multi-language support
- **Categories**: Hierarchical content organization
- **Languages**: Content language specification
- **Duration**: Program length tracking
- **Publish Date**: Content scheduling
- **Custom Fields**: Extensible metadata system

## 🔍 Discovery Features

### Search Capabilities
- **Full-text Search**: Search across titles, descriptions, and tags
- **Advanced Filtering**: Filter by category, language, content type, duration
- **Date Range Filtering**: Filter by publish date ranges
- **Status-based Filtering**: Filter by content status (draft, published, archived)

### User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Material Design**: Modern, accessible UI components
- **Real-time Updates**: Live content updates through Firebase
- **Performance Optimized**: Fast loading and smooth interactions

### Environment Configuration
- **Development**: Local development with hot reloading

## 🔄 Future Enhancements

### Planned Features
- **Multi-source Data Import**: Support for importing content from YouTube, Vimeo, and other platforms
- **Advanced Analytics**: Content performance tracking and user behavior analysis
- **API Rate Limiting**: Enhanced API protection and monitoring

### Scalability Considerations
- **Microservices Architecture**: Modular backend design for easy scaling
- **Caching Strategy**: Redis integration for improved performance
- **Database Optimization**: Advanced indexing and query optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Team

- **Fatimah281**: Project Lead & Full-Stack Developer

## 🆘 Support

For support and questions:
- Create an issue on GitHub
## 📚 Documentation


- **[Frontend README](frontend/README.md)**: Frontend setup and development guide
- **[API Documentation](http://localhost:3000/api/docs)**: Swagger UI (when backend is running)
