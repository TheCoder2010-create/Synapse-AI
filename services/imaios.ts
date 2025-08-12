'use server';

/**
 * @fileOverview Service for interacting with IMAIOS e-Anatomy atlas
 * IMAIOS provides detailed anatomical definitions and 3D anatomical references
 */

interface AnatomicalStructure {
  name: string;
  definition: string;
  synonyms: string[];
  location: string;
  clinicalSignificance: string;
}

/**
 * Searches IMAIOS e-Anatomy for detailed anatomical structure definitions
 * @param term The anatomical term to search for
 * @returns A promise that resolves to anatomical definition and context
 */
export async function searchImaiosAnatomy(term: string): Promise<string> {
  const apiKey = process.env.IMAIOS_API_KEY;
  
  if (!apiKey) {
    console.warn("IMAIOS API key not configured");
    return "IMAIOS e-Anatomy service is not configured. Unable to provide detailed anatomical definitions.";
  }

  console.log(`Searching IMAIOS e-Anatomy for: "${term}"`);

  // Mock anatomical database - in production, this would call the IMAIOS API
  const mockAnatomicalData: { [key: string]: AnatomicalStructure } = {
    "periventricular": {
      name: "Periventricular region",
      definition: "The area surrounding the cerebral ventricles, containing white matter tracts and ependymal lining",
      synonyms: ["periventricular white matter", "ventricular border zone"],
      location: "Adjacent to lateral, third, and fourth ventricles of the brain",
      clinicalSignificance: "Common site for white matter lesions in multiple sclerosis, small vessel disease, and periventricular leukomalacia"
    },
    "juxtacortical": {
      name: "Juxtacortical region", 
      definition: "The subcortical white matter immediately adjacent to the cerebral cortex",
      synonyms: ["subcortical", "cortical-subcortical junction"],
      location: "Interface between gray matter cortex and deeper white matter",
      clinicalSignificance: "Important location for multiple sclerosis lesions and cortical-subcortical pathology"
    },
    "mediastinum": {
      name: "Mediastinum",
      definition: "The central compartment of the thoracic cavity containing the heart, great vessels, trachea, esophagus, and lymph nodes",
      synonyms: ["mediastinal space", "middle mediastinum"],
      location: "Between the lungs, bounded by sternum anteriorly and vertebral column posteriorly",
      clinicalSignificance: "Critical anatomical region for staging lung cancer, assessing cardiac pathology, and evaluating vascular abnormalities"
    },
    "retroperitoneum": {
      name: "Retroperitoneum",
      definition: "The anatomical space behind the peritoneum containing kidneys, adrenals, pancreas, and major vessels",
      synonyms: ["retroperitoneal space", "posterior abdominal wall"],
      location: "Posterior to the parietal peritoneum, anterior to the posterior abdominal wall muscles",
      clinicalSignificance: "Important for staging abdominal malignancies and assessing renal and pancreatic pathology"
    }
  };

  // Search for matching anatomical terms
  const searchTermLower = term.toLowerCase();
  const matchingStructures = Object.entries(mockAnatomicalData).filter(([key, structure]) =>
    key.toLowerCase().includes(searchTermLower) ||
    structure.name.toLowerCase().includes(searchTermLower) ||
    structure.synonyms.some(synonym => synonym.toLowerCase().includes(searchTermLower))
  );

  if (matchingStructures.length === 0) {
    return `No anatomical definition found in IMAIOS e-Anatomy for "${term}". Consider using standard anatomical terminology or broader anatomical regions.`;
  }

  const [, structure] = matchingStructures[0];
  
  return `IMAIOS e-Anatomy definition for "${structure.name}":

Definition: ${structure.definition}

Anatomical Location: ${structure.location}

Clinical Significance: ${structure.clinicalSignificance}

Synonyms: ${structure.synonyms.join(', ')}

This anatomical context helps localize findings and understand their clinical implications.`;
}

/**
 * Get anatomical relationships and neighboring structures
 * @param anatomicalTerm The anatomical structure to analyze
 * @returns Information about related anatomical structures
 */
export async function getAnatomicalRelationships(anatomicalTerm: string): Promise<string> {
  console.log(`Getting anatomical relationships for: ${anatomicalTerm}`);
  
  // Mock implementation - in production would use IMAIOS 3D anatomical data
  const relationships = {
    "mediastinum": "Adjacent to: lungs (bilateral), heart (central), great vessels (aorta, vena cava), trachea and bronchi",
    "retroperitoneum": "Contains: kidneys, adrenal glands, pancreas, aorta, IVC. Adjacent to: peritoneal cavity (anterior), psoas muscles (posterior)",
    "periventricular": "Surrounds: lateral ventricles, third ventricle, fourth ventricle. Contains: corona radiata, internal capsule fibers"
  };

  const termLower = anatomicalTerm.toLowerCase();
  const relationship = Object.entries(relationships).find(([key]) => 
    termLower.includes(key) || key.includes(termLower)
  );

  if (relationship) {
    return `Anatomical relationships for ${anatomicalTerm}: ${relationship[1]}`;
  }

  return `Anatomical relationship data not available for "${anatomicalTerm}" in current database.`;
}