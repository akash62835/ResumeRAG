const express = require("express");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const { protect, isRecruiter } = require("../middleware/auth");
const { generateEmbedding, cosineSimilarity } = require("../utils/embeddings");

const router = express.Router();

router.post("/", protect, isRecruiter, async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      requirements,
      structuredRequirements,
      location,
      salary,
    } = req.body;

    if (!title || !company || !description || !requirements) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const combinedText = `${title} ${description} ${requirements}`;
    const embeddings = await generateEmbedding(combinedText);

    const job = new Job({
      title,
      company,
      description,
      requirements,
      structuredRequirements: structuredRequirements || {},
      location,
      salary,
      embeddings,
      createdBy: req.userId,
    });

    await job.save();

    res.status(201).json({
      id: job._id,
      title: job.title,
      company: job.company,
      status: job.status,
      createdAt: job.createdAt,
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const { status = "open", limit = 20, offset = 0 } = req.query;

    const query = status ? { status } : {};

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .select("-embeddings")
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).select("-embeddings");

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

router.post("/:id/match", protect, async (req, res) => {
  try {
    const { top_n = 10 } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const resumes = await Resume.find({
      embeddings: { $exists: true, $ne: [] },
    });

    const matches = [];

    for (const resume of resumes) {
      const semanticScore = cosineSimilarity(job.embeddings, resume.embeddings);

      const jobSkills = job.structuredRequirements?.skills || [];
      const candidateSkills = resume.parsedData?.skills || [];
      const matchedSkills = jobSkills.filter((js) =>
        candidateSkills.some((cs) =>
          cs.toLowerCase().includes(js.toLowerCase())
        )
      );
      const skillsScore =
        jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0;

      let experienceScore = 0;
      const minYears = job.structuredRequirements?.experience?.minYears || 0;
      const candidateExp = resume.parsedData?.experience?.length || 0;
      if (minYears > 0) {
        experienceScore = Math.min(candidateExp / minYears, 1);
      } else {
        experienceScore = candidateExp > 0 ? 1 : 0;
      }

      const overallScore =
        semanticScore * 0.5 + skillsScore * 0.3 + experienceScore * 0.2;

      const evidence = [];
      for (const chunk of resume.chunks || []) {
        if (chunk.embedding && chunk.embedding.length > 0) {
          const chunkSim = cosineSimilarity(job.embeddings, chunk.embedding);
          if (chunkSim > 0.7) {
            evidence.push({
              snippet:
                chunk.text.substring(0, 200) +
                (chunk.text.length > 200 ? "..." : ""),
              relevance_score: chunkSim,
            });
          }
        }
      }

      evidence.sort((a, b) => b.relevance_score - a.relevance_score);

      const missingRequirements = [];
      const missingSkills = jobSkills.filter(
        (js) =>
          !candidateSkills.some((cs) =>
            cs.toLowerCase().includes(js.toLowerCase())
          )
      );
      if (missingSkills.length > 0) {
        missingRequirements.push({
          category: "skills",
          items: missingSkills,
        });
      }

      const requiredCerts = job.structuredRequirements?.certifications || [];
      const candidateCerts = resume.parsedData?.certifications || [];
      const missingCerts = requiredCerts.filter(
        (rc) =>
          !candidateCerts.some((cc) =>
            cc.toLowerCase().includes(rc.toLowerCase())
          )
      );
      if (missingCerts.length > 0) {
        missingRequirements.push({
          category: "certifications",
          items: missingCerts,
        });
      }

      matches.push({
        resume_id: resume._id,
        candidate_name: resume.parsedData?.name || "Unknown",
        overall_score: overallScore,
        breakdown: {
          semantic_similarity: semanticScore,
          skills_match: skillsScore,
          experience_match: experienceScore,
        },
        matched_skills: matchedSkills,
        evidence: (evidence.slice(0, 3) || []).map((e) => ({
          snippet: e.snippet,
          score:
            e.relevance_score !== undefined ? e.relevance_score : e.score || 0,
        })),
        missing_requirements: missingRequirements,
        parsed_data: resume.parsedData,
      });
    }

    matches.sort((a, b) => {
      if (Math.abs(a.overall_score - b.overall_score) < 0.0001) {
        return a.resume_id.toString().localeCompare(b.resume_id.toString());
      }
      return b.overall_score - a.overall_score;
    });

    const topMatches = matches.slice(0, parseInt(top_n));

    const isRecruiterUser =
      req.user.role === "recruiter" || req.user.role === "admin";
    const finalMatches = topMatches.map((m) => {
      const out = { ...m };
      if (!isRecruiterUser && out.parsed_data) {
        const { redactPII } = require("../utils/parser");
        out.parsed_data = redactPII(out.parsed_data);
      }
      return out;
    });

    res.json({
      job_id: job._id,
      job_title: job.title,
      total_candidates: matches.length,
      top_n: parseInt(top_n),
      matches: finalMatches,
    });
  } catch (error) {
    console.error("Error matching candidates:", error);
    res.status(500).json({ error: "Failed to match candidates" });
  }
});

module.exports = router;
