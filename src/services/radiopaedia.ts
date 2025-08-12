
'use server';

/**
 * @fileOverview A service for interacting with the Radiopaedia.org API.
 */

interface RadiopaediaSearchResult {
  id: number;
  title: string;
  public_url: string;
}

interface RadiopaediaArticle {
    title: string;
    synopsis: string;
}

/**
 * Searches Radiopaedia for a given term and returns a summary of the top article.
 * @param term The radiological term to search for.
 * @returns A promise that resolves to a definition/summary string or a message indicating the result.
 */
export async function searchRadiopaedia(term: string): Promise<string> {
  const apiKey = process.env.RADIOPAEDIA_API_KEY;

  if (!apiKey) {
    const errorMessage = "Radiopaedia API key is not configured in environment variables (RADIOPAEDIA_API_KEY).";
    console.error(errorMessage);
    // Return a graceful message to the AI flow instead of throwing an error.
    return "Could not connect to the external knowledge base due to a configuration error.";
  }

  if (!term) {
    return "No search term provided.";
  }

  const headers = {
    // Note: Radiopaedia API documentation doesn't specify "Bearer", but it's a common convention.
    // If this fails, it might just be the token itself.
    'Authorization': `${apiKey}` 
  };

  try {
    console.log(`Searching Radiopaedia API for: "${term}"`);
    const searchResponse = await fetch(`https://radiopaedia.org/api/v1/search?q=${encodeURIComponent(term)}&scope=articles`, { headers });
    
    if (!searchResponse.ok) {
      console.error(`Radiopaedia search failed with status: ${searchResponse.status}`);
      return `The search for "${term}" on Radiopaedia failed. The API returned status ${searchResponse.status}.`;
    }
    
    const searchData = await searchResponse.json();
    const articles: RadiopaediaSearchResult[] = searchData.articles;

    if (!articles || articles.length === 0) {
      return `No article found on Radiopaedia for "${term}".`;
    }

    const topResult = articles[0];
    console.log(`Found article: "${topResult.title}" (ID: ${topResult.id}). Fetching details...`);
    
    // Fetch the full article details using the article ID, including auth headers
    const articleResponse = await fetch(`https://radiopaedia.org/api/v1/articles/${topResult.id}`, { headers });
    if (!articleResponse.ok) {
        console.error(`Radiopaedia article fetch failed with status: ${articleResponse.status}`);
        return `Found article "${topResult.title}" but could not fetch its details.`;
    }
    
    const articleData: RadiopaediaArticle = await articleResponse.json();

    if (articleData.synopsis) {
      // Clean up the synopsis a bit
      const cleanSynopsis = articleData.synopsis.replace(/<[^>]+>/g, '').trim();
      return `From Radiopaedia.org, the definition for "${articleData.title}" is: ${cleanSynopsis}`;
    }

    // Do not expose the direct public URL to align with non-commercial use principles.
    return `Radiopaedia.org has an article titled "${topResult.title}", but no synopsis is available via the API.`;

  } catch (error) {
    console.error(`Error in searchRadiopaedia service for term "${term}":`, error);
    return `An error occurred while communicating with Radiopaedia for the term "${term}".`;
  }
}

    