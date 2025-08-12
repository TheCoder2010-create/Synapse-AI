/**
 * @fileOverview Report template validation and quality scoring system
 */

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'cardiac' | 'neuro' | 'chest' | 'abdomen' | 'musculoskeletal';
  modality: string[];
  template: string;
  requiredSections: string[];
  optionalSections: string[];
  placeholders: string[];
  version: string;
  author: string;
  institution?: string;
  lastModified: Date;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  id: string;
  type: 'required_section' | 'required_field' | 'format_check' | 'terminology_check' | 'measurement_validation';
  description: string;
  pattern?: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ReportQualityMetrics {
  overallScore: number; // 0-1
  completeness: number; // 0-1
  clarity: number; // 0-1
  clinicalRelevance: number; // 0-1
  terminologyAccuracy: number; // 0-1
  structuralConsistency: number; // 0-1
  measurementAccuracy: number; // 0-1
}

export interface ValidationResult {
  isValid: boolean;
  qualityScore: ReportQualityMetrics;
  issues: ValidationIssue[];
  suggestions: string[];
  complianceLevel: 'excellent' | 'good' | 'acceptable' | 'needs_improvement' | 'poor';
}

export interface ValidationIssue {
  id: string;
  type: ValidationRule['type'];
  severity: ValidationRule['severity'];
  message: string;
  location?: {
    section?: string;
    line?: number;
    column?: number;
  };
  suggestion?: string;
}

export class ReportTemplateValidator {
  private static instance: ReportTemplateValidator;
  private templates = new Map<string, ReportTemplate>();
  private medicalTerminology = new Set<string>();
  private measurementPatterns = new Map<string, RegExp>();

  static getInstance(): ReportTemplateValidator {
    if (!ReportTemplateValidator.instance) {
      ReportTemplateValidator.instance = new ReportTemplateValidator();
      ReportTemplateValidator.instance.initializeDefaults();
    }
    return ReportTemplateValidator.instance;
  }

