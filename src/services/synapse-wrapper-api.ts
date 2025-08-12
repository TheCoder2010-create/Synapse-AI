
'use server';

/**
 * @fileOverview This is the Synapse Wrapper API, a core piece of intellectual property.
 * It provides a unified, secure, and structured interface to various external and internal
 * knowledge bases, abstracting the underlying data sources from the AI models.
 */

interface ClinicalKBArticleSearchResult {
  id: number;
  title: string;
  public_url: string;
}

interface ClinicalKBArticle {
    title: string;
    synopsis: string;
}

/**
 * Searches the configured clinical knowledge base for a given term.
 * This function is part of the proprietary Synapse Wrapper API.
 * Currently, it is implemented to call the Radiopaedia.org API.
 * @param term The radiological term to search for.
 * @returns A promise that resolves to a definition/summary string or a message indicating the result.
 */
export async function searchClinicalKnowledgeBase(term: string): Promise<string> {
  const apiKey = process.env.RADIOPAEDIA_API_KEY;

  if (!apiKey) {
    const errorMessage = "Clinical knowledge base API key is not configured in environment variables (RADIOPAEDIA_API_KEY).";
    console.error(errorMessage);
    // Return a graceful message to the AI flow instead of throwing an error.
    return "Could not connect to the external knowledge base due to a configuration error.";
  }

  if (!term) {
    return "No search term provided.";
  }

  const headers = {
    'Authorization': `${apiKey}` 
  };

  try {
    console.log(`(Synapse Wrapper) Searching Clinical Knowledge Base for: "${term}"`);
    // This fetch call could be dynamically routed to different providers in a future version.
    const searchResponse = await fetch(`https://radiopaedia.org/api/v1/search?q=${encodeURIComponent(term)}&scope=articles`, { headers });
    
    if (!searchResponse.ok) {
      console.error(`(Synapse Wrapper) CKB search failed with status: ${searchResponse.status}`);
      return `The search for "${term}" on the Clinical Knowledge Base failed. The API returned status ${searchResponse.status}.`;
    }
    
    const searchData = await searchResponse.json();
    const articles: ClinicalKBArticleSearchResult[] = searchData.articles;

    if (!articles || articles.length === 0) {
      return `No article found on the Clinical Knowledge Base for "${term}".`;
    }

    const topResult = articles[0];
    console.log(`(Synapse Wrapper) Found CKB article: "${topResult.title}" (ID: ${topResult.id}). Fetching details...`);
    
    // Fetch the full article details using the article ID, including auth headers
    const articleResponse = await fetch(`https://radiopaedia.org/api/v1/articles/${topResult.id}`, { headers });
    if (!articleResponse.ok) {
        console.error(`(Synapse Wrapper) CKB article fetch failed with status: ${articleResponse.status}`);
        return `Found article "${topResult.title}" but could not fetch its details.`;
    }
    
    const articleData: ClinicalKBArticle = await articleResponse.json();

    if (articleData.synopsis) {
      const cleanSynopsis = articleData.synopsis.replace(/<[^>]+>/g, '').trim();
      return `From the Clinical Knowledge Base (via Synapse API), the definition for "${articleData.title}" is: ${cleanSynopsis}`;
    }

    // Do not expose the direct public URL to align with our proprietary wrapper strategy.
    return `The Clinical Knowledge Base has an article titled "${topResult.title}", but no synopsis is available via the Synapse API.`;

  } catch (error) {
    console.error(`(Synapse Wrapper) Error in searchClinicalKnowledgeBase for term "${term}":`, error);
    return `An error occurred while communicating with the Clinical Knowledge Base for the term "${term}".`;
  }
}

/**
 * Searches a mock pharmaceutical database for information about a drug.
 * @param drugName The brand or generic name of the drug to look up.
 * @returns A promise resolving to a summary of the drug's information.
 */
export async function searchDrugInfo(drugName: string): Promise<string> {
  console.log(`(Synapse Wrapper) Searching Pharmaceutical DB for: "${drugName}"`);

  // This is a MOCK implementation. In a real-world scenario, this would query
  // a licensed pharmaceutical database API (e.g., RxNorm, First Databank).
  const lowerCaseDrugName = drugName.toLowerCase();
  
  const mockDrugDatabase: { [key: string]: any } = {
    "aspirin": { genericName: "Aspirin", brandNames: ["Bayer", "Ecotrin"], indications: "Pain relief, anti-inflammatory, antiplatelet agent for cardiovascular disease prevention." },
    "metformin": { genericName: "Metformin", brandNames: ["Glucophage", "Fortamet"], indications: "Treatment of type 2 diabetes mellitus." },
    "lipitor": { genericName: "Atorvastatin", brandNames: ["Lipitor"], indications: "To lower cholesterol and reduce the risk of cardiovascular events." },
    "atorvastatin": { genericName: "Atorvastatin", brandNames: ["Lipitor"], indications: "To lower cholesterol and reduce the risk of cardiovascular events." },
    "ozempic": { genericName: "Semaglutide", brandNames: ["Ozempic", "Wegovy", "Rybelsus"], indications: "Treatment of type 2 diabetes and for chronic weight management." },
  };

  const foundDrug = Object.keys(mockDrugDatabase).find(key => 
      lowerCaseDrugName.includes(key) ||
      mockDrugDatabase[key].brandNames.some((b: string) => b.toLowerCase() === lowerCaseDrugName)
  );

  if (foundDrug) {
    const drug = mockDrugDatabase[foundDrug];
    return `Found drug info for ${drug.genericName} (Brand(s): ${drug.brandNames.join(", ")}). Primary Indication: ${drug.indications}`;
  }

  return `No information found for the drug "${drugName}" in the pharmaceutical database.`;
}
