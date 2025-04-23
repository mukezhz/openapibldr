import React, { useState, useEffect, useCallback } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PathsObject, PathItemObject, OperationObject, RequestBodyObject, ComponentsObject } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { httpMethods, commonStatusCodes } from "@/lib/utils/defaults";
import RequestBodyForm from "./RequestBodyForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

// Add localStorage constants at the top of the file
const LOCAL_STORAGE_PATHS_KEY = "openapibldr_paths";

// Function to save paths to localStorage
const savePathsToLocalStorage = (paths: PathsObject) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_PATHS_KEY, JSON.stringify(paths));
  } catch (error) {
    console.error("Error saving paths to localStorage:", error);
  }
};

// Function to load paths from localStorage
const loadPathsFromLocalStorage = (): PathsObject | null => {
  try {
    const savedPaths = localStorage.getItem(LOCAL_STORAGE_PATHS_KEY);
    if (savedPaths) {
      return JSON.parse(savedPaths);
    }
  } catch (error) {
    console.error("Error loading paths from localStorage:", error);
  }
  return null;
};

// Validation schema for path items
const pathSchema = z.object({
  paths: z.array(
    z.object({
      path: z.string().min(1, { message: "Path is required" }),
      summary: z.string().optional(),
      description: z.string().optional(),
      operations: z.array(
        z.object({
          method: z.string().min(1, { message: "HTTP method is required" }),
          summary: z.string().optional(),
          description: z.string().optional(),
          operationId: z.string().optional(),
          tags: z.array(z.string()).optional().default([]),
          responses: z.array(
            z.object({
              statusCode: z.string().min(1, { message: "Status code is required" }),
              description: z.string().min(1, { message: "Description is required" }),
              schemaRef: z.string().optional(),
            })
          ),
        })
      ),
    })
  ),
});

type PathsFormValues = z.infer<typeof pathSchema>;

interface PathsFormProps {
  initialValues: PathsObject;
  onUpdate: (values: PathsObject) => void;
  components?: ComponentsObject; // Add components as a prop
}

const defaultPath = {
  path: "/example",
  summary: "Example operations",
  description: "Example API endpoints",
  operations: [
    {
      method: "get",
      summary: "Example operation",
      description: "An example API operation",
      operationId: "exampleOperation",
      tags: [],
      responses: [
        { statusCode: "200", description: "Successful operation", schemaRef: "" },
        { statusCode: "400", description: "Bad request", schemaRef: "" },
      ],
    },
  ],
};

