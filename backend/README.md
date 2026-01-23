# AEO Suite Backend v2.0

Backend API for the Answer Engine Optimization (AEO) Audit Suite - a SaaS web application that analyzes websites for AI-powered search engine optimization.

## Overview

This backend provides a unified API endpoint that runs 5 comprehensive analyzers:

1. **Technical Foundation** (25% weight) - Schema markup, crawlability, HTML structure
2. **Content Structure** (25% weight) - Readability, Q&A patterns, factual density
3. **Page-Level E-E-A-T** (20% weight) - Experience, Expertise, Authoritativeness, Trustworthiness
4. **Query Match** (15% weight) - Keyword presence, answer positioning, semantic relevance
5. **AI Visibility** (15% weight) - Citation potential, structured answers, AI accessibility

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Email**: Resend
- **CRM**: HubSpot
- **Authentication**: OTP-based via email
- **Session**: Express-session with MongoDB store

## Project Structure

```
aeo-backend-v2/
├── analyzers/
│   ├── index.js                 # Main orchestrator
│   ├── technicalFoundation.js   # Analyzer 1
│   ├── contentStructure.js      # Analyzer 2
│   ├── pageLevelEEAT.js        # Analyzer 3
│   ├── queryMatch.js           # Analyzer 4
│   └── aiVisibility.js         # Analyzer 5
├── models/
│   ├── User.js                 # User schema
│   ├── Analysis.js             # Analysis results schema
│   ├── Usage.js                # Daily usage tracking
│   ├── OTP.js                  # OTP verification
│   ├── Stats.js                # Global statistics
│   └── index.js                # Models export
├── middleware/
│   └── auth.js                 # Auth & rate limiting
├── utils/
│   ├── shared.js               # Shared utility functions
│   └── pageFetcher.js          # Web scraping utilities
├── server.js                   # Main Express server
├── package.json
├── .env.example
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   cd /path/to/aeo-backend-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

See `.env.example` for all required variables:

- `MONGODB_URI` - MongoDB Atlas connection string
- `RESEND_API_KEY` - Resend email service API key
- `HUBSPOT_API_KEY` - HubSpot private app token
- `SESSION_SECRET` - Secret for session encryption
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

## API Endpoints

### Authentication

#### Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "country": "United States",
  "phone": "+1234567890"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### Get Session
```http
GET /api/auth/session
```

#### Logout
```http
POST /api/auth/logout
```

### Analysis

#### Run Complete Analysis
```http
POST /api/analyze
Content-Type: application/json

{
  "url": "https://example.com/page",
  "targetKeywords": ["keyword1", "keyword2"],
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "analysisId": "507f1f77bcf86cd799439011",
  "results": {
    "url": "https://example.com/page",
    "overallScore": 75,
    "overallGrade": "C",
    "analyzers": {
      "technicalFoundation": { "score": 80, "grade": "B", ... },
      "contentStructure": { "score": 70, "grade": "C", ... },
      "pageLevelEEAT": { "score": 65, "grade": "D", ... },
      "queryMatch": { "score": 85, "grade": "B", ... },
      "aiVisibility": { "score": 72, "grade": "C", ... }
    },
    "recommendations": [...],
    "processingTime": 3452
  },
  "usage": {
    "current": 3,
    "limit": 10,
    "remaining": 7
  }
}
```

#### Get Analysis History
```http
GET /api/analyses
```

### Health Check
```http
GET /api/health
```

## Rate Limiting

- **API endpoints**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 10 requests per 15 minutes per IP

## Usage Limits

- **Anonymous users**: 3 analyses per day
- **Registered users**: 10 analyses per day (after email verification)
- **Subscribers**: Unlimited analyses

## Database Models

### User
- Email (unique)
- Name, country, phone
- Verification status
- Subscription details
- Daily limit

### Analysis
- User reference
- URL analyzed
- Target keywords
- Overall score (weighted)
- Individual analyzer results
- Recommendations
- Processing time

### Usage
- User reference
- Date (Dubai timezone midnight)
- Analysis count
- Individual analysis records

### OTP
- Email
- OTP code (6 digits)
- Expiration (10 minutes)
- Verification attempts (max 5)

### Stats
- Daily metrics
- Average scores
- Top URLs analyzed
- Conversion metrics

## Scoring System

### Overall Score (0-100)
Weighted average of 5 analyzers:
- Technical Foundation: 25%
- Content Structure: 25%
- Page-Level E-E-A-T: 20%
- Query Match: 15%
- AI Visibility: 15%

### Grading Scale
- A: 90-100
- B: 80-89
- C: 70-79
- D: 60-69
- F: 0-59

## Development

### Running Tests
```bash
npm test
```

### Code Style
- ES6+ JavaScript
- Async/await for promises
- Error handling with try/catch
- Meaningful variable names
- Comments for complex logic

## Deployment

### DigitalOcean App Platform

1. Push code to GitHub
2. Create new app in DigitalOcean
3. Link GitHub repository
4. Set environment variables
5. Deploy

### Environment Variables (Production)
- Set `NODE_ENV=production`
- Use strong `SESSION_SECRET`
- Configure MongoDB Atlas IP whitelist
- Set `FRONTEND_URL` to production domain

## Monitoring

- Check `/api/health` for uptime
- Monitor MongoDB Atlas metrics
- Review application logs
- Track daily stats in database

## Security

- Helmet.js for security headers
- MongoDB sanitization to prevent injection
- Rate limiting on all endpoints
- Session-based authentication
- CORS configuration
- HTTPS required in production

## Support

For issues or questions:
- Email: support@thatworkx.com
- GitHub: jessgeo-personal/tw-aeo-suite-v2

## License

Proprietary - Thatworkx Solutions © 2026
