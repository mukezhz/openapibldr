import { OpenAPISchema } from '../types';

/**
 * Default OpenAPI specification object
 */
export const defaultOpenAPISpec: OpenAPISchema = {
  openapi: "3.1.0",
  info: {
    title: "API Title",
    description: "API Description",
    version: "1.0.0"
  },
  servers: [
    {
      url: "https://api.example.com",
      description: "Production server"
    }
  ],
  paths: {},
  components: {
    schemas: {},
    securitySchemes: {}
  }
};

/**
 * Available HTTP methods for API endpoints
 */
export const httpMethods = [
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'options',
  'head'
];

/**
 * Common response status codes
 */
export const commonStatusCodes = [
  '200', '201', '204', 
  '400', '401', '403', '404', '422',
  '500', '503'
];

/**
 * Default parameter locations
 */
export const parameterLocations = [
  'query',
  'header',
  'path',
  'cookie'
];

/**
 * Default data types for schema objects
 */
export const schemaTypes = [
  'string',
  'number',
  'integer',
  'boolean',
  'array',
  'object'
];

/**
 * Default string formats
 */
export const stringFormats = [
  'date-time',
  'date',
  'time',
  'email',
  'uuid',
  'uri',
  'hostname',
  'ipv4',
  'ipv6'
];

/**
 * Default number formats
 */
export const numberFormats = [
  'float',
  'double'
];

/**
 * Default integer formats
 */
export const integerFormats = [
  'int32',
  'int64'
];

/**
 * Default security scheme types
 */
export const securitySchemeTypes = [
  'apiKey',
  'http',
  'oauth2',
  'openIdConnect'
];

/**
 * Default API key locations
 */
export const apiKeyLocations = [
  'query',
  'header',
  'cookie'
];

/**
 * Default HTTP authentication schemes
 */
export const httpAuthSchemes = [
  'basic',
  'bearer',
  'digest'
];