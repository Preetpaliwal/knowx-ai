# StudyMate AI Backend

FastAPI backend for the StudyMate AI study assistant application.

## Features

- File upload (PDF, DOCX, TXT)
- Text extraction from uploaded files
- SQLite database storage
- RESTful API endpoints
- Gemini-powered answers grounded in uploaded notes
- CORS enabled for frontend integration

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── database.py          # Database configuration and session management
├── models.py            # SQLAlchemy models
├── requirements.txt     # Python dependencies
├── routes/
│   ├── __init__.py     # Routes package
│   └── notes.py        # Notes endpoints
├── uploads/            # Uploaded files directory (created automatically)
└── studymate.db        # SQLite database (created automatically)
```

## API Endpoints

### Health Check
- `GET /` - API status and version
- `GET /health` - Health check

### Notes
- `POST /api/notes/upload` - Upload a study note file
- `GET /api/notes` - Get all notes (with pagination)
- `GET /api/notes/{note_id}` - Get a specific note
- `DELETE /api/notes/{note_id}` - Delete a specific note

### Chat
- `POST /api/chat` - Ask a question answered using uploaded notes and Gemini

## Setup Instructions

### 1. Install Python

Make sure you have Python 3.8 or higher installed:
```bash
python --version
```

### 2. Navigate to Backend Directory

```bash
cd c:\Users\preet\OneDrive\Desktop\StudyMET\backend
```

### 3. Create Virtual Environment (Recommended)

```bash
python -m venv venv
```

### 4. Activate Virtual Environment

```bash
venv\Scripts\activate
```

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

### 6. Configure Gemini

Copy `backend/.env.example` to `backend/.env` and add your Gemini API key from Google AI Studio:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The key is loaded only by the backend and is never sent to the frontend. Keep the real key in `backend/.env`; never commit it.

### 7. Run the Backend Server

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at: **http://localhost:8000**

## Chat Request

**URL**: `POST /api/chat`

**Request**:
```json
{"question": "Explain this topic"}
```

**Response**:
```json
{
  "answer": "...",
  "source_notes": ["My Study Notes"]
}
```

Answers are restricted to the extracted content of uploaded notes. The API returns an error when the question is empty, no notes exist, the API key is missing, or Gemini fails.

## API Documentation

Once the server is running, you can access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## File Upload Specifications

### Allowed File Types
- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Plain Text (`.txt`)

### File Size Limit
- Maximum: 10 MB

### Upload Endpoint Details

**URL**: `POST /api/notes/upload`

**Request**:
- Content-Type: `multipart/form-data`
- Field name: `file`

**Response** (Success):
```json
{
  "status": "success",
  "message": "File uploaded successfully",
  "note": {
    "id": "1",
    "title": "My Study Notes",
    "fileName": "notes.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "excerpt": "This is a preview of the content...",
    "content": "Full extracted text content...",
    "date": "Sep 12",
    "createdAt": "2026-09-12T10:30:00",
    "updatedAt": "2026-09-12T10:30:00"
  }
}
```

**Response** (Error):
```json
{
  "detail": "Error message here"
}
```

## Database Schema

### Notes Table

| Column      | Type     | Description                    |
|-------------|----------|--------------------------------|
| id          | Integer  | Primary key                    |
| title       | String   | Note title                     |
| file_name   | String   | Original filename              |
| file_path   | String   | Path to uploaded file          |
| file_type   | String   | MIME type                      |
| file_size   | Float    | File size in bytes             |
| content     | Text     | Extracted text content         |
| excerpt     | String   | Short preview (200 chars)      |
| created_at  | DateTime | Creation timestamp             |
| updated_at  | DateTime | Last update timestamp          |

## Text Extraction

### PDF Files
- Uses `pypdf` library
- Extracts text from all pages
- Handles multi-page documents

### DOCX Files
- Uses `python-docx` library
- Extracts text from paragraphs
- Preserves document structure

### TXT Files
- Direct text reading
- UTF-8 encoding (fallback to Latin-1)
- Handles various text encodings

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (default frontend)
- `http://localhost:3001` (alternative frontend port)

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid file, size limit exceeded)
- `404` - Not Found (note doesn't exist)
- `500` - Internal Server Error

## Development

### Reload on Changes

The server runs with auto-reload enabled. Changes to Python files will automatically restart the server.

### Database Reset

To reset the database, simply delete the `studymate.db` file:
```bash
del studymate.db
```

The database will be recreated on the next server start.

### View Database

You can use SQLite browser tools to view the database:
- DB Browser for SQLite: https://sqlitebrowser.org/

## Troubleshooting

### Port Already in Use
If port 8000 is already in use, stop the existing process or use a different port:
```bash
uvicorn main:app --reload --port 8001
```

### Module Not Found
Make sure the virtual environment is activated and dependencies are installed:
```bash
venv\Scripts\activate
pip install -r requirements.txt
```

### CORS Errors
If you're running the frontend on a different port, add it to the `allow_origins` list in `main.py`:
```python
allow_origins=["http://localhost:3000", "http://localhost:YOUR_PORT"],
```

## Testing with curl

### Upload a file:
```bash
curl -X POST "http://localhost:8000/api/notes/upload" -F "file=@path/to/your/file.pdf"
```

### Get all notes:
```bash
curl "http://localhost:8000/api/notes"
```

### Get specific note:
```bash
curl "http://localhost:8000/api/notes/1"
```

### Delete note:
```bash
curl -X DELETE "http://localhost:8000/api/notes/1"
```

## Production Deployment

For production, consider:
1. Using a production-grade database (PostgreSQL, MySQL)
2. Setting up proper environment variables
3. Using a production ASGI server configuration
4. Implementing authentication and authorization
5. Setting up proper logging
6. Using cloud storage for uploaded files
7. Implementing rate limiting
8. Adding file scanning for security

## License

Part of the StudyMate AI project.
