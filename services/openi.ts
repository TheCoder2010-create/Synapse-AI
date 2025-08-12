'use server';

/**
 * @fileOverview Service for interacting with Open-i medical image database
 * Open-i provides access to biomedical images from PubMed Central and other sources
 */

interface OpenIImage {
  id: string;
  title: string;
  abstract: string;
  modality: string;
  bodyPart: string;
  diagnosis: string;
  imageUrl: string;
  pmcId: string;
  relevanceScore: number;
}

/**
 * Searches Open-i medical image database for visual examples of radiological findings
 * @param term The radiological finding to search for
 * @returns A promise that resolves to relevant medical images and cases
 */
export async function searchOpenI(term: string): Promise<string> {
  console.log(`Searching Open-i medical image database for: "${term}"`);

  // Mock Open-i database - in production, this would call the actual Open-i API
  const mockImageDatabase: OpenIImage[] = [
    {
      id: "openi_001",
      title: "Spontaneous pneumothorax in young adult",
      abstract: "Chest X-ray showing right-sided pneumothorax with visible pleural line and lung collapse",
      modality: "X-ray",
      bodyPart: "Chest",
      diagnosis: "Spontaneous pneumothorax",
      imageUrl: "https://openi.nlm.nih.gov/imgs/512/123/456/PMC123456_fig1.png",
      pmcId: "PMC123456",
      relevanceScore: 0.95
    },
    {
      id: "openi_002",
      title: "Glioblastoma multiforme with ring enhancement",
      abstract: "T1-weighted post-contrast MRI showing heterogeneously enhancing mass in right frontal lobe",
      modality: "MRI",
      bodyPart: "Brain",
      diagnosis: "Glioblastoma multiforme",
      imageUrl: "https://openi.nlm.nih.gov/imgs/512/789/012/PMC789012_fig2.png",
      pmcId: "PMC789012",
      relevanceScore: 0.92
    },
    {
      id: "openi_003",
      title: "Community-acquired pneumonia with consolidation",
      abstract: "Chest CT showing right lower lobe consolidation with air bronchograms",
      modality: "CT",
      bodyPart: "Chest", 
      diagnosis: "Community-acquired pneumonia",
      imageUrl: "https://openi.nlm.nih.gov/imgs/512/345/678/PMC345678_fig3.png",
      pmcId: "PMC345678",
      relevanceScore: 0.88
    },
    {
      id: "openi_004",
      title: "Pleural effusion with atelectasis",
      abstract: "Chest X-ray demonstrating large right pleural effusion with associated compressive atelectasis",
      modality: "X-ray",
      bodyPart: "Chest",
      diagnosis: "Pleural effusion",
      imageUrl: "https://openi.nlm.nih.gov/imgs/512/901/234/PMC901234_fig1.png",
      pmcId: "PMC901234",
      relevanceScore: 0.85
    },
    {
      id: "openi_005",
      title: "Pancreatic adenocarcinoma with biliary obstruction",
      abstract: "Contrast-enhanced CT showing hypodense pancreatic head mass with biliary dilatation",
      modality: "CT",
      bodyPart: "Abdomen",
      diagnosis: "Pancreatic adenocarcinoma",
      imageUrl: "https://openi.nlm.nih.gov/imgs/512/567/890/PMC567890_fig4.png",
      pmcId: "PMC567890",
      relevanceScore: 0.90
    }
  ];

  // Search for relevant images based on term
  const searchTermLower = term.toLowerCase();
  const relevantImages = mockImageDatabase.filter(image =>
    image.diagnosis.toLowerCase().includes(searchTermLower) ||
    image.title.toLowerCase().includes(searchTermLower) ||
    image.abstract.toLowerCase().includes(searchTermLower) ||
    image.bodyPart.toLowerCase().includes(searchTermLower)
  );

  if (relevantImages.length === 0) {
    return `No relevant medical images found in Open-i database for "${term}". Consider using broader radiological terms or anatomical descriptors.`;
  }

  // Sort by relevance score
  relevantImages.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  const topImages = relevantImages.slice(0, 3);
  
  const summary = topImages.map(image => 
    `• ${image.title} (${image.modality}, ${image.bodyPart})
  Diagnosis: ${image.diagnosis}
  Description: ${image.abstract}
  Reference: ${image.pmcId} (Relevance: ${(image.relevanceScore * 100).toFixed(0)}%)`
  ).join('\n\n');

  return `Found ${topImages.length} relevant medical images in Open-i database for "${term}":

${summary}

These reference images from peer-reviewed literature provide visual examples that support pattern recognition and diagnostic confidence.`;
}

/**
 * Get detailed image metadata and associated publication information
 * @param imageId The Open-i image identifier
 * @returns Detailed image and publication metadata
 */
export async function getOpenIImageDetails(imageId: string): Promise<string> {
  console.log(`Getting Open-i image details for: ${imageId}`);
  
  // In production, this would call: https://openi.nlm.nih.gov/api/image/{imageId}
  
  return `Detailed metadata for Open-i image "${imageId}" would include: image dimensions, DICOM tags, associated publication details, author information, and clinical context from the source publication.`;
}

/**
 * Search for images by specific modality and body part combination
 * @param modality The imaging modality (e.g., "CT", "MRI", "X-ray")
 * @param bodyPart The anatomical region (e.g., "Chest", "Brain", "Abdomen")
 * @param finding Optional specific finding to search for
 * @returns Filtered search results
 */
export async function searchOpenIByModality(
  modality: string, 
  bodyPart: string, 
  finding?: string
): Promise<string> {
  console.log(`Searching Open-i for ${modality} images of ${bodyPart}${finding ? ` with ${finding}` : ''}`);
  
  // This would implement more specific filtering in production
  const searchTerm = finding ? `${finding} ${bodyPart} ${modality}` : `${bodyPart} ${modality}`;
  return await searchOpenI(searchTerm);
}