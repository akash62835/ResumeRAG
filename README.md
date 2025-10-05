# Resume Parser & Job Matching Platform

A comprehensive AI-powered resume parsing and job matching platform built with React, Node.js, and MongoDB. This application leverages Google's Gemini AI for intelligent resume parsing and semantic job matching.

## 🚀 Features

### Core Functionality
- **Smart Resume Parsing**: Extract structured data from PDF and DOCX resumes using AI
- **Job Matching**: AI-powered semantic matching between resumes and job descriptions
- **User Authentication**: Secure JWT-based authentication system
- **File Upload**: Drag-and-drop resume upload with support for PDF and DOCX formats
- **Search & Filter**: Advanced search capabilities with semantic similarity matching
- **Candidate Management**: Detailed candidate profiles with parsed resume data

### AI-Powered Features
- **Gemini AI Integration**: Uses Google's Gemini 2.0 Flash for resume data extraction
- **Embedding Generation**: Creates vector embeddings for semantic search
- **Intelligent Matching**: Analyzes job-resume compatibility with detailed insights
- **PII Detection**: Identifies and handles personally identifiable information

### User Interface
- **Modern React UI**: Built with React 18 and Tailwind CSS
- **Responsive Design**: Mobile-friendly interface
- **Dark/Light Theme**: Theme switching capability
- **Interactive Components**: Drag-and-drop file upload, real-time search

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Google Gemini AI** for natural language processing
- **JWT** for authentication
- **Multer** for file uploads
- **PDF-parse** and **Mammoth** for document parsing

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Dropzone** for file uploads

### AI & ML
- **Google Generative AI** (Gemini 2.0 Flash)
- **Vector Embeddings** for semantic search
- **Cosine Similarity** for matching algorithms

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v14 or higher)
- **MongoDB** (local or cloud instance)
- **Google AI API Key** for Gemini
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd resume-parser
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# Database
MONGO_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Server
PORT=5001
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=your_frontend_uri
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Environment Variables

Make sure to set up your environment variables:

- **MongoDB URI**: Connection string to your MongoDB instance
- **JWT Secret**: A secure random string for JWT token signing
- **Gemini API Key**: Get this from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Backend Server**:
```bash
cd backend
npm run dev
```

2. **Start the Frontend** (in a new terminal):
```bash
cd frontend
npm start
```

3. **Access the Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

### Production Mode

1. **Build the Frontend**:
```bash
cd frontend
npm run build
```

2. **Start the Backend**:
```bash
cd backend
npm start
```

## 📁 Project Structure

```
resume-parser/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── models/
│   │   ├── Job.js             # Job schema
│   │   ├── Resume.js          # Resume schema
│   │   └── User.js            # User schema
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── jobs.js            # Job management routes
│   │   ├── resumes.js         # Resume management routes
│   │   └── ask.js             # AI query routes
│   ├── utils/
│   │   ├── embeddings.js      # Vector embedding utilities
│   │   ├── gemini.js          # Gemini AI integration
│   │   └── parser.js          # Resume parsing logic
│   ├── uploads/               # Uploaded files storage
│   └── server.js              # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.js      # Navigation component
│   │   ├── context/
│   │   │   ├── AuthContext.js # Authentication context
│   │   │   └── ThemeContext.js# Theme management
│   │   ├── pages/
│   │   │   ├── Login.js       # Login page
│   │   │   ├── Register.js    # Registration page
│   │   │   ├── Upload.js      # Resume upload page
│   │   │   ├── Search.js      # Search and browse resumes
│   │   │   ├── Jobs.js        # Job management page
│   │   │   └── CandidateDetail.js # Candidate details page
│   │   ├── utils/
│   │   │   └── api.js         # API utility functions
│   │   └── App.js             # Main App component
│   └── public/
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Resume Management
- `POST /api/resumes/upload` - Upload and parse resume
- `GET /api/resumes` - Get all resumes (with search/filter)
- `GET /api/resumes/:id` - Get specific resume
- `DELETE /api/resumes/:id` - Delete resume

### Job Management
- `POST /api/jobs` - Create new job posting
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get specific job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### AI Features
- `POST /api/ask/match` - Analyze job-resume match
- `POST /api/ask/search` - Semantic search resumes

## 🔧 Configuration

### Database Configuration
The application uses MongoDB with the following collections:
- `users` - User accounts and authentication
- `resumes` - Parsed resume data with embeddings
- `jobs` - Job postings with requirements

### AI Configuration
- **Gemini Model**: Uses `gemini-2.0-flash-exp` for text processing
- **Embedding Model**: Uses `text-embedding-004` for vector generation
- **Chunk Size**: 500 tokens with 50 token overlap for text processing

### File Upload
- **Supported Formats**: PDF, DOCX, DOC
- **Max File Size**: Configurable (default: 10MB)
- **Storage**: Local filesystem (configurable for cloud storage)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **PII Detection**: Identifies and redacts personally identifiable information
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Input Validation**: Express-validator for request validation
- **File Type Validation**: Ensures only allowed file types are uploaded

## 🧪 Testing

The project includes test scripts for various functionalities:

```bash
# Test resume parsing
cd backend
node scripts/test_ask_match.js

# Seed test data
node scripts/seed_test_resumes.js
```

## 📈 Performance Considerations

- **Embedding Caching**: Vector embeddings are cached to improve search performance
- **Text Chunking**: Large documents are processed in chunks for better AI processing
- **Database Indexing**: Optimized MongoDB indexes for search queries
- **File Size Limits**: Configurable limits to prevent memory issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the package.json files for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information about your problem
3. Include error logs and steps to reproduce the issue

## 🚀 Deployment

### Environment Setup
- Set production environment variables
- Configure MongoDB connection string
- Set up proper CORS origins
- Configure file storage (local or cloud)

### Build for Production
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

### Docker Deployment (Optional)
```dockerfile
# Add Docker configuration as needed
```

## 📊 Future Enhancements

- [ ] Advanced analytics dashboard
- [ ] Bulk resume processing
- [ ] Integration with job boards
- [ ] Advanced filtering options
- [ ] Export functionality
- [ ] Multi-language support
- [ ] Cloud storage integration
- [ ] Real-time notifications

---

**Built with ❤️ using React, Node.js, and Google Gemini AI**
