import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ComponentsObject, SchemaObject } from "@/lib/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import yaml from "js-yaml";
import Editor, { Monaco, useMonaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";

import { setupMonacoYaml, configureModelWithSchema } from "@/lib/utils/monaco-setup";

import {
  OpenApiLocalStorageComponent,
  saveComponentsToLocalStorage,
  loadComponentsFromLocalStorage
} from "./shared/localstorage";

const componentSchema = z.object({
  name: z.string().min(1, { message: "Component name is required" }),
  type: z.literal("schema"),
  componentGroup: z.string().min(1, { message: "Component group is required" }),
  yamlContent: z.string().min(1, { message: "YAML content is required" }),
});

type Component = z.infer<typeof componentSchema>;

const sampleTemplates: Record<string, string> = {
  schema: `type: object
properties:
  id:
    type: string
    format: uuid
    description: Unique identifier
  name:
    type: string
    description: Resource name
  createdAt:
    type: string
    format: date-time
    description: Creation timestamp
required:
  - id
  - name`,

  schemaUser: `type: object
properties:
  id:
    type: string
  name:
    type: string
  email:
    type: string
    format: email
required:
  - id
  - name
  - email`,

  schemaOrganization: `type: object
properties:
  id:
    type: string
  name:
    type: string
  address:
    type: string
required:
  - id
  - name`,
};

const schemaExampleTemplates = [
  { value: "schema", label: "Default Schema" },
  { value: "schemaUser", label: "User" },
  { value: "schemaOrganization", label: "Organization" },
];

interface ComponentsFormProps {
  initialValues: ComponentsObject;
  onUpdate: (components: ComponentsObject) => void;
}

const ComponentsForm: React.FC<ComponentsFormProps> = ({ initialValues, onUpdate }) => {
  const monaco = useMonaco();
  const [yamlPluginReady, setYamlPluginReady] = useState(false);
  const [yamlContent, setYamlContent] = useState<string>(sampleTemplates.schema);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const form = useForm<Component>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      name: "",
      type: "schema",
      componentGroup: "Common",
      yamlContent: sampleTemplates.schema
    }
  });

  useEffect(() => {
    if (monaco) {
      setupMonacoYaml().then(() => {
        setYamlPluginReady(true);
      });
    }
  }, [monaco]);

  function handleEditorDidMount(
    editor: editor.IStandaloneCodeEditor,
    monacoInstance: Monaco,
  ) {
    editorRef.current = editor;

    editor.updateOptions({
      minimap: { enabled: false },
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "on",
      formatOnPaste: true,
      formatOnType: true,
    });

    if (yamlPluginReady) {
      configureModelWithSchema(editor, monacoInstance, "schema");
    }
  }

  useEffect(() => {
    if (editorRef.current && monaco && yamlPluginReady) {
      configureModelWithSchema(editorRef.current, monaco, "schema");
    }
  }, [monaco, yamlPluginReady]);

  function handleEditorChange(value: string = "") {
    setYamlContent(value);
    form.setValue("yamlContent", value);
  }

  const [components, setComponents] = useState<Component[]>(() => {
    const savedComponentsObj = loadComponentsFromLocalStorage();

    if (savedComponentsObj.schemas && Object.keys(savedComponentsObj.schemas).length > 0) {
      return Object.entries(savedComponentsObj.schemas).map(([name, schema]) => {
        return {
          name,
          type: "schema" as const,
          componentGroup: "Common",
          yamlContent: yaml.dump(schema)
        };
      });
    }

    const result: Component[] = [];

    if (initialValues.schemas) {
      Object.entries(initialValues.schemas).forEach(([name, schema]) => {
        result.push({
          name,
          type: "schema",
          componentGroup: "Common",
          yamlContent: yaml.dump(schema)
        });
      });
    }

    return result.length > 0 ? result : [];
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [expandedComponents, setExpandedComponents] = useState<Record<number, boolean>>({});

  const toggleComponentExpansion = (index: number) => {
    setExpandedComponents(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const updateComponents = (newComponents: Component[]) => {
    setComponents(newComponents);

    const componentsObject: ComponentsObject = {};

    newComponents.forEach(component => {
      try {
        const parsedContent = yaml.load(component.yamlContent) as SchemaObject;

        if (!componentsObject.schemas) componentsObject.schemas = {};
        componentsObject.schemas[component.name] = parsedContent;
      } catch (error) {
        console.error(`Error parsing YAML for ${component.name}:`, error);
      }
    });

    const componentsToSave: OpenApiLocalStorageComponent[] = newComponents.map(component => {
      try {
        const parsedContent = yaml.load(component.yamlContent) as SchemaObject;
        return {
          name: component.name,
          type: parsedContent.type || "object",
          componentGroup: component.componentGroup,
          yamlContent: component.yamlContent,
          properties: parsedContent.properties,
          required: parsedContent.required,
          description: parsedContent.description
        };
      } catch (error) {
        console.error(`Error parsing YAML for ${component.name}:`, error);
        return {
          name: component.name,
          type: "object",
          componentGroup: component.componentGroup,
          yamlContent: component.yamlContent
        };
      }
    });

    saveComponentsToLocalStorage(componentsToSave);

    onUpdate(componentsObject);
  };

  const handleSubmit = (values: Component) => {
    try {
      yaml.load(values.yamlContent);

      const newComponents = [...components];

      if (editingIndex !== null) {
        newComponents[editingIndex] = values;
      } else {
        newComponents.push(values);
      }

      updateComponents(newComponents);
      setValidationError(null);
      setEditingIndex(null);

      form.reset({
        name: "",
        type: "schema",
        componentGroup: "Common",
        yamlContent: sampleTemplates.schema
      });

      setYamlContent(sampleTemplates.schema);

    } catch (error: any) {
      setValidationError(`YAML validation error: ${error.message}`);
    }
  };

  const handleEdit = (index: number) => {
    const component = components[index];
    form.reset(component);
    setYamlContent(component.yamlContent);
    setEditingIndex(index);
    setValidationError(null);
  };

  const handleDelete = (index: number) => {
    const newComponents = [...components];
    newComponents.splice(index, 1); // Remove component at index
    updateComponents(newComponents);

    if (editingIndex === index) {
      setEditingIndex(null);
      form.reset({
        name: "",
        type: "schema",
        componentGroup: "Common",
        yamlContent: sampleTemplates.schema
      });
      setYamlContent(sampleTemplates.schema);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setValidationError(null);
    form.reset({
      name: "",
      type: "schema",
      componentGroup: "Common",
      yamlContent: sampleTemplates.schema
    });
    setYamlContent(sampleTemplates.schema);
  };

  const handleExampleTemplateChange = (template: string) => {
    form.setValue("yamlContent", sampleTemplates[template]);
    setYamlContent(sampleTemplates[template]);
  };

  const filteredComponents = components.filter(component => {
    if (!searchQuery) return true;

    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      component.name.toLowerCase().includes(lowerCaseQuery) ||
      component.componentGroup.toLowerCase().includes(lowerCaseQuery)
    );
  });

  const groupedComponents: Record<string, Component[]> = {};

  filteredComponents.forEach(component => {
    const group = component.componentGroup;
    if (!groupedComponents[group]) {
      groupedComponents[group] = [];
    }
    groupedComponents[group].push(component);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{editingIndex !== null ? "Edit Component" : "Add New Component"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Component Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., UserSchema, ErrorResponse"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A unique name for this component
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="componentGroup"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Component Group *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., User, Authentication"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A group to categorize this component
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Example Templates</label>
                  <div className="flex gap-2 flex-wrap">
                    {schemaExampleTemplates.map(template => (
                      <Button
                        key={template.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleExampleTemplateChange(template.value)}
                      >
                        {template.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="yamlContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YAML Content *</FormLabel>
                      <FormControl>
                        <div className="border rounded-md" style={{ height: "400px" }}>
                          <Editor
                            height="100%"
                            defaultLanguage="yaml"
                            value={yamlContent}
                            onChange={handleEditorChange}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: false },
                              lineNumbers: "on",
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                              tabSize: 2,
                              wordWrap: "on",
                            }}
                            onMount={handleEditorDidMount}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Define your component using YAML syntax with auto-completion and validation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {validationError && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{validationError}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingIndex !== null ? "Update Component" : "Add Component"}
                  </Button>
                  {editingIndex !== null && (
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Component List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Saved Components</h3>

          <Input
            placeholder="Search components by name or group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          {Object.keys(groupedComponents).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No components created yet. Use the form above to create some.
            </div>
          ) : (
            Object.keys(groupedComponents).map(group => (
              <div key={group} className="space-y-2">
                <h4 className="text-md font-semibold">{group}</h4>

                {groupedComponents[group].map((component, index) => {
                  const actualIndex = components.findIndex(
                    c => c.name === component.name && c.type === component.type
                  );

                  return (
                    <div key={`${component.type}-${component.name}-${index}`} className="border rounded-md">
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => toggleComponentExpansion(actualIndex)}
                      >
                        <div className="flex items-center">
                          {expandedComponents[actualIndex] ?
                            <ChevronUp className="h-5 w-5 mr-2" /> :
                            <ChevronDown className="h-5 w-5 mr-2" />
                          }
                          <div>
                            <span className="font-medium">{component.name}</span>
                            <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-full">
                              {component.componentGroup}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(actualIndex);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(actualIndex);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {expandedComponents[actualIndex] && (
                        <div className="border-t p-3">
                          <div className="bg-muted rounded-md overflow-hidden" style={{ height: "200px" }}>
                            <Editor
                              height="100%"
                              defaultLanguage="yaml"
                              value={component.yamlContent}
                              options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: "on",
                              }}
                              theme="vs-dark"
                            />
                          </div>

                          <div className="mt-2 text-sm text-muted-foreground">
                            <p>Reference this component in your paths using:</p>
                            <code className="bg-muted p-1 rounded text-xs">
                              {`$ref: '#/components/schemas/${component.name}'`}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComponentsForm;