import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resumeAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isRecruiter = user?.role === "recruiter" || user?.role === "admin";

  const fetchResume = useCallback(async () => {
    try {
      const response = await resumeAPI.getById(id);
      setResume(response.data);
    } catch (err) {
      setError("Failed to fetch resume details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-muted">Loading candidate details...</p>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-danger/10 border border-danger/20 rounded-lg p-6">
          <p className="text-danger">{error || "Resume not found"}</p>
          <button
            onClick={() => navigate("/search")}
            className="mt-4 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const { parsedData, pii, originalName, uploadedAt } = resume;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-brand hover:text-brand/80 font-medium flex items-center gap-2"
      >
        ← Back
      </button>

      <div className="bg-surface shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-brand to-brand/80 px-8 py-10 text-white">
          <h1 className="text-4xl font-bold mb-2">
            {parsedData?.name || "Candidate Profile"}
          </h1>
          <p className="text-brand-soft text-sm">
            Uploaded: {new Date(uploadedAt).toLocaleDateString()}
          </p>
          {!isRecruiter && pii && (pii.hasEmail || pii.hasPhone) && (
            <p className="mt-2 text-xs bg-white/20 inline-block px-3 py-1 rounded-full">
              🔒 Personal information redacted (Recruiter access required)
            </p>
          )}
        </div>

        <div className="px-8 py-6 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-text mb-4 border-b-2 border-brand pb-2">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parsedData?.email && (
                <div>
                  <p className="text-sm text-muted font-medium">Email</p>
                  <p className="text-text">{parsedData.email}</p>
                </div>
              )}
              {parsedData?.phone && (
                <div>
                  <p className="text-sm text-muted font-medium">Phone</p>
                  <p className="text-text">{parsedData.phone}</p>
                </div>
              )}
              {parsedData?.location && (
                <div>
                  <p className="text-sm text-muted font-medium">Location</p>
                  <p className="text-text">{parsedData.location}</p>
                </div>
              )}
            </div>
          </section>

          {parsedData?.summary && (
            <section>
              <h2 className="text-2xl font-bold text-text mb-4 border-b-2 border-brand pb-2">
                Summary
              </h2>
              <p className="text-muted leading-relaxed">{parsedData.summary}</p>
            </section>
          )}

          {parsedData?.skills && parsedData.skills.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-text mb-4 border-b-2 border-brand pb-2">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-brand-soft text-brand rounded-lg font-medium text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {parsedData?.experience && parsedData.experience.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-text mb-4 border-b-2 border-brand pb-2">
                Work Experience
              </h2>
              <div className="space-y-6">
                {parsedData.experience.map((exp, idx) => (
                  <div key={idx} className="bg-hover p-5 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-text">
                          {exp.position || "Position"}
                        </h3>
                        <p className="text-brand font-medium">
                          {exp.company || "Company"}
                        </p>
                      </div>
                      {(exp.startDate || exp.endDate) && (
                        <span className="text-sm text-muted">
                          {exp.startDate} - {exp.endDate || "Present"}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-muted text-sm mt-3 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {parsedData?.education && parsedData.education.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-text mb-4 border-b-2 border-brand pb-2">
                Education
              </h2>
              <div className="space-y-4">
                {parsedData.education.map((edu, idx) => (
                  <div key={idx} className="bg-hover p-5 rounded-lg">
                    <h3 className="text-lg font-bold text-text">
                      {edu.degree || "Degree"} {edu.field && `in ${edu.field}`}
                    </h3>
                    <p className="text-brand font-medium">
                      {edu.institution || "Institution"}
                    </p>
                    {edu.graduationDate && (
                      <p className="text-sm text-muted mt-1">
                        {edu.graduationDate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {parsedData?.certifications &&
            parsedData.certifications.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-text mb-4 border-b-2 border-brand pb-2">
                  Certifications
                </h2>
                <ul className="space-y-2">
                  {parsedData.certifications.map((cert, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-muted"
                    >
                      <span className="text-brand">✓</span>
                      {cert}
                    </li>
                  ))}
                </ul>
              </section>
            )}

          {parsedData?.languages && parsedData.languages.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-text mb-4 border-b-2 border-brand pb-2">
                Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {parsedData.languages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-hover text-text rounded-lg font-medium text-sm"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="pt-6 border-t-2 border-border">
            <div className="text-sm text-muted space-y-1">
              <p>
                <span className="font-medium">Original Filename:</span>{" "}
                {originalName}
              </p>
              <p>
                <span className="font-medium">File Type:</span>{" "}
                {resume.fileType.toUpperCase()}
              </p>
              <p>
                <span className="font-medium">Uploaded:</span>{" "}
                {new Date(uploadedAt).toLocaleString()}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;
