import yaml from 'js-yaml';

/**
 * Converts a JSON object to YAML string
 * @param json The JSON object to convert
 * @returns YAML string representation
 */
export function jsonToYaml(json: any): string {
  try {
    return yaml.dump(json, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    });
  } catch (error) {
    console.error('Error converting JSON to YAML:', error);
    return '';
  }
}

/**
 * Converts a YAML string to JSON object
 * @param yamlStr The YAML string to convert
 * @returns JSON object representation
 */
export function yamlToJson(yamlStr: string): any {
  try {
    return yaml.load(yamlStr) || {};
  } catch (error) {
    console.error('Error converting YAML to JSON:', error);
    return {};
  }
}

/**
 * Pretty prints a JSON object
 * @param json The JSON object to format
 * @returns Formatted JSON string
 */
export function prettyPrintJson(json: any): string {
  try {
    return JSON.stringify(json, null, 2);
  } catch (error) {
    console.error('Error formatting JSON:', error);
    return '';
  }
}

/**
 * Creates a downloadable file from content
 * @param content The content to download
 * @param fileName The file name
 * @param contentType The content MIME type
 */
export function downloadFile(content: string, fileName: string, contentType: string): void {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  
  URL.revokeObjectURL(a.href);
}