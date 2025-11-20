# MBTI Personality Test Application

An interactive MBTI (Myers-Briggs Type Indicator) personality test built with React and Node.js, featuring 60 comprehensive questions and detailed personality analysis.

## Features

- **60-Question Assessment**: Comprehensive MBTI test based on the provided question set
- **Detailed Personality Analysis**: Rich personality descriptions with traits, strengths, and insights
- **Modern React UI**: Built with Material-UI for a beautiful, responsive interface
- **Backend API**: Node.js server that processes answers and calculates personality types
- **Real MBTI Data**: Uses authentic personality descriptions and analysis
- **User Accounts**: Email/password signup and login with secure session cookies
- **Google Sign-In**: Optional single-click login powered by Google Identity Services
- **Major Matching (Premium)**: Import majors and mappings from spreadsheets and calculate personalized recommendations

## Tech Stack

### Frontend

- React 18 with TypeScript
- Material-UI (MUI) for components and styling
- React Router for navigation

### Backend

- Node.js with Express
- MongoDB (Mongoose) for persistent storage
- JWT auth with httpOnly cookies
- CORS enabled for local development

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables (optional but recommended)**
   Create a `.env` file in the project root:

   ```bash
   JWT_SECRET=change_me_in_production
   MONGODB_URI=mongodb://127.0.0.1:27017/major_match
   PORT=3001
   # Google Identity Services (required for Google Sign-In)
   GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
   REACT_APP_GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
   # OpenAI
   OPENAI_API_KEY=sk-...
   ```

   Both Google values must match the same OAuth client configured in the Google Cloud Console.

3. **Start the backend server**

   ```bash
   npm run server
   ```

   The server will start on `http://localhost:3001`

4. **Start the React frontend** (in a new terminal)
   ```bash
   npm start
   ```
   The React app will start on `http://localhost:3000`

### Alternative: Development Mode

You can run both frontend and backend simultaneously:

```bash
# Terminal 1: Backend
npm run server-dev

# Terminal 2: Frontend
npm start
```

## Project Structure

```
majorMatch/
├── src/                    # React frontend source
│   ├── pages/
│   │   ├── PersonalityTest.tsx      # MBTI test interface
│   │   ├── PersonalityResults.tsx   # Results display
│   │   ├── MajorMatchingTest.tsx    # Premium Major Matching test
│   │   ├── MajorMatchingResults.tsx # Premium results
│   │   ├── Login.tsx                 # Login page
│   │   └── SignUp.tsx                # Signup page
│   ├── App.tsx
│   └── index.tsx
├── server.js               # Express backend server
├── MBTI Questions.txt      # Optional: legacy local file, not used by Mongo backend
├── PersonalitiesDisplay.txt       # Personality data (display + seed source)
├── package.json
└── README.md
```

## API Endpoints

### MBTI

- `GET /api/questions` — Returns all MBTI questions
- `POST /api/calculate` — Calculates personality type from answers
  - Body:
    ```json
    { "answers": [{ "questionId": 1, "value": 4 }] }
    ```
  - Response:
    ```json
    { "type": "INFP-T", "personality": { "type": "INFP-T", "content": "..." } }
    ```
- `GET /api/personality/:type` — Returns detailed information for a specific personality type

### Auth

- `POST /api/auth/signup` — Create account
  - Body: `{ firstName, lastName, email, password, university? }`
  - Sets a secure httpOnly cookie `token`
- `POST /api/auth/login` — Sign in
  - Body: `{ email, password }`
  - Sets a secure httpOnly cookie `token`
- `POST /api/auth/google` — Sign in with Google ID token
  - Body: `{ credential }` where `credential` is the JWT from Google Identity Services
  - Sets a secure httpOnly cookie `token`
- `POST /api/auth/logout` — Clears session cookie
- `GET /api/me` — Returns current user profile (requires auth)

### Admin APIs to load data

