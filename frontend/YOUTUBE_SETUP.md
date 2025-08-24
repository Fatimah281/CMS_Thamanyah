# YouTube Integration Setup Guide

## Overview
The CMS now supports integration with Thamanyah's YouTube channel to display real podcasts, documentaries, and lectures.

## Current Status
✅ **Mock Data**: Currently showing sample content with YouTube-style thumbnails  
🔄 **Real Integration**: Ready to connect to actual YouTube API

## Setup Instructions

### 1. Get YouTube API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Copy the API key

### 2. Find Thamanyah's Channel ID
1. Go to Thamanyah's YouTube channel
2. The channel ID is in the URL: `https://www.youtube.com/channel/UC_CHANNEL_ID`
3. Copy the channel ID

### 3. Update Configuration
Update the YouTube service configuration in:
```
frontend/projects/shared/src/lib/services/youtube.service.ts
```

Replace these values:
```typescript
private readonly API_KEY = 'YOUR_YOUTUBE_API_KEY';
private readonly CHANNEL_ID = 'UC_THAMANYAH_CHANNEL_ID';
```

### 4. Enable Real YouTube Integration
In the ProgramService, change:
```typescript
// From mock data
return this.youtubeService.getMockVideos();

// To real YouTube data
return this.youtubeService.getChannelVideos().pipe(
  map(videos => videos.map(video => this.youtubeService.convertToProgram(video)))
);
```

## Features Implemented

### Content Types Supported
- **Podcasts** (بودكاست)
- **Documentaries** (وثائقي)
- **Lectures** (محاضرة)
- **Interviews** (مقابلة)
- **Discussions** (نقاش)

### Automatic Detection
- **Language**: Arabic/English detection
- **Category**: Based on title/description keywords
- **Video Type**: Podcast, documentary, lecture classification
- **Tags**: Automatic tag extraction

### UI Features
- YouTube thumbnails with play overlay
- Video duration badges
- View count and like count display
- Direct YouTube video links
- Responsive grid layout
- Search and filtering

## Current Mock Content
The system currently displays:
1. **Thamanyah Podcast - Episode 1**: Islamic Philosophy
2. **Documentary**: Islamic Architecture History
3. **Lecture**: Modern Islamic Education Challenges

## Next Steps
1. Get YouTube API credentials
2. Update configuration with real channel ID
3. Test with actual Thamanyah content
4. Customize content categorization as needed

## API Quotas
- YouTube Data API v3: 10,000 units/day (free tier)
- Each video fetch: ~1-2 units
- Recommended: Cache results in Firestore

## Security Notes
- Keep API key secure
- Consider server-side proxy for production
- Implement rate limiting
- Monitor API usage
