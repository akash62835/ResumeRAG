const express = require("express");
const Resume = require("../models/Resume");
const { protect } = require("../middleware/auth");
const { generateEmbedding, cosineSimilarity } = require("../utils/embeddings");
const { redactPII } = require("../utils/parser");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { query, k = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const queryEmbedding = await generateEmbedding(query);

    const resumes = await Resume.find({
      embeddings: { $exists: true, $ne: [] },
    });

    const results = [];

    for (const resume of resumes) {
      const docSimilarity = cosineSimilarity(queryEmbedding, resume.embeddings);

      const chunkMatches = [];
      for (const chunk of resume.chunks || []) {
        if (chunk.embedding && chunk.embedding.length > 0) {
          const chunkSim = cosineSimilarity(queryEmbedding, chunk.embedding);
          chunkMatches.push({
            text: chunk.text,
            similarity: chunkSim,
            startChar: chunk.startChar,
            endChar: chunk.endChar,
          });
        }
      }

      chunkMatches.sort((a, b) => b.similarity - a.similarity);

      const evidence = chunkMatches.slice(0, 3).map((c) => ({
        snippet: c.text.substring(0, 200) + (c.text.length > 200 ? "..." : ""),
        score: c.similarity,
      }));

      results.push({
        resume_id: resume._id,
        candidate_name: resume.parsedData?.name || "Unknown",
        similarity_score: docSimilarity,
        evidence,
        parsed_data: resume.parsedData,
      });
    }

    results.sort((a, b) => {
      if (Math.abs(a.similarity_score - b.similarity_score) < 0.0001) {
        return a.resume_id.toString().localeCompare(b.resume_id.toString());
      }
      return b.similarity_score - a.similarity_score;
    });

    const topResults = results.slice(0, parseInt(k));

    const isRecruiterUser =
      req.user.role === "recruiter" || req.user.role === "admin";
    const finalResults = topResults.map((result) => {
      const out = { ...result };
      if (!isRecruiterUser && out.parsed_data) {
        out.parsed_data = redactPII(out.parsed_data);
      }
      out.evidence = (out.evidence || []).map((e) => ({
        snippet: e.snippet,
        score: e.score !== undefined ? e.score : e.similarity || 0,
      }));
      return out;
    });

    res.json({
      query,
      k: parseInt(k),
      results: finalResults,
      total_searched: resumes.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
