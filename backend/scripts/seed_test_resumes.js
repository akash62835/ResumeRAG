const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Resume = require("../models/Resume");
const { generateEmbedding, chunkText } = require("../utils/embeddings");

async function main() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/resume-parser",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );

  console.log("Connected to MongoDB for seeding test resumes");

  const samples = [
    {
      originalName: "alice.pdf",
      fileType: "pdf",
      rawText:
        "Alice Smith\nSoftware engineer with 5 years experience. Skills: JavaScript, Node.js, React. Email: alice@example.com",
      parsedData: {
        name: "Alice Smith",
        email: "alice@example.com",
        skills: ["JavaScript", "Node.js", "React"],
        experience: [
          {
            company: "Acme",
            position: "Engineer",
            description: "Worked on web apps",
          },
        ],
      },
    },
    {
      originalName: "bob.docx",
      fileType: "docx",
      rawText:
        "Bob Jones\nData scientist with 3 years. Skills: Python, Pandas, ML. Email: bob@example.com",
      parsedData: {
        name: "Bob Jones",
        email: "bob@example.com",
        skills: ["Python", "Pandas", "Machine Learning"],
        experience: [
          {
            company: "DataCorp",
            position: "Data Scientist",
            description: "Built models",
          },
        ],
      },
    },
    {
      originalName: "carol.pdf",
      fileType: "pdf",
      rawText:
        "Carol Lee\nFront-end developer. Skills: HTML, CSS, JavaScript, React. Email: carol@example.com",
      parsedData: {
        name: "Carol Lee",
        email: "carol@example.com",
        skills: ["HTML", "CSS", "JavaScript", "React"],
        experience: [
          {
            company: "WebWorks",
            position: "Frontend",
            description: "Built UIs",
          },
        ],
      },
    },
  ];

  // Clear existing test resumes with these original names
  await Resume.deleteMany({
    originalName: { $in: samples.map((s) => s.originalName) },
  });

  for (const s of samples) {
    const emb = await generateEmbedding(s.rawText);
    const chunks = chunkText(s.rawText)
      .slice(0, 3)
      .map((c) => ({
        text: c.text,
        embedding: emb,
        startChar: c.startChar,
        endChar: c.endChar,
      }));

    const resume = new Resume({
      filename: `${Date.now()}-${s.originalName}`,
      originalName: s.originalName,
      fileType: s.fileType,
      rawText: s.rawText,
      parsedData: s.parsedData,
      pii: {
        hasEmail: true,
        hasPhone: false,
        hasAddress: false,
        hasSocialSecurity: false,
      },
      embeddings: emb,
      chunks,
    });

    await resume.save();
    console.log("Inserted", s.originalName, "id=", resume._id);
  }

  console.log("Seeding complete");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
