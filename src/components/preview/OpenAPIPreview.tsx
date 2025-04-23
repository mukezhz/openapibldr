import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenAPISchema } from "@/lib/types";
import { jsonToYaml, prettyPrintJson, downloadFile } from "@/lib/utils/converters";
import { validateOpenAPISchema } from "@/lib/utils/validator";
import { Download, FileJson, FileText, CheckCircle2, AlertTriangle } from "lucide-react";

interface OpenAPIPreviewProps {
  schema: OpenAPISchema;
}

const OpenAPIPreview: React.FC<OpenAPIPreviewProps> = ({ schema }) => {
  const [activeTab, setActiveTab] = useState<"yaml" | "json">("yaml");
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  
  // Generate YAML representation
  const yamlContent = jsonToYaml(schema);
  
  // Generate JSON representation
  const jsonContent = prettyPrintJson(schema);
  
  // Download the current format
  const handleDownload = () => {
    if (activeTab === "yaml") {
      downloadFile(yamlContent, "openapi.yaml", "text/yaml");
    } else {
      downloadFile(jsonContent, "openapi.json", "application/json");
    }
  };

  // Validate schema whenever it changes
  useEffect(() => {
    const issues = validateOpenAPISchema(schema);
    setValidationIssues(issues);
  }, [schema]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <CardTitle className="mr-2">OpenAPI {schema.openapi} Specification</CardTitle>
          {validationIssues.length === 0 ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
        </div>
        
        <Button onClick={handleDownload} variant="outline" size="sm" className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </CardHeader>
      <CardContent>
        {validationIssues.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Validation Issues
            </h3>
            <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 list-disc list-inside">
              {validationIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "yaml" | "json")}>
          <TabsList className="mb-4">
            <TabsTrigger value="yaml" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              YAML
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center">
              <FileJson className="mr-2 h-4 w-4" />
              JSON
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="yaml">
            <pre className="p-4 bg-muted rounded-md overflow-auto max-h-[500px] text-sm">
              {yamlContent}
            </pre>
          </TabsContent>
          
          <TabsContent value="json">
            <pre className="p-4 bg-muted rounded-md overflow-auto max-h-[500px] text-sm">
              {jsonContent}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OpenAPIPreview;