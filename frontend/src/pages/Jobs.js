import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jobAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [matches, setMatches] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isRecruiter = user?.role === "recruiter" || user?.role === "admin";

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getAll();
      setJobs(response.data.jobs);
    } catch (err) {
      setError("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async (jobId) => {
    try {
      setSelectedJob(jobId);
      const response = await jobAPI.match(jobId, 10);
      setMatches(response.data);
    } catch (err) {
      setError("Failed to find matches");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-text">Job Postings</h1>
          <p className="mt-2 text-muted">
            Manage job postings and find matching candidates
          </p>
        </div>
        {isRecruiter && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand/90 transition-all shadow-lg font-medium"
          >
            + Create Job
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-danger/10 border border-danger/20 p-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-surface rounded-xl p-12 text-center">
          <p className="text-muted text-lg">No job postings yet.</p>
          {isRecruiter && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand/90 transition-all"
            >
              Create First Job
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-text">Available Jobs</h2>
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-surface border-2 border-border rounded-xl p-6 hover:border-brand transition-all cursor-pointer"
                onClick={() => handleFindMatches(job._id)}
              >
                <h3 className="text-xl font-bold text-text">{job.title}</h3>
                <p className="text-muted mt-1">{job.company}</p>
                {job.location && (
                  <p className="text-sm text-muted mt-2">📍 {job.location}</p>
                )}
                <p className="text-sm text-muted mt-3 line-clamp-3">
                  {job.description}
                </p>
                <div className="mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFindMatches(job._id);
                    }}
                    className="px-4 py-2 bg-brand/10 text-brand rounded-lg hover:bg-brand/20 transition-all text-sm font-medium"
                  >
                    Find Matches
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            {matches ? (
              <div className="bg-surface rounded-xl p-6 border-2 border-brand sticky top-4">
                <h2 className="text-2xl font-bold text-text mb-4">
                  Top Matches for {matches.job_title}
                </h2>
                <p className="text-sm text-muted mb-6">
                  Found {matches.total_candidates} candidates, showing top{" "}
                  {matches.top_n}
                </p>

                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {matches.matches.map((match, idx) => (
                    <div
                      key={match.resume_id}
                      className="bg-hover p-4 rounded-lg cursor-pointer hover:bg-brand/10 transition-all"
                      onClick={() => navigate(`/candidates/${match.resume_id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-text">
                            #{idx + 1} {match.candidate_name}
                          </p>
                          <p className="text-sm text-brand font-medium mt-1">
                            Match Score:{" "}
                            {(match.overall_score * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 text-xs space-y-1">
                        <p className="text-muted">
                          <span className="font-medium">Semantic:</span>{" "}
                          {(match.breakdown.semantic_similarity * 100).toFixed(
                            1
                          )}
                          %
                        </p>
                        <p className="text-muted">
                          <span className="font-medium">Skills:</span>{" "}
                          {(match.breakdown.skills_match * 100).toFixed(1)}%
                        </p>
                        <p className="text-muted">
                          <span className="font-medium">Experience:</span>{" "}
                          {(match.breakdown.experience_match * 100).toFixed(1)}%
                        </p>
                      </div>

                      {match.matched_skills &&
                        match.matched_skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {match.matched_skills
                              .slice(0, 5)
                              .map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-brand-soft text-brand text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                          </div>
                        )}

                      {match.missing_requirements &&
                        match.missing_requirements.length > 0 && (
                          <div className="mt-3 text-xs text-danger">
                            <p className="font-medium">Missing:</p>
                            {match.missing_requirements.map((req, i) => (
                              <p key={i}>
                                • {req.category}:{" "}
                                {req.items.slice(0, 3).join(", ")}
                              </p>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-surface rounded-xl p-12 text-center border-2 border-dashed border-border">
                <p className="text-muted">
                  Click on a job to find matching candidates
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateJobModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchJobs();
          }}
        />
      )}
    </div>
  );
};

const CreateJobModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    requirements: "",
    location: "",
    skills: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const skillsList = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      await jobAPI.create({
        ...formData,
        structuredRequirements: {
          skills: skillsList,
        },
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-text mb-4">
          Create Job Posting
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Job Title
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-bg text-text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Company
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-bg text-text"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Location
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-bg text-text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Description
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-bg text-text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Requirements
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-bg text-text"
              value={formData.requirements}
              onChange={(e) =>
                setFormData({ ...formData, requirements: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Skills (comma-separated)
            </label>
            <input
              type="text"
              placeholder="React, Node.js, Python, etc."
              className="w-full px-4 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-bg text-text"
              value={formData.skills}
              onChange={(e) =>
                setFormData({ ...formData, skills: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-border rounded-lg text-text hover:bg-hover transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-all disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Jobs;
