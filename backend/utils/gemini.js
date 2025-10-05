const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateEmbedding(text) {
  try {
    if (!text || text.trim().length === 0) {
      console.warn("Empty text provided for embedding");
      return new Array(768).fill(0);
    }

    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text.substring(0, 10000)); // Limit to 10k chars

    return result.embedding.values;
  } catch (error) {
    console.error("Error generating Gemini embedding:", error);
    return generateFallbackEmbedding(text);
  }
}

function generateFallbackEmbedding(text) {
  const tokens = text.toLowerCase().match(/\b\w+\b/g) || [];
  const frequency = {};
  tokens.forEach((token) => {
    frequency[token] = (frequency[token] || 0) + 1;
  });

  const embedding = [];
  const commonWords = Object.keys(frequency).slice(0, 100);

  for (let i = 0; i < 768; i++) {
    const token = commonWords[i % commonWords.length];
    embedding.push(frequency[token] || 0);
  }

  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  return embedding.map((val) => (magnitude > 0 ? val / magnitude : 0));
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return isNaN(similarity) ? 0 : similarity;
}

function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  const words = text.split(/\s+/);

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    const startChar = text.indexOf(chunk);
    const endChar = startChar + chunk.length;

    chunks.push({
      text: chunk,
      startChar: startChar >= 0 ? startChar : 0,
      endChar: endChar >= 0 ? endChar : text.length,
    });
  }

  return chunks;
}

async function extractResumeData(resumeText) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Extract structured information from the following resume text. Return ONLY valid JSON with no additional text or markdown formatting.

Resume Text:
${resumeText.substring(0, 15000)}

Extract and return a JSON object with this exact structure:
{
  "name": "Full name of the candidate",
  "email": "Email address",
  "phone": "Phone number",
  "location": "City, State or location",
  "summary": "Professional summary or objective",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "company": "Company name",
      "position": "Job title",
      "startDate": "Start date",
      "endDate": "End date or Present",
      "description": "Brief description of role"
    }
  ],
  "education": [
    {
      "institution": "School name",
      "degree": "Degree type",
      "field": "Field of study",
      "graduationDate": "Graduation date"
    }
  ],
  "certifications": ["cert1", "cert2"],
  "languages": ["language1", "language2"]
}

If any field is not found, use an empty string for strings, empty array for arrays, or omit optional fields.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    let jsonText = response.trim();
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const parsedData = JSON.parse(jsonText);
    return parsedData;
  } catch (error) {
    console.error("Error extracting resume data with Gemini:", error);
    return null;
  }
}

async function analyzeJobMatch(jobDescription, resumeText) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Analyze how well this resume matches the job description. Return ONLY valid JSON.

Job Description:
${jobDescription.substring(0, 5000)}

Resume:
${resumeText.substring(0, 10000)}

Analyze and return a JSON object:
{
  "overallMatch": 0-100,
  "strengthAreas": ["area1", "area2"],
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "experienceMatch": "brief assessment",
  "recommendations": "brief recommendation for candidate"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    let jsonText = response.trim();
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error analyzing job match with Gemini:", error);
    return null;
  }
}

module.exports = {
  generateEmbedding,
  cosineSimilarity,
  chunkText,
  extractResumeData,
  analyzeJobMatch,
  genAI,
};
