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

General instructions:
- Only extract information that is explicitly present in the text.
- If a field cannot be confidently determined from the text, leave it as an empty string.
- Do not infer, guess, or generate values that are not clearly mentioned.
- For the "minExperience" field, always extract only the numeric number of years (integer). If no clear number exists, return it as an empty value. Do not include text like "years" or words like "three" — only numeric digits.

The text:
"""${text}"""
`;
}

function buildMatchPrompt(mentor, reservist) {
  return `
You are an assistant that evaluates how well a mentor matches a reservist.

MENTOR DETAILS:
- Full Name: ${mentor.fullName}
- Profession: ${mentor.profession}
- Location: ${mentor.location}
- Specialties (areas they can help with): ${Array.isArray(mentor.specialties) ? mentor.specialties.join(', ') : mentor.specialties || ''}
- Description/About Me: ${mentor.aboutMe || ''}

RESERVIST DETAILS:
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
