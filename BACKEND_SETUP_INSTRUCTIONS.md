# StudyMate AI Backend Setup Instructions

## ✅ Backend Created Successfully!

The complete FastAPI backend has been created in:
```
c:\Users\preet\OneDrive\Desktop\StudyMET\backend\
```

## 📁 Project Structure

```
StudyMET/
├── frontend/           # Next.js frontend (existing)
└── backend/            # FastAPI backend (NEW)
    ├── main.py         # FastAPI application entry point
    ├── database.py     # Database configuration
    ├── models.py       # SQLAlchemy models
    ├── requirements.txt # Python dependencies
    ├── README.md       # Backend documentation
    ├── .gitignore      # Git ignore rules
    ├── start_backend.bat # Easy startup script (Windows)
    ├── routes/
    │   ├── __init__.py
    │   └── notes.py    # Notes API endpoints
    └── uploads/        # Uploaded files directory
        └── .gitkeep
```

## 🚀 Quick Start (Windows)

### Option 1: Using the Batch File (Easiest)

1. Open File Explorer
2. Navigate to: `c:\Users\preet\OneDrive\Desktop\StudyMET\backend\`
3. Double-click `start_backend.bat`
4. The script will:
   - Create virtual environment
   - Install dependencies
   - Start the server

### Option 2: Manual Setup (Step by Step)

Open Command Prompt or PowerShell and follow these commands:

#### Step 1: Navigate to Backend Directory
```cmd
cd c:\Users\preet\OneDrive\Desktop\StudyMET\backend
```

#### Step 2: Create Virtual Environment
```cmd
python -m venv venv
```

#### Step 3: Activate Virtual Environment
```cmd
venv\Scripts\activate
```

You should see `(venv)` at the start of your command prompt.

#### Step 4: Install Dependencies
```cmd
pip install -r requirements.txt
```

This will install:
- FastAPI 0.115.5
- Uvicorn 0.32.1
- SQLAlchemy 2.0.36
- pypdf 5.1.0
- python-docx 1.1.2
- python-multipart 0.0.18

#### Step 5: Start the Backend Server
```cmd
python main.py
```

Or alternatively:
```cmd
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## ✨ Server Information

Once started, the backend will be available at:

- **Base URL**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **API Documentation (ReDoc)**: http://localhost:8000/redoc

## 📡 API Endpoints

### Upload Note
```
POST /api/notes/upload
Content-Type: multipart/form-data
Field name: file
```

### Get All Notes
```
GET /api/notes
Query params: ?skip=0&limit=100
```

### Get Single Note
```
GET /api/notes/{note_id}
```

### Delete Note
```
DELETE /api/notes/{note_id}
```

## 🧪 Testing the Backend

### Test 1: Health Check
Open browser and visit: http://localhost:8000

Expected response:
```json
{
  "message": "StudyMate AI Backend API",
  "version": "1.0.0",
  "status": "running"
}
```

### Test 2: Upload via Frontend
1. Start the frontend: `cd ..\frontend && npm run dev`
2. Open http://localhost:3000
3. Click "Upload Notes" button
4. Upload a PDF, DOCX, or TXT file
5. Check backend console for upload logs

### Test 3: View API Documentation
Visit http://localhost:8000/docs to see interactive API documentation

## 🔧 Features Implemented

### ✅ File Upload
- Accepts PDF, DOCX, TXT files
- Maximum file size: 10 MB
- Validates file type and size
- Saves files to `uploads/` directory
- Generates unique filenames with timestamps

### ✅ Text Extraction
- **PDF**: Uses `pypdf` to extract text from all pages
- **DOCX**: Uses `python-docx` to extract paragraphs
- **TXT**: Direct text reading with UTF-8/Latin-1 fallback

### ✅ Database Storage
- SQLite database: `studymate.db`
- SQLAlchemy ORM models
- Stores:
  - File metadata (name, type, size)
  - Extracted text content
  - Excerpt (200 char preview)
  - Timestamps (created_at, updated_at)

