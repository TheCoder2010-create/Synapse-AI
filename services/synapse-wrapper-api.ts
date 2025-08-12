
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
 * Searches the comprehensive Synapse knowledge base for a given term.
 * This function is part of the proprietary Synapse Wrapper API.
 * It searches both the local knowledge base and live Radiopaedia API.
 * @param term The radiological term to search for.
 * @returns A promise that resolves to a comprehensive definition/summary string.
 */
export async function searchClinicalKnowledgeBase(term: string): Promise<string> {
  if (!term) {
    return "No search term provided.";
  }

  console.log(`(Synapse Wrapper) Searching comprehensive knowledge base for: "${term}"`);

  try {
    // First, search our local knowledge base
    const localResults = await searchLocalKnowledgeBase(term);
    
    // If we have good local results, use them
    if (localResults && localResults.confidence > 0.8) {
      return localResults.response;
    }

    // Fallback to live Radiopaedia API search
    const liveResults = await searchLiveRadiopaedia(term);
    
    // Combine results if we have both
    if (localResults && liveResults) {
      return `${localResults.response}\n\nAdditional information: ${liveResults}`;
    }
    
    return liveResults || localResults?.response || `No comprehensive information found for "${term}".`;

  } catch (error) {
    console.error(`(Synapse Wrapper) Error in comprehensive knowledge base search for term "${term}":`, error);
    return `An error occurred while searching the knowledge base for "${term}". Please try again.`;
  }
}

/**
 * Search the local Radiopaedia knowledge base
 */
async function searchLocalKnowledgeBase(term: string): Promise<{
  response: string;
  confidence: number;
} | null> {
  try {
    // Import knowledge base DB
    const { KnowledgeBaseDB } = await import('./knowledge-base-db');
    
    // Get knowledge base instance
    const knowledgeDB = KnowledgeBaseDB.getInstance();
    
    // Search the knowledge base
    const searchResults = await knowledgeDB.search({
      text: term,
      limit: 3,
      semantic_search: true
    });
    
    if (searchResults.entries.length === 0) {
      return null;
    }
    
    // Format comprehensive response
    const topResult = searchResults.entries[0];
    let response = `From Synapse Knowledge Base: "${topResult.title}"\n\n`;
    
    // Add content
    const content = topResult.content.length > 300 ? 
      topResult.content.substring(0, 300) + '...' : 
      topResult.content;
    response += `Definition: ${content}\n\n`;
    
    // Add imaging information
    if (topResult.metadata.modality && topResult.metadata.modality.length > 0) {
      response += `Common Modalities: ${topResult.metadata.modality.join(', ')}\n\n`;
    }
    
    if (topResult.metadata.pathology && topResult.metadata.pathology.length > 0) {
      response += `Pathology: ${topResult.metadata.pathology.join(', ')}\n\n`;
    }
    
    if (topResult.metadata.system) {
      response += `System: ${topResult.metadata.system}\n\n`;
    }
    
    // Add case information if available
    const caseEntries = searchResults.entries.filter((e: any) => e.type === 'case');
    if (caseEntries.length > 0) {
      response += `Related Cases: ${caseEntries.length} documented cases available for reference\n\n`;
    }
    
    // Add image information
    const totalImages = searchResults.entries.reduce((sum: number, entry: any) => sum + (entry.images?.length || 0), 0);
    if (totalImages > 0) {
      response += `Reference Images: ${totalImages} annotated medical images available\n\n`;
    }
    
    response += `Views: ${topResult.metadata.views} | Last Updated: ${topResult.metadata.updated_at.toLocaleDateString()}`;
    
    // Calculate confidence based on search results
    const confidence = Math.min(1.0, searchResults.entries.length > 0 ? 0.9 : 0.5);
    
    return { response, confidence };
    
  } catch (error) {
    console.error('Local knowledge base search failed:', error);
    return null;
  }
}

/**
 * Search live Radiopaedia API (fallback)
 */
async function searchLiveRadiopaedia(term: string): Promise<string | null> {
  const apiKey = process.env.RADIOPAEDIA_API_KEY;

  if (!apiKey) {
    console.warn("Radiopaedia API key not configured, skipping live search");
    return null;
  }

  const headers = {
    'Authorization': `${apiKey}` 
  };

  try {
    console.log(`(Synapse Wrapper) Searching live Radiopaedia API for: "${term}"`);
    
    const searchResponse = await fetch(`https://radiopaedia.org/api/v1/search?q=${encodeURIComponent(term)}&scope=articles`, { headers });
    
    if (!searchResponse.ok) {
      console.error(`Live Radiopaedia search failed with status: ${searchResponse.status}`);
      return null;
    }
    
    const searchData = await searchResponse.json();
    const articles: ClinicalKBArticleSearchResult[] = searchData.articles;

    if (!articles || articles.length === 0) {
      return null;
    }

    const topResult = articles[0];
    
    // Fetch the full article details
    const articleResponse = await fetch(`https://radiopaedia.org/api/v1/articles/${topResult.id}`, { headers });
    if (!articleResponse.ok) {
        return `Found article "${topResult.title}" but could not fetch details from live API.`;
    }
    
    const articleData: ClinicalKBArticle = await articleResponse.json();

    if (articleData.synopsis) {
      const cleanSynopsis = articleData.synopsis.replace(/<[^>]+>/g, '').trim();
      return `From Live Radiopaedia API: "${articleData.title}" - ${cleanSynopsis}`;
    }

    return `Found article "${topResult.title}" on live Radiopaedia but no synopsis available.`;

  } catch (error) {
    console.error(`Live Radiopaedia search failed for term "${term}":`, error);
    return null;
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
