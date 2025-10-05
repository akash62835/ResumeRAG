import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { resumeAPI } from "../utils/api";

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
    setResults(null);
    setError("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/msword": [".doc"],
      "application/zip": [".zip"],
    },
    multiple: true,
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select files to upload");
      return;
    }

    setUploading(true);
    setError("");
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("resumes", file);
    });

    try {
      const response = await resumeAPI.upload(formData, (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(progress);
      });

      setResults(response.data);
      setFiles([]);
      setUploadProgress(0);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Upload Resumes</h1>
        <p className="mt-2 text-sm text-muted">
          Upload PDF, DOCX files, or ZIP archives containing resumes
        </p>
      </div>

      <div className="bg-surface shadow rounded-lg p-6 border border-border">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-brand bg-brand-soft"
              : "border-border hover:border-border/80"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-muted"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isDragActive ? (
              <p className="text-lg text-brand">Drop files here...</p>
            ) : (
              <>
                <p className="text-lg text-muted">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted">
                  Supported formats: PDF, DOCX, DOC, ZIP
                </p>
              </>
            )}
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-text mb-2">
              Selected Files ({files.length})
            </h3>
            <ul className="divide-y divide-border border border-border rounded-md">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-sm text-text">{file.name}</span>
                  <span className="text-xs text-muted">
                    {(file.size / 1024).toFixed(2)} KB
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-md bg-danger/10 p-4 border border-danger/20">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {uploading && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted">
                Uploading...
              </span>
              <span className="text-sm text-muted">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-hover rounded-full h-2">
              <div
                className="bg-brand h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {results && (
          <div className="mt-6 rounded-md bg-success-soft p-4 border border-success/20">
            <h3 className="text-sm font-medium text-success mb-2">
              Upload Complete!
            </h3>
            <p className="text-sm text-text">
              Successfully processed {results.processed} resume(s)
            </p>
            {results.errors > 0 && (
              <p className="text-sm text-danger mt-1">
                {results.errors} file(s) failed to process
              </p>
            )}
            {results.errorDetails && results.errorDetails.length > 0 && (
              <ul className="mt-2 text-xs text-danger">
                {results.errorDetails.map((err, idx) => (
                  <li key={idx}>
                    {err.file}: {err.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Processing..." : "Upload and Process"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upload;
