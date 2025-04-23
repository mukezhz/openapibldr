import { ComponentsObject, InfoObject, OpenAPISchema, PathsObject, SchemaObject, ServerObject } from "@/lib/types";

const LOCAL_STORAGE_COMPONENTS_KEY = "openapibldr_components";
const LOCAL_STORAGE_PATHS_KEY = "openapibldr_paths";
const LOCAL_STORAGE_INFO_KEY = "openapibldr_info";
const LOCAL_STORAGE_SERVERS_KEY = "openapibldr_servers";

export interface OpenApiLocalStorageComponent {
  name: string
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'
  componentGroup: string
  yamlContent: string
  properties?: Record<string, any>
  required?: string[]
  description?: string
}

export interface OpenApiLocalStoragePath {
  path: string
  method: string
  summary?: string
  description?: string
  operationId?: string
  requestBody?: any
  responses?: any
}

// Components Storage
export const saveComponentsToLocalStorage = (components: OpenApiLocalStorageComponent[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_COMPONENTS_KEY, JSON.stringify(components));
  } catch (error) {
    console.error("Error saving components to localStorage:", error);
  }
};

export const loadComponentsFromLocalStorage = (): ComponentsObject => {
  try {
    const savedComponents = localStorage.getItem(LOCAL_STORAGE_COMPONENTS_KEY);
    if (savedComponents) {
      const localStorageComponents = JSON.parse(savedComponents) as OpenApiLocalStorageComponent[];
      const schemas: ComponentsObject["schemas"] = localStorageComponents.reduce((acc, component) => {
        const { name, type, properties, required, description } = component;
        acc[name] = { 
          type,
          ...(description && { description }),
          ...(properties && { properties }),
          ...(required && { required })
        };
        return acc;
      }, {} as Record<string, SchemaObject>);
      return {
        schemas: schemas
      };
    }
  } catch (error) {
    console.error("Error loading components from localStorage:", error);
  }
  return {};
};

// Paths Storage
export const savePathsToLocalStorage = (paths: PathsObject): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_PATHS_KEY, JSON.stringify(paths));
  } catch (error) {
    console.error("Error saving paths to localStorage:", error);
  }
};

export const loadPathsFromLocalStorage = (): PathsObject => {
  try {
    const savedPaths = localStorage.getItem(LOCAL_STORAGE_PATHS_KEY);
    if (savedPaths) {
      return JSON.parse(savedPaths) as PathsObject;
    }
  } catch (error) {
    console.error("Error loading paths from localStorage:", error);
  }
  return {};
};

// API Info Storage
export const saveInfoToLocalStorage = (info: InfoObject): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_INFO_KEY, JSON.stringify(info));
  } catch (error) {
    console.error("Error saving API info to localStorage:", error);
  }
};

export const loadInfoFromLocalStorage = (): InfoObject | null => {
  try {
    const savedInfo = localStorage.getItem(LOCAL_STORAGE_INFO_KEY);
    if (savedInfo) {
      return JSON.parse(savedInfo) as InfoObject;
    }
  } catch (error) {
    console.error("Error loading API info from localStorage:", error);
  }
  return null;
};

// Servers Storage
export const saveServersToLocalStorage = (servers: ServerObject[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_SERVERS_KEY, JSON.stringify(servers));
  } catch (error) {
    console.error("Error saving servers to localStorage:", error);
  }
};

export const loadServersFromLocalStorage = (): ServerObject[] => {
  try {
    const savedServers = localStorage.getItem(LOCAL_STORAGE_SERVERS_KEY);
    if (savedServers) {
      return JSON.parse(savedServers) as ServerObject[];
    }
  } catch (error) {
    console.error("Error loading servers from localStorage:", error);
  }
  return [];
};

// Complete OpenAPI Schema
export const saveOpenAPISchemaToLocalStorage = (schema: OpenAPISchema): void => {
  // Extract different parts of the schema and save them separately
  if (schema.components) {
    // Convert components to our storage format
    const components: OpenApiLocalStorageComponent[] = schema.components.schemas ? 
      Object.entries(schema.components.schemas).map(([name, schema]) => {
        const schemaObj = schema as SchemaObject;
        return {
          name,
          type: schemaObj.type || 'object',
          componentGroup: 'schemas',
          yamlContent: JSON.stringify(schema),
          properties: schemaObj.properties,
          required: schemaObj.required,
          description: schemaObj.description
        };
      }) : [];
    
    saveComponentsToLocalStorage(components);
  }
  
  if (schema.paths) {
    savePathsToLocalStorage(schema.paths);
  }
  
  if (schema.info) {
    saveInfoToLocalStorage(schema.info);
  }
  
  if (schema.servers) {
    saveServersToLocalStorage(schema.servers);
  }
};

export const loadOpenAPISchemaFromLocalStorage = (): Partial<OpenAPISchema> => {
  const components = loadComponentsFromLocalStorage();
  const paths = loadPathsFromLocalStorage();
  const info = loadInfoFromLocalStorage();
  const servers = loadServersFromLocalStorage();
  
  return {
    ...(info && { info }),
    ...(servers && servers.length > 0 && { servers }),
    ...(Object.keys(paths).length > 0 && { paths }),
    ...(Object.keys(components).length > 0 && { components })
  };
};