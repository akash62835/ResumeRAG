const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { extractResumeData } = require("./gemini");

async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF file");
  }
}

async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error("Failed to parse DOCX file");
  }
}

async function parseResumeText(text) {
  try {
    const geminiData = await extractResumeData(text);

    if (geminiData) {
      // Detect PII
      const pii = {
        hasEmail: !!geminiData.email,
        hasPhone: !!geminiData.phone,
        hasAddress: !!geminiData.location,
        hasSocialSecurity: /\b\d{3}-\d{2}-\d{4}\b/.test(text),
      };

      return { parsedData: geminiData, pii };
    }
  } catch (error) {
    console.error("Gemini extraction failed, falling back to regex:", error);
  }

  const parsedData = {
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    location: extractLocation(text),
    summary: extractSummary(text),
    skills: extractSkills(text),
    experience: extractExperience(text),
    education: extractEducation(text),
    certifications: extractCertifications(text),
    languages: extractLanguages(text),
  };

  const pii = {
    hasEmail: !!parsedData.email,
    hasPhone: !!parsedData.phone,
    hasAddress: !!parsedData.location,
    hasSocialSecurity: /\b\d{3}-\d{2}-\d{4}\b/.test(text),
  };

  return { parsedData, pii };
}

function extractName(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length < 50 && /^[A-Z][a-z]+ [A-Z][a-z]+/.test(firstLine)) {
      return firstLine;
    }
  }
  return "";
}

function extractEmail(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = text.match(emailRegex);
  return match ? match[0] : "";
}

function extractPhone(text) {
  const phoneRegex =
    /(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : "";
}

function extractLocation(text) {
  const locationRegex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})/;
  const match = text.match(locationRegex);
  return match ? match[0] : "";
}

function extractSummary(text) {
  const summaryRegex =
    /(summary|objective|profile)[\s:]+([^\n]+(?:\n[^\n]+){0,3})/i;
  const match = text.match(summaryRegex);
  return match ? match[2].trim() : "";
}

function extractSkills(text) {
  const skills = [];
  const skillsSection = text.match(
    /(skills|technologies|expertise)[\s:]+([^\n]+(?:\n[^\n]+){0,5})/i
  );

  if (skillsSection) {
    const skillText = skillsSection[2];
    const skillList = skillText
      .split(/[,;•·\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 50);
    skills.push(...skillList);
  }

  return skills;
}

function extractExperience(text) {
  const experience = [];
  const expSection = text.match(
    /(experience|work history|employment)[\s:]+(.+?)(?=(education|skills|certifications|$))/is
  );

  if (expSection) {
    const expText = expSection[2];
    const entries = expText.split(/\n\n+/);

    for (const entry of entries) {
      if (entry.trim().length > 20) {
        experience.push({
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          description: entry.trim().substring(0, 500),
        });
      }
    }
  }

  return experience;
}

function extractEducation(text) {
  const education = [];
  const eduSection = text.match(
    /(education|academic)[\s:]+(.+?)(?=(experience|skills|certifications|$))/is
  );

  if (eduSection) {
    const eduText = eduSection[2];
    const entries = eduText.split(/\n\n+/);

    for (const entry of entries) {
      if (entry.trim().length > 10) {
        education.push({
          institution: "",
          degree: "",
          field: "",
          graduationDate: "",
        });
      }
    }
  }

  return education;
}

function extractCertifications(text) {
  const certifications = [];
  const certSection = text.match(
    /(certifications|certificates|licenses)[\s:]+([^\n]+(?:\n[^\n]+){0,5})/i
  );

  if (certSection) {
    const certText = certSection[2];
    const certList = certText
      .split(/[,;\n•·]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    certifications.push(...certList);
  }

  return certifications;
}

function extractLanguages(text) {
  const languages = [];
  const langSection = text.match(/(languages)[\s:]+([^\n]+)/i);

  if (langSection) {
    const langText = langSection[2];
    const langList = langText
      .split(/[,;]/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    languages.push(...langList);
  }

  return languages;
}

function redactPII(parsedData) {
  const redacted = { ...parsedData };

  if (redacted.email) {
    redacted.email = "[REDACTED]";
  }
  if (redacted.phone) {
    redacted.phone = "[REDACTED]";
  }
  if (redacted.location) {
    redacted.location = redacted.location.replace(
      /\d+\s+[A-Za-z\s]+/,
      "[ADDRESS REDACTED]"
    );
  }

  return redacted;
}

module.exports = {
  parsePDF,
  parseDOCX,
  parseResumeText,
  redactPII,
};
