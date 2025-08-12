'use server';

/**
 * @fileOverview Service for interacting with XNAT imaging platform
 * XNAT provides access to internal/private imaging datasets and research projects
 */

interface XNATProject {
  id: string;
  name: string;
  description: string;
  pi: string; // Principal Investigator
  subjectCount: number;
  sessionCount: number;
  modalities: string[];
  anatomy: string[];
  status: 'active' | 'completed' | 'archived';
  lastModified: string;
}

interface XNATSubject {
  id: string;
  projectId: string;
  label: string;
  demographics: {
    age?: number;
    sex?: 'M' | 'F';
  };
  sessionCount: number;
  diagnosis?: string;
}

/**
 * Searches XNAT server for projects related to specific terms
 * @param term The search term for project names, descriptions, or keywords
 * @returns A promise that resolves to relevant XNAT projects
 */
export async function searchXNAT(term: string): Promise<string> {
  const xnatHost = process.env.XNAT_HOST;
  const xnatUser = process.env.XNAT_USER;
  const xnatPass = process.env.XNAT_PASS;

  if (!xnatHost || !xnatUser || !xnatPass) {
    console.warn("XNAT configuration not complete");
    return "XNAT server access is not configured. Unable to search internal imaging projects.";
  }

  console.log(`Searching XNAT projects for: "${term}"`);

  // Mock XNAT projects - in production, this would call the actual XNAT REST API
  const mockProjects: XNATProject[] = [
    {
      id: "BRAIN_TUMOR_2024",
      name: "Brain Tumor Classification Study",
      description: "Multi-institutional study of brain tumor imaging patterns with histological correlation",
      pi: "Dr. Sarah Johnson",
      subjectCount: 245,
      sessionCount: 487,
      modalities: ["MR", "CT"],
      anatomy: ["Brain"],
      status: "active",
      lastModified: "2024-01-15"
    },
    {
      id: "LUNG_SCREENING_2023",
      name: "Lung Cancer Screening Cohort",
      description: "Longitudinal lung cancer screening study with low-dose CT",
      pi: "Dr. Michael Chen",
      subjectCount: 1024,
      sessionCount: 3072,
      modalities: ["CT"],
      anatomy: ["Chest", "Lung"],
      status: "active",
      lastModified: "2024-01-20"
    },
    {
      id: "CARDIAC_MRI_2023",
      name: "Cardiac Function Assessment",
      description: "Cardiac MRI study evaluating ventricular function and myocardial perfusion",
      pi: "Dr. Emily Rodriguez",
      subjectCount: 156,
      sessionCount: 312,
      modalities: ["MR"],
      anatomy: ["Heart", "Chest"],
      status: "completed",
      lastModified: "2023-12-30"
    },
    {
      id: "PEDIATRIC_NEURO_2024",
      name: "Pediatric Neuroimaging Database",
      description: "Comprehensive pediatric brain imaging database with developmental assessments",
      pi: "Dr. James Wilson",
      subjectCount: 89,
      sessionCount: 267,
      modalities: ["MR", "CT"],
      anatomy: ["Brain"],
      status: "active",
      lastModified: "2024-01-18"
    }
  ];

  // Search for relevant projects
  const searchTermLower = term.toLowerCase();
  const relevantProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(searchTermLower) ||
    project.description.toLowerCase().includes(searchTermLower) ||
    project.anatomy.some(anat => anat.toLowerCase().includes(searchTermLower)) ||
    project.modalities.some(mod => mod.toLowerCase().includes(searchTermLower)) ||
    (searchTermLower.includes('brain') && project.anatomy.includes('Brain')) ||
    (searchTermLower.includes('lung') && project.anatomy.includes('Lung')) ||
    (searchTermLower.includes('cardiac') && project.anatomy.includes('Heart'))
  );

  if (relevantProjects.length === 0) {
    return `No relevant XNAT projects found for "${term}". Consider searching for broader anatomical terms or imaging modalities.`;
  }

  const summary = relevantProjects.map(project => 
    `• ${project.name} (${project.id})
  PI: ${project.pi}
  Description: ${project.description}
  Data: ${project.subjectCount} subjects, ${project.sessionCount} sessions
  Modalities: ${project.modalities.join(', ')}
  Anatomy: ${project.anatomy.join(', ')}
  Status: ${project.status}
  Last Modified: ${project.lastModified}`
  ).join('\n\n');

  return `Found ${relevantProjects.length} relevant XNAT project(s) for "${term}":

${summary}

These internal research projects may contain similar cases and imaging protocols that can inform diagnostic decisions.`;
}

/**
 * Get detailed project information including subject demographics
 * @param projectId The XNAT project identifier
 * @returns Detailed project information
 */
export async function getXNATProjectDetails(projectId: string): Promise<string> {
  console.log(`Getting XNAT project details for: ${projectId}`);
  
  // In production, this would call: {XNAT_HOST}/data/projects/{projectId}
  
  return `Detailed information for XNAT project "${projectId}" would include: complete subject list, session details, imaging protocols, clinical annotations, and data quality metrics.`;
}

/**
 * Search for subjects within XNAT projects based on criteria
 * @param criteria Search criteria including demographics, diagnosis, etc.
 * @returns Matching subjects across projects
 */
export async function searchXNATSubjects(criteria: {
  diagnosis?: string;
  ageRange?: [number, number];
  sex?: 'M' | 'F';
  modality?: string;
  anatomy?: string;
}): Promise<string> {
  console.log(`Searching XNAT subjects with criteria:`, criteria);
  
  // Mock subject search results
  const mockResults = [
    {
      projectId: "BRAIN_TUMOR_2024",
      subjectId: "BT_001",
      diagnosis: criteria.diagnosis || "Glioblastoma",
      age: 45,
      sex: "M" as const,
      sessionCount: 3
    },
    {
      projectId: "BRAIN_TUMOR_2024", 
      subjectId: "BT_002",
      diagnosis: criteria.diagnosis || "Meningioma",
      age: 52,
      sex: "F" as const,
      sessionCount: 2
    }
  ];

  const summary = mockResults.map(subject =>
    `• Subject ${subject.subjectId} (Project: ${subject.projectId})
  Diagnosis: ${subject.diagnosis}
  Demographics: ${subject.age}y ${subject.sex}
  Sessions: ${subject.sessionCount}`
  ).join('\n\n');

  return `Found ${mockResults.length} matching subjects in XNAT database:

${summary}

These subjects provide clinical context and imaging examples for similar patient populations.`;
}

/**
 * Get imaging session details for a specific subject
 * @param projectId The XNAT project ID
 * @param subjectId The subject identifier
 * @returns Session details and imaging data
 */
export async function getXNATSubjectSessions(projectId: string, subjectId: string): Promise<string> {
  console.log(`Getting XNAT sessions for subject ${subjectId} in project ${projectId}`);
  
  // In production: {XNAT_HOST}/data/projects/{projectId}/subjects/{subjectId}/experiments
  
  return `Session details for subject "${subjectId}" in project "${projectId}" would include: scan dates, imaging protocols, sequence parameters, and associated clinical data.`;
}