const PathsForm: React.FC<PathsFormProps> = ({ initialValues, onUpdate, components }) => {
  // State for component
  const [expandedPaths, setExpandedPaths] = useState<Record<number, boolean>>({});
  const [expandedOperations, setExpandedOperations] = useState<Record<string, boolean>>({});
  const [selectedOperationForRequestBody, setSelectedOperationForRequestBody] = useState<{ pathIndex: number, operationIndex: number } | null>(null);
  const [requestBodies, setRequestBodies] = useState<Record<string, RequestBodyObject>>({});
  const [isRequestBodyModalOpen, setIsRequestBodyModalOpen] = useState(false);

  // Initialize form values
  const getInitialFormValues = () => {
    if (!initialValues || Object.keys(initialValues).length === 0) {
      const savedPaths = loadPathsFromLocalStorage();
      if (savedPaths) {
        return { paths: Object.values(savedPaths) };
      }
      return { paths: [defaultPath] };
    }

    const paths: any[] = [];
    const initialRequestBodies: Record<string, RequestBodyObject> = {};

    Object.entries(initialValues).forEach(([pathUrl, pathItem]) => {
      const operations: any[] = [];

      // Extract operations from the path item
      const methods = httpMethods.filter(method =>
        Object.prototype.hasOwnProperty.call(pathItem, method)
      );

      methods.forEach(method => {
        const operation = pathItem[method as keyof PathItemObject] as OperationObject;
        if (operation) {
          const responses: any[] = [];

          // Extract responses for each operation
          if (operation.responses) {
            Object.entries(operation.responses).forEach(([statusCode, response]) => {
              if (response && typeof response !== 'function') {
                responses.push({
                  statusCode,
                  description: 'description' in response ? response.description : 'Response',
                  schemaRef: 'schemaRef' in response ? response.schemaRef : '',
                });
              }
            });
          }

          // Store request body separately
          if (operation.requestBody && typeof operation.requestBody !== 'function') {
            const key = `${pathUrl}-${method}`;
            if ('content' in operation.requestBody) {
              initialRequestBodies[key] = operation.requestBody;
            }
          }

          operations.push({
            method,
            summary: operation.summary || '',
            description: operation.description || '',
            operationId: operation.operationId || '',
            tags: operation.tags || [],
            responses: responses.length > 0 ? responses : [
              { statusCode: "200", description: "Successful operation", schemaRef: "" }
            ],
          });
        }
      });

      paths.push({
        path: pathUrl,
        summary: pathItem.summary || '',
        description: pathItem.description || '',
        operations: operations.length > 0 ? operations : [
          {
            method: "get",
            summary: "",
            description: "",
            operationId: "",
            tags: [],
            responses: [
              { statusCode: "200", description: "Successful operation", schemaRef: "" }
            ],
          }
        ],
      });
    });

    // Initialize request bodies
    setTimeout(() => setRequestBodies(initialRequestBodies), 0);

    return { paths: paths.length > 0 ? paths : [defaultPath] };
  };

  // Setup form with react-hook-form
  const form = useForm<PathsFormValues>({
    resolver: zodResolver(pathSchema),
    defaultValues: getInitialFormValues()
  });

  // Define field arrays once at the top level
  const { fields: pathFields, append: appendPath, remove: removePath } = useFieldArray<PathsFormValues["paths"][number]>({
    name: "paths",
    control: form.control,
  });

  // Handle form submission to convert form data to OpenAPI format
  const handleSubmit = useCallback((values: PathsFormValues) => {
    // Convert form values back to OpenAPI paths format
    const pathsObject: PathsObject = {};

    values.paths.forEach(path => {
      const pathItemObject: PathItemObject = {
        summary: path.summary || undefined,
        description: path.description || undefined,
      };

      // Add operations to the path item
      path.operations.forEach(operation => {
        const operationObject: OperationObject = {
          summary: operation.summary || undefined,
          description: operation.description || undefined,
          operationId: operation.operationId || undefined,
          tags: operation.tags || [],
          responses: {},
        };

        // Add responses to the operation
        operation.responses.forEach(response => {
          // Handle schema reference in response
          if (response.schemaRef && response.schemaRef !== "none") {
            operationObject.responses[response.statusCode] = {
              description: response.description,
              content: {
                'application/json': {
                  schema: {
                    $ref: response.schemaRef
                  }
                }
              }
            };
          } else {
            operationObject.responses[response.statusCode] = {
              description: response.description
            };
          }
        });

        // Add request body if it exists
        const requestBodyKey = `${path.path}-${operation.method}`;
        if (requestBodies[requestBodyKey]) {
          operationObject.requestBody = requestBodies[requestBodyKey];
        }

        // Add operation to path item using the HTTP method as the key
        pathItemObject[operation.method as keyof PathItemObject] = operationObject as any;
      });

      pathsObject[path.path] = pathItemObject;
    });

    onUpdate(pathsObject);
    savePathsToLocalStorage(pathsObject);
  }, [onUpdate, requestBodies]);

  // Add a new path and expand it
  const addNewPath = useCallback(() => {
    const newPathIndex = pathFields.length;

    // Add the new path
    appendPath({
      path: `/new-path-${newPathIndex + 1}`,
      summary: "",
      description: "",
      operations: [
        {
          method: "get",
          summary: "",
          description: "",
          operationId: "",
          tags: [],
          responses: [
            { statusCode: "200", description: "Successful operation", schemaRef: "" }
          ],
        },
      ],
    });

    // Auto-expand the new path
    setTimeout(() => {
      setExpandedPaths(prev => ({
        ...prev,
        [newPathIndex]: true
      }));

      // Also scroll to it
      const newPathElement = document.getElementById(`path-${newPathIndex}`);
      if (newPathElement) {
        newPathElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Trigger form submission
      const formData = form.getValues();
      handleSubmit(formData);
    }, 100);
  }, [pathFields.length, appendPath, handleSubmit, form]);

  // Toggle path expansion
  const togglePathExpansion = useCallback((index: number) => {
    setExpandedPaths(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  // Toggle operation expansion
  const toggleOperationExpansion = useCallback((pathIndex: number, operationIndex: number) => {
    const key = `${pathIndex}-${operationIndex}`;
    setExpandedOperations(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // Handle request body updates
  const handleUpdateRequestBody = useCallback((requestBody: RequestBodyObject) => {
    if (selectedOperationForRequestBody) {
      const { pathIndex, operationIndex } = selectedOperationForRequestBody;
      const path = form.getValues(`paths.${pathIndex}.path`);
      const method = form.getValues(`paths.${pathIndex}.operations.${operationIndex}.method`);
      const key = `${path}-${method}`;

      setRequestBodies(prev => ({
        ...prev,
        [key]: requestBody
      }));

      // Close the request body editor modal
      setIsRequestBodyModalOpen(false);
      setSelectedOperationForRequestBody(null);

      // Trigger form submission to update the preview
      const formData = form.getValues();
      handleSubmit(formData);
    }
  }, [selectedOperationForRequestBody, form, handleSubmit]);

  // Helper to create a request body that references a schema
  const createSchemaBasedRequestBody = useCallback((schemaRef: string, contentType: string = 'application/json') => {
    return {
      description: `Request body using ${schemaRef.split('/').pop()}`,
      content: {
        [contentType]: {
          schema: {
            $ref: schemaRef
          }
        }
      },
      required: true
    };
  }, []);

  // Submit the form with debounce when it changes
  useEffect(() => {
    // Debounce function to prevent excessive form submissions
    const debounce = (func: Function, delay: number) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
        }, delay);
      };
    };

    const debouncedSubmit = debounce((data: PathsFormValues) => {
      handleSubmit(data);
    }, 300);

    const subscription = form.watch((data) => {
      debouncedSubmit(data as PathsFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form, handleSubmit]);

  // Main component render
  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form className="space-y-6">
              {pathFields.map((pathField, pathIndex) => (
                <PathItem
                  key={pathField.id}
                  pathIndex={pathIndex}
                  form={form}
                  expandedPaths={expandedPaths}
                  expandedOperations={expandedOperations}
                  togglePathExpansion={togglePathExpansion}
                  toggleOperationExpansion={toggleOperationExpansion}
                  removePath={removePath}
                  setSelectedOperationForRequestBody={setSelectedOperationForRequestBody}
                  setIsRequestBodyModalOpen={setIsRequestBodyModalOpen}
                  requestBodies={requestBodies}
                  handleSubmit={handleSubmit}
                  pathFields={pathFields}
                  components={components}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addNewPath}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Path
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Request Body Modal */}
      <Dialog 
        open={isRequestBodyModalOpen} 
        onOpenChange={(open) => {
          setIsRequestBodyModalOpen(open);
          if (!open) {
            setSelectedOperationForRequestBody(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedOperationForRequestBody && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Request Body for {form.getValues(`paths.${selectedOperationForRequestBody.pathIndex}.operations.${selectedOperationForRequestBody.operationIndex}.method`).toUpperCase()} {form.getValues(`paths.${selectedOperationForRequestBody.pathIndex}.path`)}
                </DialogTitle>
                <DialogDescription>
                  Define the request body for this operation
                </DialogDescription>
              </DialogHeader>
              
              <RequestBodyForm
                initialValue={(() => {
                  if (selectedOperationForRequestBody) {
                    const { pathIndex, operationIndex } = selectedOperationForRequestBody;
                    const path = form.getValues(`paths.${pathIndex}.path`);
                    const method = form.getValues(`paths.${pathIndex}.operations.${operationIndex}.method`);
                    const key = `${path}-${method}`;
                    return requestBodies[key];
                  }
                  return undefined;
                })()}
                onUpdate={handleUpdateRequestBody}
                components={components}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

type PathItemParams = {
  pathIndex: number;
  form: any;
  expandedPaths: Record<number, boolean>;
  expandedOperations: Record<string, boolean>;
  togglePathExpansion: (index: number) => void;
  toggleOperationExpansion: (pathIndex: number, operationIndex: number) => void;
  removePath: (index: number) => void;
  setSelectedOperationForRequestBody: (value: { pathIndex: number; operationIndex: number } | null) => void;
  setIsRequestBodyModalOpen: (value: boolean) => void;
  requestBodies: Record<string, RequestBodyObject>;
  handleSubmit: (values: PathsFormValues) => void;
  pathFields: any[];
  components?: ComponentsObject; // Add components as a prop
}
// Separate component for each path to isolate hook calls
const PathItem = ({
  pathIndex,
  form,
  expandedPaths,
  expandedOperations,
  togglePathExpansion,
  toggleOperationExpansion,
  removePath,
  setSelectedOperationForRequestBody,
  setIsRequestBodyModalOpen,
  requestBodies,
  handleSubmit,
  pathFields,
  components
}: PathItemParams) => {
  // Create a field array for operations within this specific path
  const { fields: operationFields, append: appendOperation, remove: removeOperation } = useFieldArray({
    name: `paths.${pathIndex}.operations`,
    control: form.control,
  });

  return (
    <div id={`path-${pathIndex}`} className="border rounded-md p-4">
      <div
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => togglePathExpansion(pathIndex)}
      >
        <div className="flex items-center">
          {expandedPaths[pathIndex] ? (
            <ChevronUp className="h-5 w-5 mr-2" />
          ) : (
            <ChevronDown className="h-5 w-5 mr-2" />
          )}
          <h3 className="text-md font-medium">
            Path: {form.watch(`paths.${pathIndex}.path`) || `Path ${pathIndex + 1}`}
          </h3>
        </div>
        {pathFields.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              removePath(pathIndex);
              // Trigger form submission after removing
              setTimeout(() => {
                const formData = form.getValues();
                handleSubmit(formData);
              }, 50);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {expandedPaths[pathIndex] && (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name={`paths.${pathIndex}.path`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Path *</FormLabel>
                <FormControl>
                  <Input placeholder="/users" {...field} />
                </FormControl>
                <FormDescription>
                  The endpoint path (e.g., /users, /products/{'{id}'})
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`paths.${pathIndex}.summary`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summary</FormLabel>
                <FormControl>
                  <Input placeholder="Path summary" {...field} />
                </FormControl>
                <FormDescription>
                  A brief summary of the path
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`paths.${pathIndex}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Path description" {...field} />
                </FormControl>
                <FormDescription>
                  A detailed description of the path
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Operations Section */}
          <div className="mt-6">
            <h4 className="text-md font-medium mb-2">Operations</h4>

            {operationFields.map((operationField, operationIndex) => (
              <OperationItem
                key={operationField.id}
                pathIndex={pathIndex}
                operationIndex={operationIndex}
                form={form}
                expandedOperations={expandedOperations}
                toggleOperationExpansion={toggleOperationExpansion}
                removeOperation={removeOperation}
                setSelectedOperationForRequestBody={setSelectedOperationForRequestBody}
                setIsRequestBodyModalOpen={setIsRequestBodyModalOpen}
                requestBodies={requestBodies}
                handleSubmit={handleSubmit}
                operationFields={operationFields}
                components={components} // Pass components to OperationItem
              />
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                appendOperation({
                  method: "get",
                  summary: "",
                  description: "",
                  operationId: "",
                  tags: [],
                  responses: [
                    { statusCode: "200", description: "Successful operation", schemaRef: "" }
                  ],
                });

                // Auto-expand the new operation
                const newOperationKey = `${pathIndex}-${operationFields.length}`;
                toggleOperationExpansion(pathIndex, operationFields.length);

                // Trigger form submission
                setTimeout(() => {
                  const formData = form.getValues();
                  handleSubmit(formData);
                }, 50);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Operation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

type OperationItemParams = {
  pathIndex: number;
  operationIndex: number;
  form: any;
  expandedOperations: Record<string, boolean>;
  toggleOperationExpansion: (pathIndex: number, operationIndex: number) => void;
  removeOperation: (index: number) => void;
  setSelectedOperationForRequestBody: (value: { pathIndex: number; operationIndex: number } | null) => void;
  setIsRequestBodyModalOpen: (value: boolean) => void;
  requestBodies: Record<string, RequestBodyObject>;
  handleSubmit: (values: PathsFormValues) => void;
  operationFields: any[];
  components?: ComponentsObject; // Add components as a prop
}
// Separate component for each operation to isolate hook calls
const OperationItem: React.FC<OperationItemParams> = ({
  pathIndex,
  operationIndex,
  form,
  expandedOperations,
  toggleOperationExpansion,
  removeOperation,
  setSelectedOperationForRequestBody,
  setIsRequestBodyModalOpen,
  requestBodies,
  handleSubmit,
  operationFields,
  components
}) => {
  const operationKey = `${pathIndex}-${operationIndex}`;
  const isExpanded = expandedOperations[operationKey];
  const currentMethod = form.watch(`paths.${pathIndex}.operations.${operationIndex}.method`);
  const currentPath = form.watch(`paths.${pathIndex}.path`);

  // Create a field array for responses within this specific operation
  const { fields: responseFields, append: appendResponse, remove: removeResponse } = useFieldArray({
    name: `paths.${pathIndex}.operations.${operationIndex}.responses`,
    control: form.control,
  });

  // Check if request body exists for this operation
  const path = form.getValues(`paths.${pathIndex}.path`);
  const method = form.getValues(`paths.${pathIndex}.operations.${operationIndex}.method`);
  const requestBodyKey = `${path}-${method}`;
  const hasRequestBody = !!requestBodies[requestBodyKey];

  const getMethodBadgeColor = (method: string) => {
    switch(method.toLowerCase()) {
      case 'get': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'post': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'put': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'delete': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'patch': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="border rounded-md p-3 mb-3 bg-muted/10">
      <div
        className="flex items-center justify-between cursor-pointer mb-2"
        onClick={() => toggleOperationExpansion(pathIndex, operationIndex)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 mr-1" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-1" />
          )}
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${getMethodBadgeColor(currentMethod)}`}>
            {currentMethod ? currentMethod.toUpperCase() : 'METHOD'}
          </span>
          <span className="text-sm font-medium">{currentPath || '/path'}</span>
        </div>
        {operationFields.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              removeOperation(operationIndex);
              // Trigger form submission after removing
              setTimeout(() => {
                const formData = form.getValues();
                handleSubmit(formData);
              }, 50);
            }}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3 pl-1">
          <div className="flex gap-2 items-end">
            <FormField
              control={form.control}
              name={`paths.${pathIndex}.operations.${operationIndex}.method`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Method *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Trigger form submission
                      setTimeout(() => {
                        const formData = form.getValues();
                        handleSubmit(formData);
                      }, 50);
                    }}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {httpMethods.map(method => (
                        <SelectItem key={method} value={method}>
                          {method.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant={hasRequestBody ? "secondary" : "outline"}
              size="sm"
              className="mb-2"
              onClick={() => {
                // Open the request body editor modal
                setSelectedOperationForRequestBody({
                  pathIndex,
                  operationIndex
                });
                setIsRequestBodyModalOpen(true);
              }}
            >
              {hasRequestBody ? 'Edit Request' : 'Add Request'}
            </Button>
          </div>

          <FormField
            control={form.control}
            name={`paths.${pathIndex}.operations.${operationIndex}.operationId`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operation ID</FormLabel>
                <FormControl>
                  <Input placeholder="getUserById" {...field} />
                </FormControl>
                <FormDescription>
                  A unique identifier for the operation
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={`paths.${pathIndex}.operations.${operationIndex}.summary`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Input placeholder="Operation summary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`paths.${pathIndex}.operations.${operationIndex}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Operation description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name={`paths.${pathIndex}.operations.${operationIndex}.tags`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Comma separated tags (e.g. Users, Admin)" 
                    value={field.value ? field.value.join(', ') : ''}
                    onChange={(e) => {
                      const tagsString = e.target.value;
                      const tagsArray = tagsString
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag !== '');
                      field.onChange(tagsArray);
                      // Trigger form submission
                      setTimeout(() => {
                        const formData = form.getValues();
                        handleSubmit(formData);
                      }, 50);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Tags for grouping operations (e.g., Users, Admin)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Responses Section */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h6 className="text-sm font-medium">Responses</h6>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  appendResponse({ statusCode: "200", description: "Successful operation", schemaRef: "" });
                  // Trigger form submission
                  setTimeout(() => {
                    const formData = form.getValues();
                    handleSubmit(formData);
                  }, 50);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Response
              </Button>
            </div>

            <div className="space-y-2">
              {responseFields.map((responseField, responseIndex) => (
                <div key={responseField.id} className="flex gap-2 p-2 border rounded-md bg-muted/5">
                  <FormField
                    control={form.control}
                    name={`paths.${pathIndex}.operations.${operationIndex}.responses.${responseIndex}.statusCode`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Status Code</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Trigger form submission
                            setTimeout(() => {
                              const formData = form.getValues();
                              handleSubmit(formData);
                            }, 50);
                          }}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Status Code" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {commonStatusCodes.map(code => (
                              <SelectItem key={code} value={code}>
                                {code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`paths.${pathIndex}.operations.${operationIndex}.responses.${responseIndex}.schemaRef`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Response Schema</FormLabel>
                        <Select
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Reference schema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {/* Reference schemas from components */}
                            {Object.entries(components?.schemas || {}).map(([name]) => (
                              <SelectItem key={name} value={`#/components/schemas/${name}`}>
                                {name}
                              </SelectItem>
                            ))}
                            {/* Reference response components */}
                            {Object.entries(components?.responses || {}).map(([name]) => (
                              <SelectItem key={`resp-${name}`} value={`#/components/responses/${name}`}>
                                Response: {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`paths.${pathIndex}.operations.${operationIndex}.responses.${responseIndex}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-[2]">
                        <FormLabel className="text-xs">Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Response description" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {responseFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-6"
                      onClick={() => {
                        removeResponse(responseIndex);
                        // Trigger form submission
                        setTimeout(() => {
                          const formData = form.getValues();
                          handleSubmit(formData);
                        }, 50);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PathsForm;