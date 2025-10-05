const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Resume = require("../models/Resume");
const Job = require("../models/Job");
const { generateEmbedding, cosineSimilarity } = require("../utils/embeddings");

async function testAsk() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/resume-parser"
  );
  const resumes = await Resume.find({ embeddings: { $exists: true, $ne: [] } });
  console.log("Resumes in DB:", resumes.length);

  const query = "React developer with Node.js experience";
  const qEmb = await generateEmbedding(query);

  const results = [];
  for (const resume of resumes) {
    const docSim = cosineSimilarity(qEmb, resume.embeddings);
    const chunkMatches = [];
    for (const chunk of resume.chunks || []) {
      const chunkSim = cosineSimilarity(qEmb, chunk.embedding || []);
      chunkMatches.push({ text: chunk.text, similarity: chunkSim });
    }
    chunkMatches.sort((a, b) => b.similarity - a.similarity);
    const evidence = chunkMatches
      .slice(0, 3)
      .map((c) => ({
        snippet: c.text.substring(0, 200) + (c.text.length > 200 ? "..." : ""),
        score: c.similarity,
      }));
    results.push({
      resume_id: resume._id.toString(),
      candidate_name: resume.parsedData?.name || "Unknown",
      similarity_score: docSim,
      evidence,
      parsed_data: resume.parsedData,
    });
  }

  results.sort((a, b) => {
    if (Math.abs(a.similarity_score - b.similarity_score) < 0.0001)
      return a.resume_id.localeCompare(b.resume_id);
    return b.similarity_score - a.similarity_score;
  });

  console.log("Top results (k=3):", results.slice(0, 3));
  process.exit(0);
}

async function testMatch() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/resume-parser"
  );
  const job = new Job({
    title: "React Developer",
    company: "TestCo",
    description: "Build React apps",
    requirements: "React, Node.js",
    structuredRequirements: {
      skills: ["React", "Node.js"],
      experience: { minYears: 2 },
    },
    embeddings: await generateEmbedding("React Node.js"),
  });
  await job.save();
  console.log("Created job id", job._id);

  const resumes = await Resume.find({ embeddings: { $exists: true, $ne: [] } });
  const matches = [];
  for (const resume of resumes) {
    const semanticScore = cosineSimilarity(job.embeddings, resume.embeddings);
    const jobSkills = job.structuredRequirements.skills || [];
    const candidateSkills = resume.parsedData?.skills || [];
    const matchedSkills = jobSkills.filter((js) =>
      candidateSkills.some((cs) => cs.toLowerCase().includes(js.toLowerCase()))
    );
    const skillsScore =
      jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0;
    const candidateExp = resume.parsedData?.experience?.length || 0;
    const minYears = job.structuredRequirements?.experience?.minYears || 0;
    let experienceScore = 0;
    if (minYears > 0) experienceScore = Math.min(candidateExp / minYears, 1);
    else experienceScore = candidateExp > 0 ? 1 : 0;
    const overallScore =
      semanticScore * 0.5 + skillsScore * 0.3 + experienceScore * 0.2;
    matches.push({
      resume_id: resume._id.toString(),
      candidate_name: resume.parsedData?.name || "Unknown",
      overall_score: overallScore,
      matched_skills: matchedSkills,
    });
  }

  matches.sort((a, b) => {
    if (Math.abs(a.overall_score - b.overall_score) < 0.0001)
      return a.resume_id.localeCompare(b.resume_id);
    return b.overall_score - a.overall_score;
  });

  console.log("Top matches:", matches.slice(0, 3));
  process.exit(0);
}

if (require.main === module) {
  (async () => {
    await testAsk();
    await testMatch();
  })();
}
