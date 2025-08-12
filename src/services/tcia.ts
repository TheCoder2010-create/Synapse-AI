
'use server';

/**
 * @fileOverview A service for interacting with The Cancer Imaging Archive (TCIA) API.
 */

interface TciaCollection {
  Collection: string;
}

// In-memory cache for the collection list to avoid repeated API calls.
let cachedCollections: TciaCollection[] | null = null;

async function getAllCollections(): Promise<TciaCollection[]> {
  if (cachedCollections) {
    console.log("Using cached TCIA collection list.");
    return cachedCollections;
  }

  console.log("Fetching TCIA collection list from API...");
  try {
    const response = await fetch('https://services.cancerimagingarchive.net/services/v4/TCIA/query/getCollectionValues');
    if (!response.ok) {
      throw new Error(`Failed to fetch TCIA collections: ${response.statusText}`);
    }
    const data: TciaCollection[] = await response.json();
    cachedCollections = data;
    return data;
  } catch (error) {
    console.error("Error fetching TCIA collections:", error);
    return []; // Return empty on error to avoid breaking the flow.
  }
}

/**
 * Searches the TCIA collection list for a given term.
 * @param term The term to search for within collection names.
 * @returns A promise that resolves to a summary of matching collections.
 */
export async function searchTCIADatasets(term: string): Promise<string> {
  const allCollections = await getAllCollections();
  if (allCollections.length === 0) {
    return 'Could not retrieve collection list from The Cancer Imaging Archive (TCIA).';
  }

  const lowerCaseTerm = term.toLowerCase().replace(/[\s-]/g, ''); // Normalize term for better matching

  const matchingCollections = allCollections.filter(c => 
    c.Collection.toLowerCase().replace(/[\s-]/g, '').includes(lowerCaseTerm)
  );

  if (matchingCollections.length === 0) {
    return `No public collections directly matching the term "${term}" were found in TCIA's list. A manual search on the TCIA portal may be required for related datasets.`;
  }
  
  const topMatches = matchingCollections.slice(0, 3).map(c => c.Collection);

  const summary = `Found ${matchingCollections.length} TCIA collection(s) related to "${term}". Top matches include: ${topMatches.join(', ')}. These datasets may contain relevant imaging data for further research.`;

  return summary;
}
