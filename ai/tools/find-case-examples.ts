'use server';

/**
 * @fileOverview AI tool for finding similar case examples from internal database
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

interface CaseExample {
  caseId: string;
  modality: string;
  findings: string[];
  diagnosis: string;
  confidence: number;
  similarity: number;
}

/**
 * Mock implementation of case similarity search
 * In production, this would query a vector database of case embeddings
 */
async function searchSimilarCases(input: {
  findings: string;
  modality?: string;
  anatomy?: string;
}): Promise<string> {
  console.log(`Searching for similar cases: ${input.findings}`);
  
  // Mock case database with common radiological findings
  const mockCases: CaseExample[] = [
    {
      caseId: "CASE-2024-001",
      modality: "CT",
      findings: ["pneumothorax", "pleural effusion"],
      diagnosis: "Spontaneous pneumothorax with reactive pleural effusion",
      confidence: 0.95,
      similarity: 0.87
    },
    {
      caseId: "CASE-2024-002", 
      modality: "MRI",
      findings: ["brain mass", "periventricular", "enhancement"],
      diagnosis: "Glioblastoma multiforme",
      confidence: 0.92,
      similarity: 0.83
    },
    {
      caseId: "CASE-2024-003",
      modality: "X-ray",
      findings: ["consolidation", "air bronchograms"],
      diagnosis: "Community-acquired pneumonia",
      confidence: 0.89,
      similarity: 0.79
    }
  ];

  // Simple keyword matching for mock implementation
  const relevantCases = mockCases.filter(case_ => 
    input.findings.toLowerCase().split(' ').some(term => 
      case_.findings.some(finding => 
        finding.toLowerCase().includes(term) || term.includes(finding.toLowerCase())
      )
    ) && (!input.modality || case_.modality.toLowerCase() === input.modality.toLowerCase())
  );

  if (relevantCases.length === 0) {
    return `No similar cases found in internal database for findings: "${input.findings}"`;
  }

  // Sort by similarity score
  relevantCases.sort((a, b) => b.similarity - a.similarity);
  
  const topCases = relevantCases.slice(0, 3);
  
  return `Found ${topCases.length} similar cases in internal database:
${topCases.map(case_ => 
  `- Case ${case_.caseId} (${case_.modality}): ${case_.diagnosis} (Similarity: ${(case_.similarity * 100).toFixed(0)}%, Confidence: ${(case_.confidence * 100).toFixed(0)}%)`
).join('\n')}

These cases support the diagnostic consideration and provide precedent for similar imaging findings.`;
}

export const findCaseExamplesTool = ai.defineTool(
  {
    name: 'findCaseExamples',
    description: 'Search internal database of expert-verified cases for similar imaging findings and diagnoses. Use this to find precedent cases that support your diagnostic reasoning.',
    inputSchema: z.object({
      findings: z.string().describe('Key imaging findings to search for (e.g., "pneumothorax pleural effusion")'),
      modality: z.string().optional().describe('Imaging modality to filter by (e.g., "CT", "MRI", "X-ray")'),
      anatomy: z.string().optional().describe('Anatomical region to focus search (e.g., "chest", "brain", "abdomen")')
    }),
    outputSchema: z.string(),
  },
  async (input) => searchSimilarCases(input)
);