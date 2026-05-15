export async function fetchMasterResume(): Promise<string> {
  const docId = process.env.GOOGLE_DOCS_RESUME_ID;
  if (!docId) {
    throw new Error("GOOGLE_DOCS_RESUME_ID is not set in environment variables");
  }

  const url = `https://docs.google.com/document/d/${docId}/export?format=txt`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch resume from Google Docs: ${response.status} ${response.statusText}`);
  }

  return response.text();
}
