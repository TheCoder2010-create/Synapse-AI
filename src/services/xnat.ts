
'use server';

/**
 * @fileOverview A service for interacting with an XNAT REST API.
 */

// In-memory cache for the session ID to avoid repeated authentication.
let jsessionID: string | null = null;
let sessionExpiry: number | null = null;

interface XnatProject {
  ID: string;
  name: string;
  description: string;
  pi_firstname: string;
  pi_lastname: string;
}

/**
 * Authenticates with the XNAT server and retrieves a session ID.
 * Caches the session ID to avoid re-authenticating on every request.
 * @returns A promise that resolves to the JSESSIONID.
 */
async function getXnatSession(): Promise<string> {
  const host = process.env.XNAT_HOST;
  const user = process.env.XNAT_USER;
  const pass = process.env.XNAT_PASS;

  if (!host || !user || !pass) {
    throw new Error("XNAT environment variables (XNAT_HOST, XNAT_USER, XNAT_PASS) are not configured.");
  }

  // If we have a valid, non-expired session, reuse it.
  if (jsessionID && sessionExpiry && Date.now() < sessionExpiry) {
    console.log("Using cached XNAT session.");
    return jsessionID;
  }

  console.log("Authenticating with XNAT server...");
  const auth = 'Basic ' + Buffer.from(user + ':' + pass).toString('base64');
  const authUrl = `${host}/data/JSESSION`;

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Authorization': auth },
  });

  if (!response.ok) {
    throw new Error(`XNAT authentication failed with status: ${response.status}`);
  }

  const newJsessionID = await response.text();
  jsessionID = newJsessionID;
  // XNAT sessions typically last for a while, let's cache for 1 hour.
  sessionExpiry = Date.now() + 60 * 60 * 1000; 

  console.log("Successfully authenticated with XNAT.");
  return newJsessionID;
}

/**
 * Searches an XNAT instance for projects matching a given term.
 * @param term The term to search for in project names, descriptions, and keywords.
 * @returns A promise that resolves to a summary of matching projects.
 */
export async function searchXNAT(term: string): Promise<string> {
  try {
    const session = await getXnatSession();
    const host = process.env.XNAT_HOST;
    const searchUrl = `${host}/data/projects?format=json`;

    console.log(`Searching XNAT projects for term: "${term}"`);
    const response = await fetch(searchUrl, {
      headers: { 'Cookie': `JSESSIONID=${session}` }
    });

    if (!response.ok) {
      // If the session expired, clear it and retry once.
      if (response.status === 401) {
          console.log("XNAT session may have expired. Re-authenticating...");
          jsessionID = null; 
          return searchXNAT(term);
      }
      throw new Error(`Failed to fetch XNAT projects: ${response.statusText}`);
    }

    const data = await response.json();
    const projects: XnatProject[] = data.ResultSet.Result;
    const lowerCaseTerm = term.toLowerCase();

    const matchingProjects = projects.filter(p => 
      p.name?.toLowerCase().includes(lowerCaseTerm) ||
      p.description?.toLowerCase().includes(lowerCaseTerm) ||
      p.ID?.toLowerCase().includes(lowerCaseTerm)
    );

    if (matchingProjects.length === 0) {
      return `No projects found on XNAT matching "${term}".`;
    }

    const topMatches = matchingProjects.slice(0, 3).map(p => `"${p.name}" (ID: ${p.ID})`);
    return `Found ${matchingProjects.length} projects on XNAT related to "${term}". Top results include: ${topMatches.join('; ')}.`;

  } catch (error) {
    console.error("Error in searchXNAT service:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return `An error occurred while communicating with the XNAT server: ${errorMessage}`;
  }
}
