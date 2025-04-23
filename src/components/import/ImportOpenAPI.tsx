import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { yamlToJson } from "@/lib/utils/converters";
import { OpenAPISchema } from "@/lib/types";
import { validateOpenAPISchema } from "@/lib/utils/validator";
import { FileUp, AlertTriangle } from "lucide-react";

interface ImportOpenAPIProps {
  onImport: (schema: OpenAPISchema) => void;
}

const ImportOpenAPI: React.FC<ImportOpenAPIProps> = ({ onImport }) => {
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const handleImport = () => {
    try {
      // Try to parse as JSON first
      let parsedSchema: OpenAPISchema;
      
      try {
        parsedSchema = JSON.parse(inputText);
      } catch (jsonError) {
        // If JSON parsing fails, try YAML
        parsedSchema = yamlToJson(inputText);
      }
      
      // Validate the schema
      const issues = validateOpenAPISchema(parsedSchema);
      
      if (issues.length > 0) {
        setError(`The imported schema has validation issues: ${issues.join(", ")}`);
        return;
      }
      
      // If valid, pass the schema to the parent component
      onImport(parsedSchema);
      setInputText("");
      setError(null);
    } catch (error) {
      setError("Failed to parse the input. Please ensure it's valid JSON or YAML.");
    }
  };
  
  // Handle file selection
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputText(content);
    };
    
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import OpenAPI Schema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-md border-gray-300 hover:border-primary">
                <FileUp className="w-6 h-6 mr-2" />
                <span>Upload JSON or YAML file</span>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".json,.yaml,.yml"
                  onChange={handleFileUpload}
                />
              </div>
            </label>
          </div>
          
          <p className="text-sm text-muted-foreground">Or paste your OpenAPI specification below:</p>
          
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your OpenAPI JSON or YAML here..."
            className="h-[200px] font-mono text-sm"
          />
          
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <Button 
            onClick={handleImport} 
            className="w-full"
            disabled={!inputText.trim()}
          >
            Import Schema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportOpenAPI;