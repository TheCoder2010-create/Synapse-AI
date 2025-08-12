
'use server';

/**
 * @fileOverview A service for interacting with the Open-i (NLM) API.
 */

interface OpenIImage {
  id: string;
  caption: string;
  imgLarge: string;
  // other fields if needed: imgMedium, imgThumb, etc.
}

interface OpenIApiResponse {
  list: OpenIImage[];
  count: number;
}

/**
 * Searches the Open-i image database for a given term.
 * @param term The term to search for.
 * @returns A promise that resolves to a summary of matching images.
 */
export async function searchOpenI(term: string): Promise<string> {
  if (!term) {
    return 'No search term provided for Open-i.';
  }

  const searchUrl = `https://openi.nlm.nih.gov/api/search?query=${encodeURIComponent(term)}&it=x,y&format=json&m=1&n=5`;

  try {
    console.log(`Searching Open-i API for: "${term}"`);
    const response = await fetch(searchUrl, {
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Open-i: ${response.statusText}`);
    }

    const data: OpenIApiResponse = await response.json();

    if (data.count === 0 || !data.list || data.list.length === 0) {
      return `No relevant images found on the Open-i medical database for "${term}".`;
    }

    const topResults = data.list.slice(0, 3).map(img => `an image with caption: "${img.caption.substring(0, 100)}..."`).join('; ');

    const summary = `Found ${data.count} images on Open-i related to "${term}". Top results include: ${topResults}. This provides visual confirmation for findings.`;

    return summary;

  } catch (error) {
    console.error(`Error in searchOpenI service for term "${term}":`, error);
    return `An error occurred while communicating with the Open-i API.`;
  }
}
