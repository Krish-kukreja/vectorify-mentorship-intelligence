import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vectorify Mentorship Intelligence API',
      version: '1.0.0',
      description: 'Vectorify Mentorship Intelligence Service - AI-powered analysis of mentor-student sessions, student task tracking, and automated reminders for JEE/NEET aspirants.',
      contact: {
        name: 'Vectorify API Support',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API base path',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from POST /api/auth/login',
        },
      },
      schemas: {
        UnifiedResponse: {
          type: 'object',
          properties: {
            traceId: { type: 'string', format: 'uuid' },
            success: { type: 'boolean' },
            data: { type: 'object' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' },
              },
            },
          },
        },
      },
    },
  },
  apis: [
    './src/modules/**/*.routes.ts', 
    './src/app.ts',
    './dist/modules/**/*.routes.js', 
    './dist/app.js'
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
