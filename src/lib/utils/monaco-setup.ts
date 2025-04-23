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
        }
      ]
    });

    return true;
  } catch (err) {
    console.error('Failed to set up Monaco YAML:', err);
    return false;
  }
}

// Configure Monaco model with schema
export function configureModelWithSchema(
  editor: monaco.editor.IStandaloneCodeEditor, 
  monacoInstance: any
) {
  try {
    const model = editor.getModel();
    if (!model) return;

    // Create a virtual path that will match our schema configurations
    const virtualUri = monacoInstance.Uri.parse(`file:///temp-schema.yaml`);
    
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