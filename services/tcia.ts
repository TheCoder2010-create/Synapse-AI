'use server';

/**
 * @fileOverview Service for interacting with The Cancer Imaging Archive (TCIA) API
 * TCIA provides public access to large archives of medical images of cancer
 */

interface TCIACollection {
  Collection: string;
  Description: string;
  Species: string;
  BodyPartExamined: string;
  Modality: string;
  ImageCount: number;
  PatientCount: number;
}

/**
 * Searches TCIA for imaging collections relevant to a specific cancer type or finding
 * @param term The cancer type or radiological finding to search for
 * @returns A promise that resolves to a summary of matching collections
 */
export async function searchTCIADatasets(term: string): Promise<string> {
  console.log(`Searching TCIA datasets for: "${term}"`);

  // Mock TCIA collections data - in production, this would call the actual TCIA API
  const mockCollections: TCIACollection[] = [
    {
      Collection: "TCGA-GBM",
      Description: "Glioblastoma Multiforme cases from The Cancer Genome Atlas",
      Species: "Human",
      BodyPartExamined: "BRAIN",
      Modality: "MR",
      ImageCount: 15420,
      PatientCount: 262
    },
    {
      Collection: "TCGA-LUAD", 
      Description: "Lung Adenocarcinoma cases with CT imaging",
      Species: "Human",
      BodyPartExamined: "CHEST",
      Modality: "CT",
      ImageCount: 8934,
      PatientCount: 154
    },
    {
      Collection: "LIDC-IDRI",
      Description: "Lung Image Database Consortium image collection",
      Species: "Human", 
      BodyPartExamined: "CHEST",
      Modality: "CT",
      ImageCount: 244527,
      PatientCount: 1018
    },
    {
      Collection: "TCGA-BRCA",
      Description: "Breast Invasive Carcinoma imaging collection",
      Species: "Human",
      BodyPartExamined: "BREAST",
      Modality: "MR",
      ImageCount: 3103,
      PatientCount: 139
    }
  ];

  // Simple keyword matching for mock implementation
  const searchTermLower = term.toLowerCase();
  const relevantCollections = mockCollections.filter(collection => 
    collection.Collection.toLowerCase().includes(searchTermLower) ||
    collection.Description.toLowerCase().includes(searchTermLower) ||
    collection.BodyPartExamined.toLowerCase().includes(searchTermLower) ||
    (searchTermLower.includes('lung') && collection.BodyPartExamined === 'CHEST') ||
    (searchTermLower.includes('brain') && collection.BodyPartExamined === 'BRAIN') ||
    (searchTermLower.includes('glioma') && collection.Collection.includes('GBM')) ||
    (searchTermLower.includes('adenocarcinoma') && collection.Collection.includes('LUAD'))
  );

  if (relevantCollections.length === 0) {
    return `No relevant imaging collections found in TCIA for "${term}". Consider searching for broader anatomical terms or cancer types.`;
  }

  const summary = relevantCollections.map(collection => 
    `${collection.Collection}: ${collection.Description} (${collection.PatientCount} patients, ${collection.ImageCount} images, ${collection.Modality} modality)`
  ).join('\n');

  return `Found ${relevantCollections.length} relevant TCIA imaging collection(s) for "${term}":

${summary}

These public research datasets provide reference imaging patterns and can support diagnostic considerations for similar cases.`;
}

/**
 * Get detailed information about a specific TCIA collection
 * @param collectionName The name of the TCIA collection
 * @returns Detailed collection information
 */
export async function getTCIACollectionDetails(collectionName: string): Promise<string> {
  console.log(`Getting TCIA collection details for: ${collectionName}`);
  
  // In production, this would call: https://services.cancerimagingarchive.net/services/v4/TCIA/query/getCollectionValues
  
  return `Detailed information for TCIA collection "${collectionName}" would be retrieved from the TCIA API. This includes imaging protocols, patient demographics, and clinical annotations.`;
}