### ✅ CORS Configuration
- Enabled for `http://localhost:3000` (frontend)
- Enabled for `http://localhost:3001` (alternative port)
- Allows all methods and headers

### ✅ Error Handling
- File type validation
- File size validation
- Text extraction errors
- Database errors
- Proper HTTP status codes

## 📝 Database Schema

```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size FLOAT NOT NULL,
    content TEXT,
    excerpt VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Running Frontend + Backend Together

### Terminal 1 (Backend):
```cmd
cd c:\Users\preet\OneDrive\Desktop\StudyMET\backend
venv\Scripts\activate
python main.py
```

### Terminal 2 (Frontend):
```cmd
cd c:\Users\preet\OneDrive\Desktop\StudyMET\frontend
npm run dev
```

Now visit http://localhost:3000 and test the upload functionality!

## 🐛 Troubleshooting

### Problem: "python is not recognized"
**Solution**: Install Python from https://www.python.org/downloads/
Make sure to check "Add Python to PATH" during installation.

### Problem: "Port 8000 is already in use"
**Solution**: Either stop the existing process or use a different port:
```cmd
uvicorn main:app --reload --port 8001
```
Then update frontend API endpoint to use port 8001.

### Problem: "Module not found"
**Solution**: Make sure virtual environment is activated:
```cmd
venv\Scripts\activate
pip install -r requirements.txt
```

### Problem: "CORS error in browser"
**Solution**: Make sure backend is running and CORS is configured correctly in `main.py`.
Check that your frontend URL is in the `allow_origins` list.

### Problem: "Permission denied" when saving files
**Solution**: Make sure the `uploads/` directory exists and has write permissions.

### Problem: Database locked
**Solution**: Close any database browsers or tools accessing `studymate.db` and restart the server.

## 📊 Viewing the Database

You can view the SQLite database using:

1. **DB Browser for SQLite**: https://sqlitebrowser.org/
   - Download and install
   - Open `studymate.db` file
   
2. **VS Code SQLite Extension**
   - Install "SQLite" extension
   - Right-click `studymate.db` → Open Database

## 🔍 Checking Uploaded Files

Uploaded files are stored in:
```
c:\Users\preet\OneDrive\Desktop\StudyMET\backend\uploads\
```

Files are saved with timestamps:
```
20260912_103045_my_notes.pdf
20260912_103125_chemistry_notes.docx
```

## 📈 What Happens When You Upload a File

1. Frontend sends file to `POST /api/notes/upload`
2. Backend validates file type and size
3. File is saved to `uploads/` directory with unique name
4. Text is extracted based on file type:
   - PDF → pypdf extracts text from pages
   - DOCX → python-docx extracts paragraphs
   - TXT → direct text reading
5. Title is generated from filename
6. Excerpt (200 chars) is created from content
7. Note record is created in database
8. Success response sent to frontend
9. Frontend refreshes notes list
10. New note appears on dashboard

## 🛑 Stopping the Server

In the terminal where the server is running:
- Press `Ctrl + C`
- Or close the terminal window

## 🔄 Restarting After Changes

If you modify the Python code:
1. Stop the server (`Ctrl + C`)
2. Run `python main.py` again

OR use `--reload` flag (auto-restarts on changes):
```cmd
uvicorn main:app --reload
```

## 📚 Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **SQLAlchemy Documentation**: https://docs.sqlalchemy.org/
- **pypdf Documentation**: https://pypdf.readthedocs.io/
- **python-docx Documentation**: https://python-docx.readthedocs.io/

## ✅ Next Steps

1. Start the backend server
2. Start the frontend server
3. Test file upload functionality
4. Check database to see stored notes
5. View uploaded files in `uploads/` directory

## 🎉 You're All Set!

The backend is ready to work with your frontend. Upload some study notes and see them appear in your dashboard!
