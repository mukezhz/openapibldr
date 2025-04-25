import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { OpenAPISchema } from "@/lib/types";
import ContentHeader from "./ContentHeader";
import InfoForm from "../forms/InfoForm";
import ServersForm from "../forms/ServersForm";
import PathsForm from "../forms/PathsForm";
import ComponentsForm from "../forms/ComponentsForm";
import ImportOpenAPI from "../import/ImportOpenAPI";

interface ContentAreaProps {
  schema: OpenAPISchema;
  showImport: boolean;
  updateInfo: (info: OpenAPISchema["info"]) => void;
  updateServers: (servers: OpenAPISchema["servers"]) => void;
  updatePaths: (paths: OpenAPISchema["paths"]) => void;
  updateComponents: (components: OpenAPISchema["components"]) => void;
  handleImport: (importedSchema: OpenAPISchema) => void;
}

const ContentArea: React.FC<ContentAreaProps> = ({
  schema,
  showImport,
  updateInfo,
  updateServers,
  updatePaths,
  updateComponents,
  handleImport,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-muted/5 to-transparent">
      <ContentHeader showImport={showImport} />

      {/* Form Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto backdrop-blur-sm bg-card/30 rounded-lg border shadow-sm p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/info" replace />} />
            <Route
              path="/import"
              element={<ImportOpenAPI onImport={handleImport} />}
            />
            <Route
              path="/info"
              element={
                <InfoForm initialValues={schema.info} onUpdate={updateInfo} />
              }
            />
            <Route
              path="/servers"
              element={
                <ServersForm
                  initialValues={schema.servers || []}
                  onUpdate={updateServers}
                />
              }
            />
            <Route
              path="/paths"
              element={
                <PathsForm
                  initialValues={schema.paths || {}}
                  onUpdate={updatePaths}
                  components={schema.components}
                />
              }
            />
            <Route
              path="/components"
              element={
                <ComponentsForm
                  initialValues={schema.components || {}}
                  onUpdate={updateComponents}
                />
              }
            />
            <Route
              path="/security"
              element={
                <div className="p-8 border rounded-md bg-muted/20 text-center">
                  <h3 className="text-lg font-medium mb-2">
                    Security Configuration
                  </h3>
                  <p className="text-muted-foreground">
                    This section is coming soon!
                  </p>
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/info" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ContentArea;
