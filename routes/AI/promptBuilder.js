function buildPrompt(text) {
  return `
The following text is a job posting. Please extract the following information and return it in JSON format:

Required fields:
- company
- location
- role
- minExperience
- description
- requirements
- advantages
- submitEmail
- submitLink
- companyWebsite
- jobViewLink

If a field is not found, return it as an empty value. The text:
"""${text}"""
`;
}
function buildMatchPrompt(mentor, reservist) {
  return `
You are an assistant that evaluates how well a mentor matches a reservist.

### MENTOR DETAILS:
- Full Name: ${mentor.fullName}
- Profession: ${mentor.profession}
- Location: ${mentor.location}
- Specialties (areas they can help with): ${Array.isArray(mentor.specialties) ? mentor.specialties.join(', ') : mentor.specialties || ''}
- Description/About Me: ${mentor.aboutMe || ''}

### RESERVIST DETAILS:
- Full Name: ${reservist.fullName}
- Interested Fields: ${Array.isArray(reservist.fields) ? reservist.fields.join(', ') : reservist.fields || ''}
- Location: ${reservist.location}
- Description/About Me: ${reservist.aboutMe || ''}

Evaluate the match and return a JSON with the following structure:

{
  "matchScore": number (0-100),
  "scoreBreakdown": {
    "professionMatch": number (0-50),
    "locationMatch": number (0-30),
    "keywordMatch": number (0-20)
  },
  "matchingReasons": ["shared location", "interest in same field", "similar career goals", ...],
  "matchedFields": [ ... ],
  "keywordsMatched": [ ... ]
}

Respond ONLY with valid JSON and make sure the score breakdown values add up to matchScore.
`;
}




module.exports = { buildPrompt, buildMatchPrompt };
