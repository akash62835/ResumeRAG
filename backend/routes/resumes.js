const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const AdmZip = require("adm-zip");
const Resume = require("../models/Resume");
const { protect, isRecruiter } = require("../middleware/auth");
const {
  parsePDF,
  parseDOCX,
  parseResumeText,
  redactPII,
} = require("../utils/parser");
const { generateEmbedding, chunkText } = require("../utils/embeddings");

const router = express.Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".docx", ".doc", ".zip"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOCX, and ZIP are allowed."));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post("/", protect, upload.array("resumes", 20), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        if (path.extname(file.originalname).toLowerCase() === ".zip") {
          const zip = new AdmZip(file.path);
          const zipEntries = zip.getEntries();

          for (const entry of zipEntries) {
            if (!entry.isDirectory) {
              const ext = path.extname(entry.entryName).toLowerCase();
              if ([".pdf", ".docx", ".doc"].includes(ext)) {
                const buffer = entry.getData();
                const result = await processResume(
                  buffer,
                  entry.entryName,
                  ext,
                  req.userId
                );
                results.push(result);
              }
            }
          }

          await fs.unlink(file.path);
        } else {
          const buffer = await fs.readFile(file.path);
          const result = await processResume(
            buffer,
            file.originalname,
            path.extname(file.originalname).toLowerCase(),
            req.userId
          );
          results.push(result);
        }
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
        errors.push({ file: file.originalname, error: error.message });
      }
    }

    const isRecruiterUser =
      req.user.role === "recruiter" || req.user.role === "admin";
    const responseResumes = results.map((r) => {
      const out = { ...r };
      if (!isRecruiterUser && out.parsedData) {
        out.parsedData = redactPII(out.parsedData);
      }
      return out;
    });

    res.status(201).json({
      success: true,
      processed: results.length,
      errors: errors.length,
      resumes: responseResumes,
      errorDetails: errors,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload resumes" });
  }
});

async function processResume(buffer, originalName, fileType, uploadedBy) {
  let rawText = "";

  if (fileType === ".pdf") {
    rawText = await parsePDF(buffer);
  } else if ([".docx", ".doc"].includes(fileType)) {
    rawText = await parseDOCX(buffer);
  }

  const { parsedData, pii } = await parseResumeText(rawText);

  const embeddings = await generateEmbedding(rawText.substring(0, 8000));

  const textChunks = chunkText(rawText);
  const chunks = [];
  const limitedChunks = textChunks.slice(0, 10);
  for (const chunk of limitedChunks) {
    const chunkEmbedding = await generateEmbedding(chunk.text);
    chunks.push({
      text: chunk.text,
      embedding: chunkEmbedding,
      startChar: chunk.startChar,
      endChar: chunk.endChar,
    });
  }

  const resume = new Resume({
    filename: `${Date.now()}-${originalName}`,
    originalName,
    fileType: fileType.substring(1),
    rawText,
    parsedData,
    pii,
    embeddings,
    chunks,
    uploadedBy,
  });

  await resume.save();

  return {
    id: resume._id,
    originalName: resume.originalName,
    parsedData: resume.parsedData,
  };
}

router.get("/", protect, async (req, res) => {
  try {
    const { limit = 10, offset = 0, q = "" } = req.query;

    let query = {};

    if (q) {
      query = {
        $or: [
          { "parsedData.name": { $regex: q, $options: "i" } },
          { "parsedData.skills": { $regex: q, $options: "i" } },
          { rawText: { $regex: q, $options: "i" } },
        ],
      };
    }

    const total = await Resume.countDocuments(query);
    const resumes = await Resume.find(query)
      .select("-rawText -embeddings -chunks")
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ uploadedAt: -1 });

    const isRecruiterUser =
      req.user.role === "recruiter" || req.user.role === "admin";
    const processedResumes = resumes.map((resume) => {
      const resumeObj = resume.toObject();
      if (!isRecruiterUser && resume.pii) {
        resumeObj.parsedData = redactPII(resumeObj.parsedData);
      }
      return resumeObj;
    });

    res.json({
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      resumes: processedResumes,
    });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const resumeObj = resume.toObject();

    const isRecruiterUser =
      req.user.role === "recruiter" || req.user.role === "admin";
    if (!isRecruiterUser && resume.pii) {
      resumeObj.parsedData = redactPII(resumeObj.parsedData);
    }

    delete resumeObj.embeddings;
    delete resumeObj.chunks;

    res.json(resumeObj);
  } catch (error) {
    console.error("Error fetching resume:", error);
    res.status(500).json({ error: "Failed to fetch resume" });
  }
});

module.exports = router;
