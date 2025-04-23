import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenAPISchema } from "@/lib/types";
import { jsonToYaml, prettyPrintJson, downloadFile } from "@/lib/utils/converters";
import { validateOpenAPISchema } from "@/lib/utils/validator";
import { Download, FileJson, FileText, CheckCircle2, AlertTriangle, Copy, Maximize, Check, Minimize, Minimize2 } from "lucide-react";

interface OpenAPIPreviewProps {
  schema: OpenAPISchema;
}

const OpenAPIPreview: React.FC<OpenAPIPreviewProps> = ({ schema }) => {
  const [activeTab, setActiveTab] = useState<"yaml" | "json">("yaml");
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const yamlRef = useRef<HTMLPreElement>(null);
  const jsonRef = useRef<HTMLPreElement>(null);

  const yamlContent = jsonToYaml(schema);

  const jsonContent = prettyPrintJson(schema);

  const handleCopy = () => {
    const content = activeTab === "yaml" ? yamlContent : jsonContent;
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset copied state after 2 seconds
    });
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const handleDownload = () => {
    if (activeTab === "yaml") {
      downloadFile(yamlContent, "openapi.yaml", "text/yaml");
    } else {
      downloadFile(jsonContent, "openapi.json", "application/json");
    }
  };

  useEffect(() => {
    const issues = validateOpenAPISchema(schema);
    setValidationIssues(issues);
  }, [schema]);

  return (
    <Card className={`w-full ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <CardTitle className="mr-2">OpenAPI {schema.openapi} Specification</CardTitle>
          {validationIssues.length === 0 ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
        </div>

        <div className="flex items-center ml-auto">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handleCopy} variant="outline" size="sm" className="ml-2">
            {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {isCopied ? "Copied" : "Copy"}
          </Button>
          <Button onClick={handleFullscreen} variant="outline" size="sm" className="ml-2">
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
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
            <pre className="p-4 bg-muted rounded-md overflow-auto max-h-[800px] text-sm" ref={yamlRef}>
              {yamlContent}
            </pre>
          </TabsContent>

          <TabsContent value="json">
            <pre className="p-4 bg-muted rounded-md overflow-auto max-h-[800px] text-sm" ref={jsonRef}>
              {jsonContent}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OpenAPIPreview;