
'use server';

/**
 * @fileOverview A service for interacting with the IMAIOS e-Anatomy API.
 */

interface ImaiosSearchResult {
  id: number;
  name: string;
  language: {
    iso_code: string;
  };
  // other fields can be added if needed
}

interface ImaiosAnatomyDetail {
    id: number;
    name: string;
    description: string;
}

/**
 * Searches IMAIOS e-Anatomy for a given term and returns a detailed description.
 * @param term The anatomical term to search for.
 * @returns A promise that resolves to a detailed definition or a message indicating the result.
 */
export async function searchImaiosAnatomy(term: string): Promise<string> {
  const apiKey = process.env.IMAIOS_API_KEY;
  if (!apiKey) {
    const errorMessage = "IMAIOS API key is not configured in environment variables (IMAIOS_API_KEY).";
    console.warn(errorMessage);
    return `Could not connect to the anatomical atlas: ${errorMessage}`;
  }
  
  if (!term) {
    return "No anatomical search term provided.";
  }

  const headers = { 'Authorization': `ApiKey ${apiKey}` };

  try {
    console.log(`Searching IMAIOS API for: "${term}"`);
    const searchUrl = `https://www.imaios.com/en/api/v2/search?text=${encodeURIComponent(term)}&sources=e-anatomy`;
    const searchResponse = await fetch(searchUrl, { headers });

    if (!searchResponse.ok) {
        const errorBody = await searchResponse.text();
        console.error(`IMAIOS API search failed with status: ${searchResponse.status}`, errorBody);
        return `IMAIOS API search failed with status: ${searchResponse.status}.`;
    }

    const searchData = await searchResponse.json();
    const results: ImaiosSearchResult[] = searchData.search_results;

    if (!results || results.length === 0) {
      return `No anatomical structures found on IMAIOS for "${term}".`;
    }

    const topResult = results[0];
    console.log(`Found anatomical structure: "${topResult.name}" (ID: ${topResult.id}). Fetching details...`);
    
    // Fetch detailed information for the top result.
    // NOTE: This endpoint is assumed based on common API patterns.
    const detailUrl = `https://www.imaios.com/en/api/v2/anatomical-structures/${topResult.id}`;
    const detailResponse = await fetch(detailUrl, { headers });

    if (!detailResponse.ok) {
      console.error(`IMAIOS detail fetch failed with status: ${detailResponse.status}`);
      // Fallback to simpler summary if detail fetch fails
      const topResults = results.slice(0, 3).map(r => r.name);
      return `Found ${results.length} results on IMAIOS for "${term}". Top results include: ${topResults.join(', ')}. (Could not fetch detailed description).`;
    }
    
    const detailData: ImaiosAnatomyDetail = await detailResponse.json();
    
    // Assuming a 'description' field in the response. This may need adjustment
    // based on the actual API response structure.
    if (detailData.description) {
      const cleanDescription = detailData.description.replace(/<[^>]+>/g, '').trim();
      return `From IMAIOS e-Anatomy, regarding "${detailData.name}": ${cleanDescription}`;
    }

    // Fallback if no description is found
    return `Found anatomical structure "${topResult.name}" on IMAIOS, but no detailed description is available via the API.`;

  } catch (error) {
    console.error(`Error in searchImaiosAnatomy service for term "${term}":`, error);
    return `An error occurred while communicating with the IMAIOS API.`;
  }
}
