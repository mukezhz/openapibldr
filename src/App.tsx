import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { defaultOpenAPISpec } from "./lib/utils/defaults";
import { OpenAPISchema } from "./lib/types";
import Layout from "./components/layout/Layout";
import { loadOpenAPISchemaFromLocalStorage } from "./components/forms/shared/localstorage";

function App() {
  const [schema, setSchema] = useState<OpenAPISchema>(defaultOpenAPISpec);
  const [showImport, setShowImport] = useState(false);
  const navigate = useNavigate();

  // Load schema from localStorage on component mount
  useEffect(() => {
    const savedSchema = loadOpenAPISchemaFromLocalStorage();
    if (savedSchema && Object.keys(savedSchema).length > 0) {
      setSchema((prev) => ({
        ...prev,
        ...savedSchema,
      }));
    }
  }, []);

  // Handler function for toggling import state
  const handleToggleImport = useCallback(() => {
    setShowImport((prevState) => !prevState);
  }, []);

  // Update functions for each part of the schema
  const updateInfo = (info: OpenAPISchema["info"]) => {
    setSchema((prev) => ({ ...prev, info }));
  };

  const updateServers = (servers: OpenAPISchema["servers"]) => {
    setSchema((prev) => ({ ...prev, servers }));
  };

  const updatePaths = (paths: OpenAPISchema["paths"]) => {
    setSchema((prev) => ({ ...prev, paths }));
  };

  const updateComponents = (components: OpenAPISchema["components"]) => {
    setSchema((prev) => ({ ...prev, components }));
  };

  const handleImport = (importedSchema: OpenAPISchema) => {
    setSchema(importedSchema);
    setShowImport(false);
    navigate("/info"); // Navigate to info page after import
  };

  return (
    <Layout
      schema={schema}
      showImport={showImport}
      onToggleImport={handleToggleImport}
      updateInfo={updateInfo}
      updateServers={updateServers}
      updatePaths={updatePaths}
      updateComponents={updateComponents}
      handleImport={handleImport}
    />
  );
}

export default App;
