import { OpenAPISchema } from '../types';

/**
 * Validates an OpenAPI specification object for common errors
 * @param schema The OpenAPI schema to validate
 * @returns An array of validation issues, empty if no issues found
 */
export function validateOpenAPISchema(schema: OpenAPISchema): string[] {
  const issues: string[] = [];
  
  // Check required top-level fields
  if (!schema.openapi) {
    issues.push('Missing required field: openapi');
  } else if (!schema.openapi.startsWith('3.1')) {
    issues.push(`Invalid OpenAPI version: ${schema.openapi}. Must be 3.1.x`);
  }
  
  // Check info object
  if (!schema.info) {
    issues.push('Missing required field: info');
  } else {
    if (!schema.info.title) {
      issues.push('Missing required field: info.title');
    }
    if (!schema.info.version) {
      issues.push('Missing required field: info.version');
    }
    
    // Validate contact object if present
    if (schema.info.contact) {
      if (schema.info.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schema.info.contact.email)) {
        issues.push('Invalid email format in info.contact.email');
      }
      if (schema.info.contact.url && !isValidUrl(schema.info.contact.url)) {
        issues.push('Invalid URL format in info.contact.url');
      }
    }
    
    // Validate license object if present
    if (schema.info.license) {
      if (!schema.info.license.name) {
        issues.push('Missing required field: info.license.name');
      }
      if (schema.info.license.url && !isValidUrl(schema.info.license.url)) {
        issues.push('Invalid URL format in info.license.url');
      }
    }
  }
  
  // Validate servers if present
  if (schema.servers && Array.isArray(schema.servers)) {
    schema.servers.forEach((server, index) => {
      if (!server.url) {
        issues.push(`Missing required field: servers[${index}].url`);
      } else if (!isValidUrl(server.url, true)) {
        issues.push(`Invalid URL format in servers[${index}].url`);
      }
    });
  }
  
  // Validate paths if present
  if (schema.paths) {
    Object.entries(schema.paths).forEach(([path, pathItem]) => {
      if (!path.startsWith('/')) {
        issues.push(`Path "${path}" must start with a forward slash (/)`);
      }
      
      // Check operations within each path
      const operations = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
      operations.forEach(method => {
        const operation = pathItem[method as keyof typeof pathItem];
        if (operation && typeof operation === 'object') {
          // Check that responses is present and is an object
          if (!operation.responses || typeof operation.responses !== 'object') {
            issues.push(`Missing required field: paths["${path}"].${method}.responses`);
          } else {
            // Ensure there's at least one response defined
            if (Object.keys(operation.responses).length === 0) {
              issues.push(`At least one response must be defined in paths["${path}"].${method}.responses`);
            }
          }
        }
      });
    });
  }
  
  return issues;
}

/**
 * Checks if a string is a valid URL
 * @param str The string to check
 * @param allowVariables Whether to allow OpenAPI variable syntax like {server}
 * @returns true if valid URL
 */
function isValidUrl(str: string, allowVariables = false): boolean {
  // Simple URL check for standard URLs
  try {
    new URL(str);
    return true;
  } catch (e) {
    // If variables are allowed, do a more lenient check
    if (allowVariables) {
      // Check for template variable pattern, e.g. https://{host}/{basePath}
      const templatePattern = /^(https?:\/\/)(([a-zA-Z0-9-_.]+)|(\{[a-zA-Z0-9-_.]+\}))(:[0-9]+)?(\/([a-zA-Z0-9-_.\/]+|\{[a-zA-Z0-9-_.]+\}))*\/?$/;
      return templatePattern.test(str);
    }
    return false;
  }
}