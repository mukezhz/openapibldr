import { ComponentsObject, SchemaObject } from "@/lib/types";


const LOCAL_STORAGE_COMPONENTS_KEY = "openapibldr_components";

export interface OpenApiLocalStorageComponent {
  name: string
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'
  componentGroup: string
  yamlContent: string
}

export const loadComponentsFromLocalStorage = (): ComponentsObject => {
    try {
      const savedComponents = localStorage.getItem(LOCAL_STORAGE_COMPONENTS_KEY);
      if (savedComponents) {
        const localStorageComponents = JSON.parse(savedComponents) as OpenApiLocalStorageComponent[];
        const schemas: ComponentsObject["schemas"] = localStorageComponents.reduce((acc, component) => {
          const { name, type } = component;
          acc[name] = { type };
          return acc;
        }, {} as Record<string, SchemaObject>);
        const compoents: ComponentsObject = {
          schemas: schemas
        } 
        return compoents
      }
    } catch (error) {
      console.error("Error loading components from localStorage:", error);
    }
    return {};
  };