import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';

// OpenAPI schemas
import openAPISchemas from '../../components/forms/openapi-schemas';

// Setup Monaco with YAML language support
export async function setupMonacoYaml() {
  try {
    // Initialize the YAML language plugin with proper configuration
    configureMonacoYaml(monaco, {
      enableSchemaRequest: true,
      hover: true,
      completion: true,
      validate: true,
      format: true,
      schemas: [
        // Schema for Schema Objects
        {
          uri: 'openapi-schema-schema.json',
          fileMatch: ['*-schema.yaml', '**/schemas/*.yaml'],
          schema: openAPISchemas.schema
        },
        // Schema for Response Objects
        {
          uri: 'openapi-response-schema.json',
          fileMatch: ['*-response.yaml', '**/responses/*.yaml'],
          schema: openAPISchemas.response
        },
        // Schema for Parameter Objects
        {
          uri: 'openapi-parameter-schema.json',
          fileMatch: ['*-parameter.yaml', '**/parameters/*.yaml'],
          schema: openAPISchemas.parameter
        },
        // Schema for RequestBody Objects
        {
          uri: 'openapi-requestBody-schema.json',
          fileMatch: ['*-requestBody.yaml', '**/requestBodies/*.yaml'],
          schema: openAPISchemas.requestBody
        },
        // Schema for Example Objects
        {
          uri: 'openapi-example-schema.json',
          fileMatch: ['*-example.yaml', '**/examples/*.yaml'],
          schema: openAPISchemas.example
        },
        // Schema for SecurityScheme Objects
        {
          uri: 'openapi-securityScheme-schema.json',
          fileMatch: ['*-securityScheme.yaml', '**/securitySchemes/*.yaml'],
          schema: openAPISchemas.securityScheme
        }
      ]
    });

    return true;
  } catch (err) {
    console.error('Failed to set up Monaco YAML:', err);
    return false;
  }
}

// Helper function to get the right schema for a component type
export function getSchemaForComponentType(componentType: string) {
  switch (componentType) {
    case 'schema': return openAPISchemas.schema;
    case 'response': return openAPISchemas.response;
    case 'parameter': return openAPISchemas.parameter;
    case 'requestBody': return openAPISchemas.requestBody;
    case 'example': return openAPISchemas.example;
    case 'securityScheme': return openAPISchemas.securityScheme;
    default: return null;
  }
}

// Configure Monaco model with a specific schema
export function configureModelWithSchema(
  editor: monaco.editor.IStandaloneCodeEditor, 
  monacoInstance: any, 
  componentType: string
) {
  try {
    const model = editor.getModel();
    if (!model) return;

    // Create a virtual path that will match our schema configurations
    const virtualUri = monacoInstance.Uri.parse(`file:///temp-${componentType}.yaml`);
    
    // Create a new model with our virtual URI to trigger schema matching
    const newModel = monacoInstance.editor.createModel(
      model.getValue(),
      'yaml',
      virtualUri
    );
    
    // Use this model for our editor
    editor.setModel(newModel);
    
    // Dispose the old model to prevent memory leaks
    model.dispose();
  } catch (err) {
    console.error('Error configuring model with schema:', err);
  }
}