  private initializeDefaults(): void {
    // Initialize medical terminology database
    this.medicalTerminology = new Set([
      'pneumothorax', 'pneumonia', 'atelectasis', 'consolidation', 'opacity',
      'enhancement', 'hemorrhage', 'infarct', 'edema', 'mass', 'nodule',
      'cardiomegaly', 'effusion', 'fracture', 'dislocation', 'stenosis',
      'dilatation', 'hypertrophy', 'atrophy', 'ischemia', 'necrosis'
    ]);

    // Initialize measurement patterns
    this.measurementPatterns.set('length', /\d+\.?\d*\s*(mm|cm|m|inches?)/gi);
    this.measurementPatterns.set('area', /\d+\.?\d*\s*(mm²|cm²|m²|sq\s*mm|sq\s*cm)/gi);
    this.measurementPatterns.set('volume', /\d+\.?\d*\s*(ml|cc|l|liters?)/gi);
    this.measurementPatterns.set('angle', /\d+\.?\d*\s*(degrees?|°)/gi);
    this.measurementPatterns.set('ratio', /\d+\.?\d*:\d+\.?\d*|\d+\.?\d*/gi);

    // Load default templates
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates(): void {
    const defaultTemplates: ReportTemplate[] = [
      {
        id: 'chest_ct_standard',
        name: 'Standard Chest CT Report',
        description: 'Standard template for chest CT examinations',
        category: 'chest',
        modality: ['CT'],
        template: `TECHNIQUE:
{{technique}}

COMPARISON:
{{comparison}}

FINDINGS:
Lungs: {{lung_findings}}
Pleura: {{pleural_findings}}
Heart and Great Vessels: {{cardiac_findings}}
Mediastinum: {{mediastinal_findings}}
Bones: {{bone_findings}}

IMPRESSION:
{{impression}}

RECOMMENDATIONS:
{{recommendations}}`,
        requiredSections: ['TECHNIQUE', 'FINDINGS', 'IMPRESSION'],
        optionalSections: ['COMPARISON', 'RECOMMENDATIONS'],
        placeholders: ['technique', 'comparison', 'lung_findings', 'pleural_findings', 'cardiac_findings', 'mediastinal_findings', 'bone_findings', 'impression', 'recommendations'],
        version: '1.0.0',
        author: 'Synapse AI',
        lastModified: new Date(),
        validationRules: [
          {
            id: 'req_technique',
            type: 'required_section',
            description: 'Technique section is required',
            severity: 'error',
            message: 'TECHNIQUE section must be present and non-empty'
          },
          {
            id: 'req_findings',
            type: 'required_section',
            description: 'Findings section is required',
            severity: 'error',
            message: 'FINDINGS section must be present and non-empty'
          },
          {
            id: 'req_impression',
            type: 'required_section',
            description: 'Impression section is required',
            severity: 'error',
            message: 'IMPRESSION section must be present and non-empty'
          }
        ]
      },
      {
        id: 'brain_mri_standard',
        name: 'Standard Brain MRI Report',
        description: 'Standard template for brain MRI examinations',
        category: 'neuro',
        modality: ['MR'],
        template: `TECHNIQUE:
{{technique}}

CLINICAL HISTORY:
{{clinical_history}}

FINDINGS:
Brain Parenchyma: {{brain_findings}}
Ventricular System: {{ventricular_findings}}
Extra-axial Spaces: {{extraaxial_findings}}
Skull and Scalp: {{skull_findings}}

IMPRESSION:
{{impression}}`,
        requiredSections: ['TECHNIQUE', 'FINDINGS', 'IMPRESSION'],
        optionalSections: ['CLINICAL HISTORY'],
        placeholders: ['technique', 'clinical_history', 'brain_findings', 'ventricular_findings', 'extraaxial_findings', 'skull_findings', 'impression'],
        version: '1.0.0',
        author: 'Synapse AI',
        lastModified: new Date(),
        validationRules: [
          {
            id: 'neuro_terminology',
            type: 'terminology_check',
            description: 'Check neurological terminology',
            pattern: '(periventricular|juxtacortical|infratentorial|supratentorial)',
            severity: 'info',
            message: 'Consider using standard neurological terminology'
          }
        ]
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Validate a report template
   */
  validateTemplate(template: ReportTemplate): ValidationResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];

    // Check required sections
    template.requiredSections.forEach(section => {
      if (!template.template.includes(section)) {
        issues.push({
          id: `missing_section_${section}`,
          type: 'required_section',
          severity: 'error',
          message: `Required section "${section}" is missing from template`,
          suggestion: `Add "${section}:" section to the template`
        });
      }
    });

    // Check placeholder consistency
    const templatePlaceholders = this.extractPlaceholders(template.template);
    const undeclaredPlaceholders = templatePlaceholders.filter(p => !template.placeholders.includes(p));
    const unusedPlaceholders = template.placeholders.filter(p => !templatePlaceholders.includes(p));

    undeclaredPlaceholders.forEach(placeholder => {
      issues.push({
        id: `undeclared_placeholder_${placeholder}`,
        type: 'format_check',
        severity: 'warning',
        message: `Placeholder "{{${placeholder}}}" is used but not declared`,
        suggestion: `Add "${placeholder}" to the placeholders array`
      });
    });

    unusedPlaceholders.forEach(placeholder => {
      issues.push({
        id: `unused_placeholder_${placeholder}`,
        type: 'format_check',
        severity: 'info',
        message: `Declared placeholder "${placeholder}" is not used in template`,
        suggestion: `Remove "${placeholder}" from placeholders array or use it in template`
      });
    });

    // Calculate quality metrics
    const qualityScore = this.calculateTemplateQuality(template, issues);
    
    // Determine compliance level
    const complianceLevel = this.determineComplianceLevel(qualityScore, issues);

    // Generate suggestions
    if (qualityScore.completeness < 0.8) {
      suggestions.push('Consider adding more comprehensive section coverage');
    }
    if (qualityScore.structuralConsistency < 0.9) {
      suggestions.push('Review template structure for consistency');
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      qualityScore,
      issues,
      suggestions,
      complianceLevel
    };
  }

  /**
   * Validate a generated report against a template
   */
  validateReport(
    reportContent: string,
    templateId: string,
    additionalContext?: {
      modality?: string;
      anatomy?: string;
      clinicalContext?: string;
    }
  ): ValidationResult {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];

    // Check required sections presence
    template.requiredSections.forEach(section => {
      if (!reportContent.includes(section)) {
        issues.push({
          id: `missing_report_section_${section}`,
          type: 'required_section',
          severity: 'error',
          message: `Required section "${section}" is missing from report`,
          location: { section },
          suggestion: `Add the "${section}" section to the report`
        });
      }
    });

    // Validate medical terminology
    const terminologyIssues = this.validateMedicalTerminology(reportContent);
    issues.push(...terminologyIssues);

    // Validate measurements
    const measurementIssues = this.validateMeasurements(reportContent);
    issues.push(...measurementIssues);

    // Check for empty sections
    const emptySectionIssues = this.checkEmptySections(reportContent);
    issues.push(...emptySectionIssues);

    // Calculate report quality
    const qualityScore = this.calculateReportQuality(reportContent, template, issues, additionalContext);
    
    // Determine compliance level
    const complianceLevel = this.determineComplianceLevel(qualityScore, issues);

    // Generate contextual suggestions
    if (qualityScore.clinicalRelevance < 0.8) {
      suggestions.push('Consider adding more clinically relevant details');
    }
    if (qualityScore.clarity < 0.8) {
      suggestions.push('Improve report clarity and readability');
    }
    if (qualityScore.measurementAccuracy < 0.9) {
      suggestions.push('Review measurement accuracy and units');
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      qualityScore,
      issues,
      suggestions,
      complianceLevel
    };
  }

  private extractPlaceholders(template: string): string[] {
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders: string[] = [];
    let match;

    while ((match = placeholderRegex.exec(template)) !== null) {
      placeholders.push(match[1].trim());
    }

    return [...new Set(placeholders)];
  }

  private validateMedicalTerminology(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const words = content.toLowerCase().split(/\s+/);
    
    // Check for potential medical terms that might be misspelled
    const potentialMedicalTerms = words.filter(word => 
      word.length > 6 && 
      (word.includes('osis') || word.includes('itis') || word.includes('oma') || word.includes('pathy'))
    );

    potentialMedicalTerms.forEach(term => {
      if (!this.medicalTerminology.has(term)) {
        // Check if it's close to a known term (simple Levenshtein distance check)
        const closestTerm = this.findClosestMedicalTerm(term);
        if (closestTerm) {
          issues.push({
            id: `terminology_${term}`,
            type: 'terminology_check',
            severity: 'warning',
            message: `Potential terminology issue: "${term}"`,
            suggestion: `Did you mean "${closestTerm}"?`
          });
        }
      }
    });

    return issues;
  }

  private validateMeasurements(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Check for measurements without units
    const numberWithoutUnit = /\b\d+\.?\d*\b(?!\s*(mm|cm|m|ml|cc|l|degrees?|°|:))/gi;
    const matches = content.match(numberWithoutUnit);
    
    if (matches) {
      matches.forEach(match => {
        if (parseFloat(match) > 0) { // Ignore zero and negative numbers
          issues.push({
            id: `measurement_no_unit_${match}`,
            type: 'measurement_validation',
            severity: 'warning',
            message: `Measurement "${match}" appears to be missing units`,
            suggestion: 'Add appropriate units (mm, cm, ml, etc.)'
          });
        }
      });
    }

    // Check for unrealistic measurements
    const lengthMeasurements = content.match(/(\d+\.?\d*)\s*(mm|cm)/gi);
    if (lengthMeasurements) {
      lengthMeasurements.forEach(measurement => {
        const [, value, unit] = measurement.match(/(\d+\.?\d*)\s*(mm|cm)/i) || [];
        const numValue = parseFloat(value);
        
        if (unit.toLowerCase() === 'cm' && numValue > 50) {
          issues.push({
            id: `unrealistic_measurement_${measurement}`,
            type: 'measurement_validation',
            severity: 'warning',
            message: `Measurement "${measurement}" seems unusually large`,
            suggestion: 'Verify measurement accuracy'
          });
        }
      });
    }

    return issues;
  }

  private checkEmptySections(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const sectionRegex = /^([A-Z\s]+):\s*$/gm;
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
      const sectionName = match[1].trim();
      const nextSectionIndex = content.indexOf('\n', match.index + match[0].length);
      const nextSection = content.substring(match.index + match[0].length, nextSectionIndex);
      
      if (nextSection.trim() === '') {
        issues.push({
          id: `empty_section_${sectionName}`,
          type: 'required_field',
          severity: 'warning',
          message: `Section "${sectionName}" appears to be empty`,
          location: { section: sectionName },
          suggestion: `Add content to the "${sectionName}" section`
        });
      }
    }

    return issues;
  }

  private calculateTemplateQuality(template: ReportTemplate, issues: ValidationIssue[]): ReportQualityMetrics {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    const completeness = Math.max(0, 1 - (errorCount * 0.2 + warningCount * 0.1));
    const structuralConsistency = template.placeholders.length > 0 ? 
      Math.min(1, this.extractPlaceholders(template.template).length / template.placeholders.length) : 0.5;
    
    const clarity = Math.max(0, 1 - (issues.filter(i => i.type === 'format_check').length * 0.1));
    const terminologyAccuracy = 0.9; // Default for templates
    const clinicalRelevance = template.requiredSections.length >= 3 ? 0.9 : 0.7;
    const measurementAccuracy = 0.9; // Default for templates

    const overallScore = (
      completeness * 0.25 +
      structuralConsistency * 0.20 +
      clarity * 0.15 +
      terminologyAccuracy * 0.15 +
      clinicalRelevance * 0.15 +
      measurementAccuracy * 0.10
    );

    return {
      overallScore,
      completeness,
      clarity,
      clinicalRelevance,
      terminologyAccuracy,
      structuralConsistency,
      measurementAccuracy
    };
  }

  private calculateReportQuality(
    content: string,
    template: ReportTemplate,
    issues: ValidationIssue[],
    context?: { modality?: string; anatomy?: string; clinicalContext?: string }
  ): ReportQualityMetrics {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    const completeness = Math.max(0, 1 - (errorCount * 0.15 + warningCount * 0.05));
    
    const terminologyIssues = issues.filter(i => i.type === 'terminology_check').length;
    const terminologyAccuracy = Math.max(0, 1 - (terminologyIssues * 0.1));
    
    const measurementIssues = issues.filter(i => i.type === 'measurement_validation').length;
    const measurementAccuracy = Math.max(0, 1 - (measurementIssues * 0.15));
    
    // Assess clarity based on content structure and readability
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    const clarity = avgSentenceLength > 30 ? 0.7 : avgSentenceLength < 10 ? 0.8 : 0.9;
    
    // Assess clinical relevance based on content depth and context
    const wordCount = content.split(/\s+/).length;
    const clinicalRelevance = wordCount < 50 ? 0.6 : wordCount > 200 ? 0.9 : 0.8;
    
    const structuralConsistency = template.requiredSections.every(section => 
      content.includes(section)
    ) ? 0.9 : 0.7;

    const overallScore = (
      completeness * 0.25 +
      terminologyAccuracy * 0.20 +
      measurementAccuracy * 0.15 +
      clarity * 0.15 +
      clinicalRelevance * 0.15 +
      structuralConsistency * 0.10
    );

    return {
      overallScore,
      completeness,
      clarity,
      clinicalRelevance,
      terminologyAccuracy,
      structuralConsistency,
      measurementAccuracy
    };
  }

  private determineComplianceLevel(
    qualityScore: ReportQualityMetrics,
    issues: ValidationIssue[]
  ): ValidationResult['complianceLevel'] {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    
    if (errorCount > 0) {
      return 'poor';
    }
    
    if (qualityScore.overallScore >= 0.9) {
      return 'excellent';
    } else if (qualityScore.overallScore >= 0.8) {
      return 'good';
    } else if (qualityScore.overallScore >= 0.7) {
      return 'acceptable';
    } else {
      return 'needs_improvement';
    }
  }

  private findClosestMedicalTerm(term: string): string | null {
    let closestTerm: string | null = null;
    let minDistance = Infinity;

    for (const medicalTerm of this.medicalTerminology) {
      const distance = this.levenshteinDistance(term, medicalTerm);
      if (distance < minDistance && distance <= 2) { // Allow up to 2 character differences
        minDistance = distance;
        closestTerm = medicalTerm;
      }
    }

    return closestTerm;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get available templates
   */
  getTemplates(filters?: {
    category?: ReportTemplate['category'];
    modality?: string;
  }): ReportTemplate[] {
    let templates = Array.from(this.templates.values());

    if (filters?.category) {
      templates = templates.filter(t => t.category === filters.category);
    }

    if (filters?.modality) {
      templates = templates.filter(t => t.modality.includes(filters.modality!));
    }

    return templates.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Add or update a template
   */
  addTemplate(template: ReportTemplate): ValidationResult {
    const validation = this.validateTemplate(template);
    
    if (validation.isValid) {
      this.templates.set(template.id, template);
    }
    
    return validation;
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ReportTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Generate quality report for all templates
   */
  generateQualityReport(): {
    totalTemplates: number;
    averageQuality: number;
    complianceDistribution: Record<ValidationResult['complianceLevel'], number>;
    commonIssues: Array<{ type: string; count: number }>;
  } {
    const templates = Array.from(this.templates.values());
    const validations = templates.map(t => this.validateTemplate(t));
    
    const totalTemplates = templates.length;
    const averageQuality = validations.reduce((sum, v) => sum + v.qualityScore.overallScore, 0) / totalTemplates;
    
    const complianceDistribution = validations.reduce((acc, v) => {
      acc[v.complianceLevel] = (acc[v.complianceLevel] || 0) + 1;
      return acc;
    }, {} as Record<ValidationResult['complianceLevel'], number>);
    
    const allIssues = validations.flatMap(v => v.issues);
    const issueTypeCounts = allIssues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonIssues = Object.entries(issueTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalTemplates,
      averageQuality,
      complianceDistribution,
      commonIssues
    };
  }
}