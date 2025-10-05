const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ["pdf", "docx", "doc"],
    required: true,
  },
  rawText: {
    type: String,
    required: true,
  },
  parsedData: {
    name: String,
    email: String,
    phone: String,
    location: String,
    summary: String,
    skills: [String],
    experience: [
      {
        company: String,
        position: String,
        startDate: String,
        endDate: String,
        description: String,
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        graduationDate: String,
      },
    ],
    certifications: [String],
    languages: [String],
  },
  pii: {
    hasEmail: Boolean,
    hasPhone: Boolean,
    hasAddress: Boolean,
    hasSocialSecurity: Boolean,
  },
  embeddings: {
    type: [Number],
    default: [],
  },
  chunks: [
    {
      text: String,
      embedding: [Number],
      startChar: Number,
      endChar: Number,
    },
  ],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

resumeSchema.index({ embeddings: 1 });
resumeSchema.index({ "parsedData.name": "text", rawText: "text" });

module.exports = mongoose.model("Resume", resumeSchema);
