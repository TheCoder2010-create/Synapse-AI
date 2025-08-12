
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  aiAssistedDiagnosis,
  AiAssistedDiagnosisInputSchema,
} from '@/ai/flows/ai-assisted-diagnosis';
import type { AiAssistedDiagnosisOutput } from '@/ai/types';
import { logger } from '@/lib/logger';
import { ApiError, BaseError, ValidationError } from '@/lib/errors';

type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

const withErrorHandling = (handler: ApiHandler): ApiHandler => {
  return async (req: NextRequest) => {
    try {
      // Placeholder for authentication
      // const user = await authenticateRequest(req);
      // if (!user) {
      //   throw new ApiError(401, 'Unauthorized');
      // }
      return await handler(req);
    } catch (error) {
      const errorDetails =
        error instanceof Error ? error.message : 'An unknown error occurred';

      if (error instanceof BaseError) {
        logger.warn(error.name, {
          statusCode: error.statusCode,
          message: error.message,
        });
        return NextResponse.json(
          { error: error.name, details: error.message },
          { status: error.statusCode }
        );
      }

      logger.error('Unhandled API Error', {
        message: errorDetails,
        path: req.nextUrl.pathname,
      });

      return NextResponse.json(
        {
          error: 'Internal Server Error',
          details: 'An unexpected error occurred.',
        },
        { status: 500 }
      );
    }
  };
};

const diagnoseHandler: ApiHandler = async (req) => {
  logger.info('Diagnosis request received');
  const body = await req.json();

  const validationResult = AiAssistedDiagnosisInputSchema.safeParse(body);

  if (!validationResult.success) {
    const details = validationResult.error.flatten();
    logger.warn('Invalid request body', { details });
    throw new ValidationError('Invalid request body');
  }

  const input = validationResult.data;
  logger.info('Request body validated successfully');

  const diagnosisOutput: AiAssistedDiagnosisOutput = await aiAssistedDiagnosis(
    input
  );
  logger.info('AI diagnosis completed successfully');

  return NextResponse.json(diagnosisOutput);
};

export const POST = withErrorHandling(diagnoseHandler);
