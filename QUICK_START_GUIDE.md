# Live Quiz Sessions - Quick Start Guide

## 🚀 Current Status

Both servers are already running:
- **Backend**: http://localhost:8000 ✅
- **Frontend**: http://localhost:3000 ✅
- **Database**: Tables created ✅

## 📝 Quick Test (5 Minutes)

### Step 1: Generate a Quiz (Teacher View)

1. Open browser: http://localhost:3000/quiz

2. **Generate quiz questions:**
   - Select one or more notes (or use all notes)
   - Choose difficulty: medium
   - Choose question count: 5
   - Click "Generate & Start Quiz"
   - Wait for Gemini to create questions (~10 seconds)

### Step 2: Create Live Quiz Session

3. **After questions are generated:**
   - You'll see two options:
     - "Start Practice Quiz" (take it yourself)
     - "Create Live Quiz" ← Click this!

4. **Configure the session:**
   - Title: "Test Quiz Session"
   - Expiry: 1 hour (default)
   - Leave other options as default
   - Click "Create Session"

5. **Copy the share link:**
   - You'll see a large **JOIN CODE** (e.g., "XYZ789")
   - And a shareable URL
   - Click "Copy" to copy the URL
   - Note: The "View Dashboard" button opens the teacher view

### Step 3: Student Joins (Different Browser)

6. **Open an incognito window or different browser**

7. **Join the quiz:**
   - Paste the copied URL
   - Or manually go to: `http://localhost:3000/quiz/join/{token}`
   - Enter name: "Test Student"
   - Click "Join Quiz"

8. **Take the quiz:**
   - Answer all 5 questions (just click any answers)
   - Click "Next" to proceed through questions
   - On last question, click "Submit Quiz"

9. **View results:**
   - See your score immediately
   - See which answers were correct/incorrect
   - View explanations for each question
   - See your rank on the leaderboard (you're #1!)

### Step 4: View Teacher Dashboard

10. **In the original browser window:**
    - Click "View Dashboard" from the modal
    - Or go to: `http://localhost:3000/quiz/dashboard/{token}`

11. **Monitor in real-time:**
    - See total participants: 1
    - See submitted count: 1
    - View leaderboard with student's score
    - Notice it auto-refreshes every 5 seconds

### Step 5: Test Multiple Students

12. **Open 2-3 more incognito windows**
    - Join with different names
    - Take the quiz with different answers
    - Submit at different times
    - Watch the dashboard update automatically
    - See rankings adjust based on scores

## 🎯 Test Scenarios

### Test Expiry (Optional)

1. Create a new session with **30 minute** expiry
2. In database, manually set `expires_at` to a past date:
   ```bash
   sqlite3 backend/studymate.db
   UPDATE quiz_sessions SET expires_at = '2020-01-01 00:00:00' WHERE id = {session_id};
   .quit
   ```
3. Try to join the session
4. Should see "This quiz session has expired" message

### Test Participant Limit (Optional)

1. Create a session with **max 2 participants**
2. Join with 2 different students (complete the quiz)
3. Try to join with a 3rd student
4. Should see "Session is full" message

### Test Close Session

1. From teacher dashboard, click "Close Session"
2. Confirm the action
3. Try joining with a new student
4. Should see "Session has been closed" message

## 📱 Test on Mobile

1. Make sure your computer and phone are on the same network
2. Find your computer's local IP: `ipconfig` (look for IPv4)
3. On your phone, open: `http://{YOUR_IP}:3000/quiz/join/{token}`
4. Join and take the quiz
5. Verify responsive design works well

## 🔍 Verify in Database

Check the data was saved correctly:

```powershell
cd backend
sqlite3 studymate.db

# View sessions
SELECT id, title, join_code, status, expires_at FROM quiz_sessions;

# View attempts
SELECT id, session_id, participant_name, score, percentage, rank, submitted_at FROM quiz_attempts;

# Exit
.quit
```

## ⚙️ Environment Configuration

### Local Development (Current)

**Backend** (`.env`):
```env
GEMINI_API_KEY=your_key_here
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`lib/api.ts`):
```typescript
export const API_BASE = "http://localhost:8000/api";
```

### Production Deployment

**Backend** (`.env`):
```env
GEMINI_API_KEY=your_production_key
FRONTEND_URL=https://studymet.yourdomain.com
```

**Backend** (`main.py`):
```python
# Update CORS
allow_origins=[os.getenv("FRONTEND_URL")]
```

**Frontend** (`lib/api.ts`):
```typescript
export const API_BASE = "https://api.yourdomain.com/api";
```

## 🐛 Common Issues

### Backend not responding

```powershell
# Check if running
netstat -ano | findstr :8000

# Restart
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend not loading

```powershell
# Check if running
netstat -ano | findstr :3000

# Restart
cd frontend
npm run dev
```

### "Quiz generation failed"

- Check Gemini API key in `backend/.env`
- Check backend logs for errors
- Verify notes have extracted text content

### Share link doesn't work

- Ensure full URL is copied including the token
- Check browser console for errors
- Verify backend is accessible at port 8000

## 📊 Features to Test

- [x] Quiz generation with Gemini AI
- [x] Create live quiz session
- [x] Share link generation
- [x] Join code display
- [x] Student join with name only
- [x] Quiz taking interface
- [x] Answer submission
- [x] Score calculation (server-side)
- [x] Results display with explanations
- [x] Leaderboard with rankings
- [x] Teacher dashboard
- [x] Real-time updates (polling)
- [x] Session expiry validation
- [x] Participant limit enforcement
- [x] Session closure
- [x] Copy/share functionality
- [x] Responsive design
- [x] UTC timestamp handling
- [x] Rank calculation with ties

## 🎉 Success Criteria

You've successfully tested the system when:

1. ✅ You can generate quizzes from notes
2. ✅ You can create a live quiz session
3. ✅ Students can join without accounts
4. ✅ Multiple students can take the quiz simultaneously
5. ✅ Scores are calculated correctly
6. ✅ Leaderboard ranks students properly
7. ✅ Dashboard shows real-time statistics
8. ✅ Expired/closed sessions block new joins
9. ✅ All data persists in the database
10. ✅ UI is responsive on mobile devices

## 📖 Documentation

Full documentation available in:
- `LIVE_QUIZ_SESSIONS_IMPLEMENTATION.md` - Complete technical details
- `LIVE_COMPETITION_FINAL_SUMMARY.md` - Live competition feature (separate)

## 🚀 Next Steps

1. **Test locally** using this guide
2. **Deploy to production** with proper environment variables
3. **Test with real students** (10-20 users)
4. **Monitor performance** and database size
5. **Gather feedback** and iterate

---

**Need Help?**

Check the logs:
- Backend: Terminal running uvicorn
- Frontend: Terminal running npm run dev
- Browser: Developer Console (F12)

Verify database:
```bash
sqlite3 backend/studymate.db
.tables
SELECT * FROM quiz_sessions;
.quit
```