- `POST /api/admin/mbti/questions/bulk` — Replace MBTI questions with the provided array
- `POST /api/admin/mbti/personalities/bulk` — Replace MBTI personalities
- `POST /api/admin/personality/reload` — Reload personalities from "PersonalitiesDisplay.txt" file (updates existing records)
- `POST /api/admin/majors/bulk` — Replace majors master list
- `POST /api/admin/mapping/bulk` — Replace major mapping data
- `POST /api/major/calculate` — Calculate major matches
  - Body: `{ "answers": { "1": "<option text>", "2": "<option text>" } }`
  - Response: `{ results: [ { name, match, description, averageSalary, jobOutlook, workEnvironment } ] }`

### AI Chat

- `POST /api/chat` — Sends chat messages to OpenAI and returns assistant reply (requires auth)
  - Body:
    ```json
    {
      "messages": [{ "role": "user", "content": "What majors fit an INFP?" }],
      "model": "gpt-4o-mini",
      "temperature": 0.7
    }
    ```
  - Response:
    ```json
    { "reply": "...assistant message..." }
    ```

Set `OPENAI_API_KEY` in `.env` and restart the backend server.

> Notes:
>
> - Mapping matches on the selected option text (case-insensitive). If the same option maps to multiple majors, scores are accumulated.
> - Results are normalized to 0–100% based on the top score.

## How It Works

1. **Questions Loading**: Frontend fetches 60 MBTI questions from the backend API
2. **Test Taking**: Users answer questions on a 5-point scale (Strongly Disagree to Strongly Agree)
3. **Scoring**: Backend calculates scores with center-weighted logic (Neutral = 0, 1/5 = ±2, 2/4 = ±1)
4. **Results**: Detailed personality analysis with traits, strengths, and insights
5. **Major Matching**: Premium test collects preferences; backend tallies scores using imported mapping and majors

## Importing Majors and Mappings

You can import your provided spreadsheets using curl or Postman.

```bash
# Example payloads (use admin bulk endpoints)
curl -X POST http://localhost:3001/api/admin/mbti/questions/bulk -H "Content-Type: application/json" -d '{"questions":[{"id":1,"text":"You enjoy social gatherings.","dimension":"IE","direction":"E"}]}'

curl -X POST http://localhost:3001/api/admin/mbti/personalities/bulk -H "Content-Type: application/json" -d '{"personalities":[{"type":"INFP-T","content":"Default INFP-T description."}]}'
```

After importing, run the Major Matching test in the UI. Results will be computed from your data.

## Personality Types Supported

All 32 MBTI types are supported (16 base types × 2 identity variants):

**Analysts**: INTJ, INTP, ENTJ, ENTP  
**Diplomats**: INFJ, INFP, ENFJ, ENFP  
**Sentinels**: ISTJ, ISFJ, ESTJ, ESFJ  
**Explorers**: ISTP, ISFP, ESTP, ESFP

Each with Assertive (-A) and Turbulent (-T) variants.

## Development Notes

- Requires MongoDB running locally or in the cloud (`MONGODB_URI`)
- Auth uses httpOnly cookies; requests from the frontend use CRA proxy so cookies work in development
- MBTI results are saved to the database when a user is logged in
- Major test submissions are saved when a user is logged in

## Deployment

On Windows (PowerShell), deploy with one command:

```bash
npm run deploy
```

This builds the frontend into `build/` and reloads the Node.js server via pm2 if available.

First-time setup (recommended):

```bash
npm i -g pm2
npm run pm2:start
pm2 save
pm2 startup
```

Other useful commands:

```bash
# Build only (no restart)
npm run deploy:build

# CI-style fresh install + build + reload
npm run deploy:ci

# Manually reload if using pm2
npm run pm2:reload
```

Notes:

- Ensure production env vars exist (e.g., `.env` or system env): `JWT_SECRET`, `MONGODB_URI`, `PORT`, optional `STRIPE_*`, `OPENAI_API_KEY`, `SMTP_*`.
- If your frontend is hosted on a different domain than the API, update `allowedOrigins` in `server.js` to include your domain.
- Backend or env changes require a server restart. Frontend-only changes require only a rebuild.

## License

This project is part of the Major Match platform. Please refer to the main project license.

---
