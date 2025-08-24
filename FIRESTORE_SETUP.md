# Firestore Collections Setup Guide

This guide will help you ensure all Firestore collections are properly created and visible in the Firebase Console.

## 📋 Prerequisites

1. **Firebase Project**: Ensure you have a Firebase project with Firestore enabled
2. **Service Account**: Download your Firebase service account key
3. **Environment Variables**: Set up your `.env` file

## 🚀 Step-by-Step Setup

### 1. Environment Configuration

First, ensure your `.env` file is properly configured:

```bash
# Copy the environment template
cp env.example .env
```

Update your `.env` file with your Firebase service account:

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"cms-thamanyah",...}

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Firestore Collections

Run the initialization script to create all collections with sample data:

```bash
npm run init:firestore
```

This script will create:
- **`_counters`** - Auto-increment counters for IDs
- **`categories`** - 4 sample categories (Documentaries, Podcasts, Lectures, Interviews)
- **`languages`** - 4 sample languages (English, Arabic, French, Spanish)
- **`user_profiles`** - 1 sample admin user profile
- **`programs`** - 3 sample programs
- **`metadata`** - 4 sample metadata entries
- **`search_logs`** - 2 sample search logs

### 4. Verify Collections

Run the verification script to confirm all collections exist:

```bash
npm run verify:collections
```

This will show you:
- Collection names
- Document counts
- Sample document data
- Verification status

## 🔍 Firebase Console Verification

### Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`cms-thamanyah`)
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Data** tab

### Expected Collections

You should see these collections in the Firebase Console:

| Collection | Purpose | Sample Documents |
|------------|---------|------------------|
| `_counters` | Auto-increment counters | programs: 0, categories: 0, languages: 0, users: 0 |
| `categories` | Program categories | Documentaries, Podcasts, Lectures, Interviews |
| `languages` | Supported languages | English, Arabic, French, Spanish |
| `user_profiles` | User profile data | admin user profile |
| `programs` | Video content | 3 sample programs |
| `metadata` | Extensible metadata | Speaker, level, location, host info |
| `search_logs` | Search analytics | Search term tracking |

### Collection Structure

#### `_counters` Collection
```
programs: { value: 0 }
categories: { value: 0 }
languages: { value: 0 }
users: { value: 0 }
```

#### `categories` Collection
```
1: {
  id: 1,
  name: "Documentaries",
  description: "Educational and informative documentaries",
  isActive: true,
  sortOrder: 1,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `languages` Collection
```
1: {
  id: 1,
  name: "English",
  code: "en",
  isActive: true,
  sortOrder: 1,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `user_profiles` Collection
```
sample-admin-uid: {
  uid: "sample-admin-uid",
  username: "admin",
  email: "admin@thamanyah.com",
  role: "admin",
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `programs` Collection
```
1: {
  id: 1,
  title: "Introduction to Islamic Finance",
  description: "A comprehensive introduction...",
  duration: 120,
  publishDate: "2024-01-15",
  status: "published",
  thumbnailUrl: "https://example.com/thumb1.jpg",
  videoUrl: "https://example.com/video1.mp4",
  audioUrl: "https://example.com/audio1.mp3",
  viewCount: 0,
  isActive: true,
  categoryId: 3,
  languageId: 1,
  createdBy: "sample-admin-uid",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `metadata` Collection
```
1: {
  id: 1,
  programId: 1,
  key: "speaker",
  value: "Dr. Ahmed Hassan",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `search_logs` Collection
```
1: {
  id: 1,
  searchTerm: "Islamic finance",
  userId: null,
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  timestamp: Timestamp
}
```

## 🧪 Testing the Setup

### 1. Start the Application

```bash
npm run start:dev
```

### 2. Test API Endpoints

#### Get Categories
```bash
curl http://localhost:3000/api/v1/categories
```

#### Get Languages
```bash
curl http://localhost:3000/api/v1/languages
```

#### Get Programs
```bash
curl http://localhost:3000/api/v1/programs
```

#### Search Programs
```bash
curl "http://localhost:3000/api/v1/programs/search?q=Islamic"
```

### 3. Register a User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "editor"
  }'
```

## 🔧 Troubleshooting

### Collections Not Visible

If collections are not visible in Firebase Console:

1. **Check Service Account**: Ensure your service account has proper permissions
2. **Verify Project ID**: Confirm you're looking at the correct Firebase project
3. **Run Verification**: Use `npm run verify:collections` to check if data exists
4. **Check Firestore Rules**: Ensure your Firestore security rules allow read access

### Permission Errors

If you get permission errors:

1. **Service Account Permissions**: Ensure your service account has `Firebase Admin` role
2. **Firestore Rules**: Check if your Firestore security rules are blocking access
3. **Project Selection**: Verify you're using the correct Firebase project

### Data Not Persisting

If data is not persisting:

1. **Check Network**: Ensure your application can reach Firebase
2. **Verify Credentials**: Double-check your service account JSON
3. **Check Console Logs**: Look for any error messages in the application logs

## 📊 Monitoring

### Firebase Console Monitoring

- **Usage**: Monitor Firestore usage in the Firebase Console
- **Performance**: Check query performance and optimization
- **Security**: Review security rules and access patterns

### Application Monitoring

- **Logs**: Check application logs for any Firestore errors
- **Metrics**: Monitor API response times and success rates
- **Errors**: Track any Firestore-related errors

## 🎯 Next Steps

After successful setup:

1. **Create Real Users**: Use the registration endpoint to create real users
2. **Add Content**: Create real programs, categories, and languages
3. **Test Features**: Test all CMS and discovery features
4. **Deploy**: Deploy to Firebase Hosting and Cloud Run
5. **Monitor**: Set up monitoring and analytics

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [NestJS Documentation](https://docs.nestjs.com/)

---

**Need Help?** Check the main README.md for more information or create an issue in the repository.
