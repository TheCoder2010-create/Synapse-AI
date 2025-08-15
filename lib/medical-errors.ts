/**
 * @fileOverview Medical-specific error types and handling for Synapse AI
 */

import { config } from "process";

import { ai } from "@/ai/genkit";

import { max } from "date-fns";

import { ai } from "@/ai/genkit";

export enum MedicalErrorCode {
    // Image Quality Issues
    INSUFFICIENT_IMAGE_QUALITY = 'INSUFFICIENT_IMAGE_QUALITY',
    NON_DIAGNOSTIC_IMAGE = 'NON_DIAGNOSTIC_IMAGE',
    MOTION_ARTIFACTS = 'MOTION_ARTIFACTS',
    CONTRAST_TIMING_ISSUE = 'CONTRAST_TIMING_ISSUE',

    // Diagnostic Issues
    AMBIGUOUS_FINDINGS = 'AMBIGUOUS_FINDINGS',
    CONFLICTING_EVIDENCE = 'CONFLICTING_EVIDENCE',
    INSUFFICIENT_CLINICAL_CONTEXT = 'INSUFFICIENT_CLINICAL_CONTEXT',
    RARE_CONDITION_DETECTED = 'RARE_CONDITION_DETECTED',

    // Knowledge Base Issues
    KNOWLEDGE_BASE_UNAVAILABLE = 'KNOWLEDGE_BASE_UNAVAILABLE',
    EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
    REFERENCE_DATA_INCOMPLETE = 'REFERENCE_DATA_INCOMPLETE',

    // AI Model Issues
    MODEL_CONFIDENCE_LOW = 'MODEL_CONFIDENCE_LOW',
    MODEL_PROCESSING_ERROR = 'MODEL_PROCESSING_ERROR',
    SEGMENTATION_FAILED = 'SEGMENTATION_FAILED',

    // Clinical Safety Issues
    CRITICAL_FINDING_UNCERTAIN = 'CRITICAL_FINDING_UNCERTAIN',
    URGENT_REVIEW_REQUIRED = 'URGENT_REVIEW_REQUIRED',
    MEASUREMENT_OUT_OF_RANGE = 'MEASUREMENT_OUT_OF_RANGE',

    // System Issues
    PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
    RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
    CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export enum MedicalErrorSeverity {
    LOW = 'LOW',           // Minor issues, doesn't affect diagnosis
    MEDIUM = 'MEDIUM',     // May affect diagnosis quality
    HIGH = 'HIGH',         // Significantly affects diagnosis
    CRITICAL = 'CRITICAL'  // Patient safety concern
}

export class MedicalAIError extends Error {
    public readonly code: MedicalErrorCode;
    public readonly severity: MedicalErrorSeverity;
    public readonly context: Record<string, any>;
    public readonly timestamp: Date;
    public readonly retryable: boolean;
    public readonly patientSafetyImpact: boolean;

    constructor(
        message: string,
        code: MedicalErrorCode,
        severity: MedicalErrorSeverity,
        context: Record<string, any> = {},
        retryable: boolean = true
    ) {
        super(message);
        this.name = 'MedicalAIError';
        this.code = code;
        this.severity = severity;
        this.context = context;
        this.timestamp = new Date();
        this.retryable = retryable;
        this.patientSafetyImpact = this.assessPatientSafetyImpact();
    }

    private assessPatientSafetyImpact(): boolean {
        const safetyImpactCodes = [
            MedicalErrorCode.CRITICAL_FINDING_UNCERTAIN,
            MedicalErrorCode.URGENT_REVIEW_REQUIRED,
            MedicalErrorCode.NON_DIAGNOSTIC_IMAGE,
            MedicalErrorCode.MEASUREMENT_OUT_OF_RANGE
        ];

        return safetyImpactCodes.includes(this.code) || this.severity === MedicalErrorSeverity.CRITICAL;
    }

    public toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            severity: this.severity,
            context: this.context,
            timestamp: this.timestamp.toISOString(),
            retryable: this.retryable,
            patientSafetyImpact: this.patientSafetyImpact,
            stack: this.stack
        };
    }
}

export class ImageQualityError extends MedicalAIError {
    constructor(message: string, qualityIssue: string, context: Record<string, any> = {}) {
        super(
            message,
            MedicalErrorCode.INSUFFICIENT_IMAGE_QUALITY,
            MedicalErrorSeverity.HIGH,
            { qualityIssue, ...context },
            false // Image quality issues are typically not retryable
        );
    }
}

