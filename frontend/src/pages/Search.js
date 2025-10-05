import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchAPI } from "../utils/api";

const Search = () => {
  const [query, setQuery] = useState("");
  const [k, setK] = useState(10);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await searchAPI.ask(query, k);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-text mb-2">Search Resumes</h1>
        <p className="text-muted text-lg">
          Use natural language to search across all uploaded resumes
        </p>
      </header>

      <section className="bg-surface shadow-lg rounded-xl p-6 mb-10">
        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label
              htmlFor="query"
              className="block text-sm font-medium text-text mb-2"
            >
              Search Query
            </label>
            <input
              id="query"
              type="text"
              className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent bg-bg text-text"
              placeholder="e.g., Senior developer with React and Node.js experience"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label
                htmlFor="k"
                className="block text-sm font-medium text-text mb-2"
              >
                Number of Results
              </label>
              <input
                id="k"
                type="number"
                min="1"
                max="50"
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent bg-bg text-text"
                value={k}
                onChange={(e) => setK(parseInt(e.target.value))}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-brand hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 p-4">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}
        </form>
      </section>

      {results && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4">
            <h2 className="text-2xl font-bold text-text">
              Search Results ({results.results.length} of {results.total_searched})
            </h2>
          </div>

          {results.results.length === 0 ? (
            <div className="bg-surface rounded-xl p-12 text-center">
              <p className="text-muted text-lg">
                No results found for your query.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.results.map((result) => (
                <div
                  key={result.resume_id}
                  className="bg-surface border-2 border-border rounded-xl p-6 hover:border-brand cursor-pointer transition-all flex flex-col justify-between"
                  onClick={() => navigate(`/candidates/${result.resume_id}`)}
                >
                  <div>
                    <h3 className="text-xl font-bold text-text mb-2">
                      {result.candidate_name}
                    </h3>
                    <span className="text-sm font-medium text-brand">
                      Match Score: {(result.similarity_score * 100).toFixed(1)}%
                    </span>

                    {result.parsed_data && (
                      <div className="mt-4 space-y-2">
                        {result.parsed_data.email &&
                          result.parsed_data.email !== "[REDACTED]" && (
                            <p className="text-sm text-muted">
                              <span className="font-medium">Email:</span>{" "}
                              {result.parsed_data.email}
                            </p>
                          )}
                        {result.parsed_data.skills &&
                          result.parsed_data.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {result.parsed_data.skills
                                .slice(0, 8)
                                .map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-brand-soft text-brand text-xs rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {result.evidence && result.evidence.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-semibold text-text">Evidence</h4>
                      {result.evidence.map((ev, idx) => (
                        <div key={idx} className="bg-hover p-3 rounded-lg">
                          <p className="text-sm text-muted italic">"{ev.snippet}"</p>
                          <p className="text-xs text-brand mt-1">
                            Relevance: {(ev.score * 100).toFixed(1)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Search;
