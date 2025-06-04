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

module.exports = { buildPrompt };
