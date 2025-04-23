import { useState, useEffect } from 'react'
import { defaultOpenAPISpec } from './lib/utils/defaults'
import { OpenAPISchema } from './lib/types'
import InfoForm from './components/forms/InfoForm'
import ServersForm from './components/forms/ServersForm'
import PathsForm from './components/forms/PathsForm'
import ComponentsForm from './components/forms/ComponentsForm'
import OpenAPIPreview from './components/preview/OpenAPIPreview'
import ImportOpenAPI from './components/import/ImportOpenAPI'
import { Button } from './components/ui/button'
import { FileUp, Info, Server, Route, Boxes, Shield, X } from 'lucide-react'
import { cn } from './lib/utils'
import { loadOpenAPISchemaFromLocalStorage } from './components/forms/shared/localstorage'

function App() {
  // State for the OpenAPI schema
  const [schema, setSchema] = useState<OpenAPISchema>(defaultOpenAPISpec)
  const [showImport, setShowImport] = useState(false)
  const [activeNav, setActiveNav] = useState<string>("info")

  // Load data from localStorage when component mounts
  useEffect(() => {
    const savedData = loadOpenAPISchemaFromLocalStorage()
    setSchema(prevSchema => ({
      ...prevSchema,
      ...savedData
    }))
  }, [])

  // Update specific parts of the schema
  const updateInfo = (info: OpenAPISchema['info']) => {
    setSchema(prev => ({ ...prev, info }))
  }

  const updateServers = (servers: OpenAPISchema['servers']) => {
    setSchema(prev => ({ ...prev, servers }))
  }

  const updatePaths = (paths: OpenAPISchema['paths']) => {
    setSchema(prev => ({ ...prev, paths }))
  }

  const updateComponents = (components: OpenAPISchema['components']) => {
    setSchema(prev => ({ ...prev, components }))
  }

  const handleImport = (importedSchema: OpenAPISchema) => {
    setSchema(importedSchema)
    setShowImport(false)
  }

  // Navigation items
  const navItems = [
    { id: "info", label: "API Info", icon: <Info className="h-5 w-5 mr-2" /> },
    { id: "servers", label: "Servers", icon: <Server className="h-5 w-5 mr-2" /> },
    { id: "paths", label: "Paths", icon: <Route className="h-5 w-5 mr-2" /> },
    { id: "components", label: "Components", icon: <Boxes className="h-5 w-5 mr-2" /> },
    { id: "security", label: "Security", icon: <Shield className="h-5 w-5 mr-2" /> },
  ]

  // Get form title based on active navigation
  const getFormTitle = () => {
    const activeItem = navItems.find(item => item.id === activeNav);
    return activeItem ? activeItem.label : "Form";
  }

  // Get form description based on active navigation
  const getFormDescription = () => {
    switch (activeNav) {
      case "info":
        return "Define basic information about your API including title, version, and contact details.";
      case "servers":
        return "Configure server URLs where your API is hosted.";
      case "paths":
        return "Define API endpoints, HTTP methods, and responses.";
      case "components":
        return "Create reusable schemas, parameters, and responses.";
      case "security":
        return "Define security requirements for your API.";
      default:
        return "";
    }
  }

  // Get the active form component
  const getActiveForm = () => {
    switch (activeNav) {
      case "info":
        return <InfoForm initialValues={schema.info} onUpdate={updateInfo} />;
      case "servers":
        return <ServersForm initialValues={schema.servers || []} onUpdate={updateServers} />;
      case "paths":
        return <PathsForm initialValues={schema.paths || {}} onUpdate={updatePaths} components={schema.components} />;
      case "components":
        return <ComponentsForm initialValues={schema.components || {}} onUpdate={updateComponents} />;
      case "security":
        return (
          <div className="p-8 border rounded-md bg-muted/20 text-center">
            <h3 className="text-lg font-medium mb-2">Security Configuration</h3>
            <p className="text-muted-foreground">
              This section is coming soon!
            </p>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <>
      <div className="flex min-h-screen">
        {/* Left Column - Sidebar Navigation */}
        <div className="w-64 border-r bg-muted/10 flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold">OpenApiBldr</h1>
            <p className="text-sm text-muted-foreground">OpenAPI 3.1 Builder</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={cn(
                  "flex items-center w-full px-3 py-2 rounded-md text-left transition-colors",
                  activeNav === item.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t">
            <Button
              onClick={() => setShowImport(!showImport)}
              variant="outline"
              className="flex items-center w-full"
            >
              {showImport ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel Import
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Import OpenAPI
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Middle Column - Forms */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-muted/5 to-transparent">
          {/* Form Header */}
          <div className="px-8 py-6 border-b">
            <div className="flex items-center">
              {!showImport && navItems.find(item => item.id === activeNav)?.icon}
              <h2 className="text-2xl font-semibold ml-2">
                {showImport ? "Import OpenAPI Specification" : getFormTitle()}
              </h2>
            </div>
            {!showImport && (
              <p className="text-muted-foreground mt-2">
                {getFormDescription()}
              </p>
            )}
          </div>

          {/* Form Content */}
          <div className="flex-1 p-8 overflow-auto">
            <div className="max-w-3xl mx-auto backdrop-blur-sm bg-card/30 rounded-lg border shadow-sm p-6">
              {showImport ? (
                <ImportOpenAPI onImport={handleImport} />
              ) : (
                getActiveForm()
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="w-1/3 border-l p-6 overflow-auto bg-muted/5">
          <OpenAPIPreview schema={schema} />
        </div>

      </div>
      <footer className="p-4 text-center text-muted-foreground text-xs bg-muted/10">
        <p>OpenAPIBldr - A modern OpenAPI 3.1.x specification builder</p>
      </footer>
    </>
  )
}

export default App