export class DiagnosticUncertaintyError extends MedicalAIError {
    constructor(
        message: string,
        uncertaintyType: 'ambiguous' | 'conflicting' | 'insufficient_context',
        confidence: number,
        context: Record<string, any> = {}
    ) {
        const code = uncertaintyType === 'ambiguous' ? MedicalErrorCode.AMBIGUOUS_FINDINGS :
            uncertaintyType === 'conflicting' ? MedicalErrorCode.CONFLICTING_EVIDENCE :
                MedicalErrorCode.INSUFFICIENT_CLINICAL_CONTEXT;

        const severity = confidence < 0.3 ? MedicalErrorSeverity.CRITICAL :
            confidence < 0.5 ? MedicalErrorSeverity.HIGH :
                MedicalErrorSeverity.MEDIUM;

        super(message, code, severity, { uncertaintyType, confidence, ...context }, true);
    }
}

export class CriticalFindingError extends MedicalAIError {
    constructor(
        message: string,
        finding: string,
        urgencyLevel: 'urgent' | 'emergent',
        context: Record<string, any> = {}
    ) {
        super(
            message,
            MedicalErrorCode.URGENT_REVIEW_REQUIRED,
            MedicalErrorSeverity.CRITICAL,
            { finding, urgencyLevel, ...context },
            false // Critical findings should not be retried without review
        );
    }
}

export class KnowledgeBaseError extends MedicalAIError {
    constructor(
        message: string,
        service: string,
        context: Record<string, any> = {}
    ) {
        super(
            message,
            MedicalErrorCode.KNOWLEDGE_BASE_UNAVAILABLE,
            MedicalErrorSeverity.MEDIUM,
            { service, ...context },
            true
        );
    }
}

/**
 * Enhanced retry logic with medical context awareness
 */
export interface MedicalRetryOptions {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors: MedicalErrorCode[];
    onRetry?: (error: MedicalAIError, attempt: number) => void;
    onFinalFailure?: (error: MedicalAIError) => void;
}

export const DEFAULT_MEDICAL_RETRY_OPTIONS: MedicalRetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
        MedicalErrorCode.MODEL_PROCESSING_ERROR,
        MedicalErrorCode.EXTERNAL_SERVICE_TIMEOUT,
        MedicalErrorCode.PROCESSING_TIMEOUT,
        MedicalErrorCode.KNOWLEDGE_BASE_UNAVAILABLE
    ],
    onRetry: (error, attempt) => {
        console.warn(`Medical AI retry attempt ${attempt} for error: ${error.code}`, {
            message: error.message,
            severity: error.severity,
            context: error.context
        });
    },
    onFinalFailure: (error) => {
        console.error('Medical AI operation failed after all retries:', error.toJSON());

        // Alert for patient safety issues
        if (error.patientSafetyImpact) {
            console.error('PATIENT SAFETY ALERT: Critical medical AI error requires immediate attention', {
                code: error.code,
                severity: error.severity,
                message: error.message
            });
        }
    }
};

export async function withMedicalRetry<T>(
    operation: () => Promise<T>,
    context: string,
    options: Partial<MedicalRetryOptions> = {}
): Promise<T> {
    const config = { ...DEFAULT_MEDICAL_RETRY_OPTIONS, ...options };
    let lastError: MedicalAIError | null = null;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            // Convert regular errors to MedicalAIError if needed
            if (!(error instanceof MedicalAIError)) {
                lastError = new MedicalAIError(
                    `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    MedicalErrorCode.MODEL_PROCESSING_ERROR,
                    MedicalErrorSeverity.MEDIUM,
                    { originalError: error, context }
                );
            } else {
                lastError = error;
            }

            // Don't retry critical patient safety issues or non-retryable errors
            if (!lastError.retryable || lastError.patientSafetyImpact) {
                console.error(`Non-retryable medical error in ${context}:`, lastError.toJSON());
                throw lastError;
            }

            // Don't retry if error code is not in retryable list
            if (!config.retryableErrors.includes(lastError.code)) {
                console.error(`Non-retryable error code ${lastError.code} in ${context}:`, lastError.toJSON());
                throw lastError;
            }

            // If this is the last attempt, don't wait
            if (attempt === config.maxAttempts) {
                break;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
                config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
                config.maxDelay
            );

            config.onRetry?.(lastError, attempt);

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // All attempts failed - lastError should be assigned by now, but add safety check
    if (!lastError) {
        lastError = new MedicalAIError(
            `${context}: All retry attempts failed with unknown error`,
            MedicalErrorCode.MODEL_PROCESSING_ERROR,
            MedicalErrorSeverity.HIGH,
            { context, maxAttempts: config.maxAttempts }
        );
    }

    config.onFinalFailure?.(lastError);
    throw lastError;
}
     

/**
 * Validate medical measurements against normal ranges
 */
export function validateMedicalMeasurement(
    structure: string,
    value: number,
    unit: string,
    patientAge?: number,
    patientSex?: 'M' | 'F'
): void {
    // Mock validation - in production, this would use comprehensive medical reference ranges
    const normalRanges: Record<string, { min: number; max: number; unit: string }> = {
        'heart_rate': { min: 60, max: 100, unit: 'bpm' },
        'systolic_bp': { min: 90, max: 140, unit: 'mmHg' },
        'cardiothoracic_ratio': { min: 0.4, max: 0.55, unit: 'ratio' },
        'aortic_root': { min: 20, max: 40, unit: 'mm' },
        'left_atrium': { min: 15, max: 45, unit: 'mm' }
    };

    const normalRange = normalRanges[structure.toLowerCase().replace(/\s+/g, '_')];

    if (normalRange && normalRange.unit === unit) {
        if (value < normalRange.min || value > normalRange.max) {
            throw new MedicalAIError(
                `Measurement for ${structure}(${value} ${unit}) is outside normal range(${normalRange.min} - ${normalRange.max} ${unit})`,
                MedicalErrorCode.MEASUREMENT_OUT_OF_RANGE,
                value < normalRange.min * 0.5 || value > normalRange.max * 2 ?
                    MedicalErrorSeverity.CRITICAL : MedicalErrorSeverity.HIGH,
                {
                    structure,
                    value,
                    unit,
                    normalRange,
                    patientAge,
                    patientSex
                },
                false
            );
        }
    }
}

/**
 * Error reporting for medical compliance and quality assurance
 */
export interface MedicalErrorReport {
    errorId: string;
    timestamp: Date;
    error: MedicalAIError;
    context: {
        userId?: string;
        sessionId?: string;
        caseId?: string;
        workflow: string;
    };
    resolution?: {
        resolvedAt: Date;
        resolvedBy: string;
        resolution: string;
    };
}

export class MedicalErrorReporter {
    private static instance: MedicalErrorReporter;
    private errorLog: MedicalErrorReport[] = [];

    static getInstance(): MedicalErrorReporter {
        if (!MedicalErrorReporter.instance) {
            MedicalErrorReporter.instance = new MedicalErrorReporter();
        }
        return MedicalErrorReporter.instance;
    }

    reportError(
        error: MedicalAIError,
        context: {
            userId?: string;
            sessionId?: string;
            caseId?: string;
            workflow: string;
        }
    ): string {
        const errorId = `MED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const report: MedicalErrorReport = {
            errorId,
            timestamp: new Date(),
            error,
            context
        };

        this.errorLog.push(report);

        // In production, this would send to monitoring/alerting system
        console.error(`Medical Error Report ${errorId}: `, {
            code: error.code,
            severity: error.severity,
            message: error.message,
            patientSafetyImpact: error.patientSafetyImpact,
            context
        });

        // Immediate alert for critical patient safety issues
        if (error.patientSafetyImpact) {
            this.alertPatientSafetyIssue(report);
        }

        return errorId;
    }

    private alertPatientSafetyIssue(report: MedicalErrorReport): void {
        // In production, this would trigger immediate notifications
        console.error('🚨 PATIENT SAFETY ALERT 🚨', {
            errorId: report.errorId,
            code: report.error.code,
            severity: report.error.severity,
            message: report.error.message,
            context: report.context,
            timestamp: report.timestamp
        });
    }

    getErrorStats(): {
        totalErrors: number;
        criticalErrors: number;
        patientSafetyIssues: number;
        errorsByCode: Record<MedicalErrorCode, number>;
    } {
        const stats = {
            totalErrors: this.errorLog.length,
            criticalErrors: 0,
            patientSafetyIssues: 0,
            errorsByCode: {} as Record<MedicalErrorCode, number>
        };

        this.errorLog.forEach(report => {
            if (report.error.severity === MedicalErrorSeverity.CRITICAL) {
                stats.criticalErrors++;
            }
            if (report.error.patientSafetyImpact) {
                stats.patientSafetyIssues++;
            }

            stats.errorsByCode[report.error.code] = (stats.errorsByCode[report.error.code] || 0) + 1;
        });

        return stats;
    }
}