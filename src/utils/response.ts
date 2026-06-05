export interface ApiSuccessResponse<T = unknown> {
  traceId: string;
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  traceId: string;
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T, traceId: string): ApiSuccessResponse<T> {
  return {
    traceId,
    success: true,
    data,
  };
}

export function errorResponse(
  code: string,
  message: string,
  traceId: string,
  details?: unknown
): ApiErrorResponse {
  return {
    traceId,
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
}
