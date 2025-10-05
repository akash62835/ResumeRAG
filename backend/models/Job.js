const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: String,
    required: true,
  },
  structuredRequirements: {
    skills: [String],
    experience: {
      minYears: Number,
      maxYears: Number,
    },
    education: [String],
    certifications: [String],
    mustHave: [String],
    niceToHave: [String],
  },
  location: String,
  salary: {
    min: Number,
    max: Number,
    currency: String,
  },
  embeddings: {
    type: [Number],
    default: [],
  },
  status: {
    type: String,
    enum: ["open", "closed", "draft"],
    default: "open",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

jobSchema.index({ embeddings: 1 });
jobSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Job", jobSchema);
