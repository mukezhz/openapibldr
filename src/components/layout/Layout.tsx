import React from "react";
import { OpenAPISchema } from "@/lib/types";
import Sidebar from "./Sidebar";
import ContentArea from "./ContentArea";
import OpenAPIPreview from "../preview/OpenAPIPreview";

interface LayoutProps {
  schema: OpenAPISchema;
  showImport: boolean;
  onToggleImport: () => void;
  updateInfo: (info: OpenAPISchema["info"]) => void;
  updateServers: (servers: OpenAPISchema["servers"]) => void;
  updatePaths: (paths: OpenAPISchema["paths"]) => void;
  updateComponents: (components: OpenAPISchema["components"]) => void;
  handleImport: (importedSchema: OpenAPISchema) => void;
}

const Layout: React.FC<LayoutProps> = ({
  schema,
  showImport,
  onToggleImport,
  updateInfo,
  updateServers,
  updatePaths,
  updateComponents,
  handleImport,
}) => {
  return (
    <>
      <div className="flex min-h-[97vh] max-h-[97vh] w-full">
        <div className="flex w-full">
          <Sidebar showImport={showImport} onToggleImport={onToggleImport} />

          <ContentArea
            schema={schema}
            showImport={showImport}
            updateInfo={updateInfo}
            updateServers={updateServers}
            updatePaths={updatePaths}
            updateComponents={updateComponents}
            handleImport={handleImport}
          />

          <div className="flex-1 border-l p-6 overflow-auto bg-muted/5">
            <OpenAPIPreview schema={schema} />
          </div>
        </div>
      </div>
      <footer className="text-center text-muted-foreground text-sm bg-muted/10">
        <p>♥️ OpenAPIBldr - A modern OpenAPI 3.1.x specification builder</p>
      </footer>
    </>
  );
};

export default Layout;
