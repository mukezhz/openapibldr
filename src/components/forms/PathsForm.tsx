import React, { useState, useCallback } from "react";
import {
  useFieldArray,
  useForm,
  UseFormReturn,
  FieldArrayWithId,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  PathsObject,
  PathItemObject,
  OperationObject,
  RequestBodyObject,
  ComponentsObject,
} from "@/lib/types";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { httpMethods, commonStatusCodes } from "@/lib/utils/defaults";
import RequestBodyForm from "./RequestBodyForm";
import ResponseForm from "./ResponseForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  loadPathsFromLocalStorage,
  savePathsToLocalStorage,
} from "./shared/localstorage";
import { useFormAutoSubmit } from "@/hooks/useFormAutoSubmit";
import { ExpandableItem } from "@/components/shared/ExpandableItem";
import { AddButton } from "@/components/shared/AddButton";

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
          tags: z.array(z.string()),
          requestBody: z
            .object({
              description: z.string().optional(),
              required: z.boolean().optional(),
              content: z
                .array(
                  z.object({
                    contentType: z.string(),
                    schemaRef: z.string().optional(),
                  })
                )
                .optional(),
            })
            .optional(),
          responses: z.array(
            z.object({
              statusCode: z
                .string()
                .min(1, { message: "Status code is required" }),
              description: z
                .string()
                .min(1, { message: "Description is required" }),
              schemaRef: z.string().optional(),
            })
          ),
        })
      ),
    })
  ),
});

type PathsFormValues = z.infer<typeof pathSchema>;

type PathItem = PathsFormValues["paths"][number];
type OperationItem = PathItem["operations"][number];

type NestedFieldArrays = {
  paths: "paths";
  operations: (pathIndex: number) => `paths.${number}.operations`;
  responses: (
    pathIndex: number,
    operationIndex: number
  ) => `paths.${number}.operations.${number}.responses`;
  requestContent: (
    pathIndex: number,
    operationIndex: number
  ) => `paths.${number}.operations.${number}.requestBody.content`;
};

const fieldArrayPaths: NestedFieldArrays = {
  paths: "paths",
  operations: (pathIndex) => `paths.${pathIndex}.operations`,
  responses: (pathIndex, operationIndex) =>
    `paths.${pathIndex}.operations.${operationIndex}.responses`,
  requestContent: (pathIndex, operationIndex) =>
    `paths.${pathIndex}.operations.${operationIndex}.requestBody.content`,
};

interface PathsFormProps {
  initialValues: PathsObject;
  onUpdate: (values: PathsObject) => void;
  components?: ComponentsObject;
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
        {
          statusCode: "200",
          description: "Successful operation",
          schemaRef: "",
        },
        { statusCode: "400", description: "Bad request", schemaRef: "" },
      ],
    },
  ],
};

const PathsForm: React.FC<PathsFormProps> = ({
  initialValues,
  onUpdate,
  components,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Record<number, boolean>>(
    {}
  );
  const [expandedOperations, setExpandedOperations] = useState<
    Record<string, boolean>
  >({});
  const [selectedOperationForRequestBody, setSelectedOperationForRequestBody] =
    useState<{ pathIndex: number; operationIndex: number } | null>(null);
  const [requestBodies, setRequestBodies] = useState<
    Record<string, RequestBodyObject>
  >({});
  const [isRequestBodyModalOpen, setIsRequestBodyModalOpen] = useState(false);

  const [selectedOperationForResponse, setSelectedOperationForResponse] =
    useState<{ pathIndex: number; operationIndex: number } | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseToEdit, setResponseToEdit] = useState<{
    index: number;
    data: any;
  } | null>(null);

  const getInitialFormValues = () => {
    const savedPaths = loadPathsFromLocalStorage();
    if (Object.keys(savedPaths).length > 0) {
      const paths: any[] = [];

      Object.entries(savedPaths).forEach(([pathUrl, pathItem]) => {
        const operations: any[] = [];

        const methods = httpMethods.filter((method) =>
          Object.prototype.hasOwnProperty.call(pathItem, method)
        );

        methods.forEach((method) => {
          const operation = pathItem[
            method as keyof PathItemObject
          ] as OperationObject;
          if (operation) {
            const responses: any[] = [];

            if (operation.responses) {
              Object.entries(operation.responses).forEach(
                ([statusCode, response]) => {
                  if (response && typeof response !== "function") {
                    responses.push({
                      statusCode,
                      description:
                        "description" in response
                          ? response.description
                          : "Response",
                      schemaRef:
                        "schemaRef" in response ? response.schemaRef : "",
                    });
                  }
                }
              );
            }

            let requestBody: any = undefined;
            if (
              operation.requestBody &&
              typeof operation.requestBody !== "function"
            ) {
              const reqBody = operation.requestBody;
              if ("content" in reqBody) {
                const contentArray = Object.entries(reqBody.content).map(
                  ([contentType, mediaType]) => ({
                    contentType,
                    schemaRef:
                      mediaType.schema && "$ref" in mediaType.schema
                        ? mediaType.schema.$ref
                        : "",
                  })
                );

                requestBody = {
                  description: reqBody.description || "",
                  required: reqBody.required || false,
                  content:
                    contentArray.length > 0
                      ? contentArray
                      : [{ contentType: "application/json", schemaRef: "" }],
                };
              }
            }

            operations.push({
              method,
              summary: operation.summary || "",
              description: operation.description || "",
              operationId: operation.operationId || "",
              tags: operation.tags || [],
              requestBody,
              responses:
                responses.length > 0
                  ? responses
                  : [
                      {
                        statusCode: "200",
                        description: "Successful operation",
                        schemaRef: "",
                      },
                    ],
            });
          }
        });

        paths.push({
          path: pathUrl,
          summary: pathItem.summary || "",
          description: pathItem.description || "",
          operations:
            operations.length > 0
              ? operations
              : [
                  {
                    method: "get",
                    summary: "",
                    description: "",
                    operationId: "",
                    tags: [],
                    responses: [
                      {
                        statusCode: "200",
                        description: "Successful operation",
                        schemaRef: "",
                      },
                    ],
                  },
                ],
        });
      });

      return { paths: paths.length > 0 ? paths : [defaultPath] };
    }

    if (!initialValues || Object.keys(initialValues).length === 0) {
      return { paths: [defaultPath] };
    }

    const paths: any[] = [];

    Object.entries(initialValues).forEach(([pathUrl, pathItem]) => {
      const operations: any[] = [];
      const methods = httpMethods.filter((method) =>
        Object.prototype.hasOwnProperty.call(pathItem, method)
      );

      methods.forEach((method) => {
        const operation = pathItem[
          method as keyof PathItemObject
        ] as OperationObject;
        if (operation) {
          const responses: any[] = [];

          if (operation.responses) {
            Object.entries(operation.responses).forEach(
              ([statusCode, response]) => {
                if (response && typeof response !== "function") {
                  responses.push({
                    statusCode,
                    description:
                      "description" in response
                        ? response.description
                        : "Response",
                    schemaRef:
                      "schemaRef" in response ? response.schemaRef : "",
                  });
                }
              }
            );
          }

          let requestBody: any = undefined;
          if (
            operation.requestBody &&
            typeof operation.requestBody !== "function"
          ) {
            const reqBody = operation.requestBody;
            if ("content" in reqBody) {
              const contentArray = Object.entries(reqBody.content).map(
                ([contentType, mediaType]) => ({
                  contentType,
                  schemaRef:
                    mediaType.schema && "$ref" in mediaType.schema
                      ? mediaType.schema.$ref
                      : "",
                })
              );

              requestBody = {
                description: reqBody.description || "",
                required: reqBody.required || false,
                content:
                  contentArray.length > 0
                    ? contentArray
                    : [{ contentType: "application/json", schemaRef: "" }],
              };
            }
          }

          operations.push({
            method,
            summary: operation.summary || "",
            description: operation.description || "",
            operationId: operation.operationId || "",
            tags: operation.tags || [],
            requestBody,
            responses:
              responses.length > 0
                ? responses
                : [
                    {
                      statusCode: "200",
                      description: "Successful operation",
                      schemaRef: "",
                    },
                  ],
          });
        }
      });

      paths.push({
        path: pathUrl,
        summary: pathItem.summary || "",
        description: pathItem.description || "",
        operations:
          operations.length > 0
            ? operations
            : [
                {
                  method: "get",
                  summary: "",
                  description: "",
                  operationId: "",
                  tags: [],
                  responses: [
                    {
                      statusCode: "200",
                      description: "Successful operation",
                      schemaRef: "",
                    },
                  ],
                },
              ],
      });
    });

    return { paths: paths.length > 0 ? paths : [defaultPath] };
  };

  const form = useForm<PathsFormValues>({
    resolver: zodResolver(pathSchema),
    defaultValues: getInitialFormValues(),
  });

  const {
    fields: pathFields,
    append: appendPath,
    remove: removePath,
  } = useFieldArray({
    name: fieldArrayPaths.paths,
    control: form.control,
  });

  const handleSubmit = useCallback(
    (values: PathsFormValues) => {
      const pathsObject: PathsObject = {};

      values.paths.forEach((path) => {
        if (!path?.path) return;

        const pathValue = path.path.startsWith("/")
          ? path.path
          : `/${path.path}`;

        const pathItemObject: PathItemObject = {
          summary: path.summary || undefined,
          description: path.description || undefined,
        };

        path.operations.forEach((operation) => {
          if (!operation) return;

          const operationObject: OperationObject = {
            summary: operation.summary || undefined,
            description: operation.description || undefined,
            operationId: operation.operationId || undefined,
            tags: operation.tags || [],
            responses: {},
          };

          operation.responses.forEach((response) => {
            if (!response) return;

            if (response.schemaRef && response.schemaRef !== "none") {
              operationObject.responses[response.statusCode] = {
                description: response.description,
                content: {
                  "application/json": {
                    schema: {
                      $ref: response.schemaRef,
                    },
                  },
                },
              };
            } else {
              operationObject.responses[response.statusCode] = {
                description: response.description,
              };
            }
          });

          if (
            operation.requestBody &&
            operation.requestBody.content &&
            operation.requestBody.content.length > 0
          ) {
            const requestBodyObj: RequestBodyObject = {
              description: operation.requestBody.description,
              required: operation.requestBody.required,
              content: {},
            };

            operation.requestBody.content.forEach((content) => {
              if (content.contentType) {
                requestBodyObj.content[content.contentType] = {
                  schema: content.schemaRef ? { $ref: content.schemaRef } : {},
                };
              }
            });

            operationObject.requestBody = requestBodyObj;
          } else {
            const requestBodyKey = `${pathValue}-${operation.method}`;
            if (requestBodies[requestBodyKey]) {
              operationObject.requestBody = requestBodies[requestBodyKey];
            }
          }

          pathItemObject[operation.method as keyof PathItemObject] =
            operationObject as any;
        });

        pathsObject[pathValue] = pathItemObject;
      });

      savePathsToLocalStorage(pathsObject);

      onUpdate(pathsObject);
    },
    [onUpdate, requestBodies]
  );

  // Use our new reusable useFormAutoSubmit hook
  useFormAutoSubmit(form, handleSubmit, 300);

  const addNewPath = useCallback(() => {
    const newPathIndex = pathFields.length;

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
            {
              statusCode: "200",
              description: "Successful operation",
              schemaRef: "",
            },
          ],
        },
      ],
    });

    setTimeout(() => {
      setExpandedPaths((prev) => ({
        ...prev,
        [newPathIndex]: true,
      }));

      const newPathElement = document.getElementById(`path-${newPathIndex}`);
      if (newPathElement) {
        newPathElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      const formData = form.getValues();
      handleSubmit(formData);
    }, 100);
  }, [pathFields.length, appendPath, handleSubmit, form]);

  const togglePathExpansion = useCallback((index: number) => {
    setExpandedPaths((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  const toggleOperationExpansion = useCallback(
    (pathIndex: number, operationIndex: number) => {
      const key = `${pathIndex}-${operationIndex}`;
      setExpandedOperations((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    },
    []
  );

  const handleUpdateRequestBody = useCallback(
    (requestBody: RequestBodyObject) => {
      if (selectedOperationForRequestBody) {
        const { pathIndex, operationIndex } = selectedOperationForRequestBody;
        let path = form.getValues(`paths.${pathIndex}.path`) || "";
        const method =
          form.getValues(
            `paths.${pathIndex}.operations.${operationIndex}.method`
          ) || "get";

        path = path.startsWith("/") ? path : `/${path}`;
        const key = `${path}-${method}`;

        setRequestBodies((prev) => ({
          ...prev,
          [key]: requestBody,
        }));

        if (requestBody && requestBody.content) {
          const contentArray = Object.entries(requestBody.content).map(
            ([contentType, mediaTypeObj]) => {
              let schemaRef = "";
              if (mediaTypeObj.schema && "$ref" in mediaTypeObj.schema) {
                schemaRef = mediaTypeObj.schema.$ref ?? "";
              }
              return {
                contentType,
                schemaRef,
              };
            }
          );

          form.setValue(
            `paths.${pathIndex}.operations.${operationIndex}.requestBody`,
            {
              description: requestBody.description || "",
              required: requestBody.required || false,
              content: contentArray,
            }
          );
        }

        setIsRequestBodyModalOpen(false);
        setSelectedOperationForRequestBody(null);

        const formData = form.getValues();
        handleSubmit(formData);
      }
    },
    [selectedOperationForRequestBody, form, handleSubmit]
  );

  const handleUpdateResponse = useCallback(
    (response: any) => {
      if (selectedOperationForResponse) {
        const { pathIndex, operationIndex } = selectedOperationForResponse;

        if (responseToEdit) {
          const responseIndex = responseToEdit.index;
          form.setValue(
            `paths.${pathIndex}.operations.${operationIndex}.responses.${responseIndex}`,
            {
              statusCode: response.statusCode,
              description: response.description,
              schemaRef: response.schemaRef || "",
            }
          );
        } else {
          const currentResponses =
            form.getValues(
              `paths.${pathIndex}.operations.${operationIndex}.responses`
            ) || [];

          form.setValue(
            `paths.${pathIndex}.operations.${operationIndex}.responses`,
            [
              ...currentResponses,
              {
                statusCode: response.statusCode,
                description: response.description,
                schemaRef: response.schemaRef || "",
              },
            ]
          );
        }

        setIsResponseModalOpen(false);
        setSelectedOperationForResponse(null);
        setResponseToEdit(null);

        setTimeout(() => {
          const formData = form.getValues();
          handleSubmit(formData);
        }, 50);
      }
    },
    [selectedOperationForResponse, responseToEdit, form, handleSubmit]
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>API Paths</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
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
                  setSelectedOperationForRequestBody={
                    setSelectedOperationForRequestBody
                  }
                  setIsRequestBodyModalOpen={setIsRequestBodyModalOpen}
                  requestBodies={requestBodies}
                  handleSubmit={handleSubmit}
                  pathFields={pathFields}
                  components={components}
                  setSelectedOperationForResponse={
                    setSelectedOperationForResponse
                  }
                  setIsResponseModalOpen={setIsResponseModalOpen}
                  setResponseToEdit={setResponseToEdit}
                />
              ))}

              <AddButton onClick={addNewPath} label="Add Path" />
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
                  Request Body for{" "}
                  {form
                    .getValues(
                      `paths.${selectedOperationForRequestBody.pathIndex}.operations.${selectedOperationForRequestBody.operationIndex}.method`
                    )
                    .toUpperCase()}{" "}
                  {form.getValues(
                    `paths.${selectedOperationForRequestBody.pathIndex}.path`
                  )}
                </DialogTitle>
                <DialogDescription>
                  Define the request body for this operation
                </DialogDescription>
              </DialogHeader>

              <RequestBodyForm
                initialValue={(() => {
                  if (selectedOperationForRequestBody) {
                    const { pathIndex, operationIndex } =
                      selectedOperationForRequestBody;
                    const path = form.getValues(`paths.${pathIndex}.path`);
                    const method = form.getValues(
                      `paths.${pathIndex}.operations.${operationIndex}.method`
                    );
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

      {/* Response Modal */}
      <Dialog
        open={isResponseModalOpen}
        onOpenChange={(open) => {
          setIsResponseModalOpen(open);
          if (!open) {
            setSelectedOperationForResponse(null);
            setResponseToEdit(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedOperationForResponse && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {responseToEdit ? "Edit" : "Add"} Response for{" "}
                  {form
                    .getValues(
                      `paths.${selectedOperationForResponse.pathIndex}.operations.${selectedOperationForResponse.operationIndex}.method`
                    )
                    .toUpperCase()}{" "}
                  {form.getValues(
                    `paths.${selectedOperationForResponse.pathIndex}.path`
                  )}
                </DialogTitle>
                <DialogDescription>
                  Define the response for this operation
                </DialogDescription>
              </DialogHeader>

              <ResponseForm
                initialValue={responseToEdit?.data || undefined}
                onUpdate={handleUpdateResponse}
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
  form: UseFormReturn<PathsFormValues>; // Use proper form type
  expandedPaths: Record<number, boolean>;
  expandedOperations: Record<string, boolean>;
  togglePathExpansion: (index: number) => void;
  toggleOperationExpansion: (pathIndex: number, operationIndex: number) => void;
  removePath: (index: number) => void;
  setSelectedOperationForRequestBody: (
    value: { pathIndex: number; operationIndex: number } | null
  ) => void;
  setIsRequestBodyModalOpen: (value: boolean) => void;
  requestBodies: Record<string, RequestBodyObject>;
  handleSubmit: (values: PathsFormValues) => void;
  pathFields: FieldArrayWithId<PathsFormValues, "paths", "id">[];
  components?: ComponentsObject; // Add components as a prop
  setSelectedOperationForResponse: (
    value: { pathIndex: number; operationIndex: number } | null
  ) => void;
  setIsResponseModalOpen: (value: boolean) => void;
  setResponseToEdit: (value: { index: number; data: any } | null) => void;
};

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
  components,
  setSelectedOperationForResponse,
  setIsResponseModalOpen,
  setResponseToEdit,
}: PathItemParams) => {
  // Create a field array for operations within this specific path
  const {
    fields: operationFields,
    append: appendOperation,
    remove: removeOperation,
  } = useFieldArray({
    name: fieldArrayPaths.operations(pathIndex) as any,
    control: form.control,
  });

  const pathTitle =
    form.watch(`paths.${pathIndex}.path`) || `Path ${pathIndex + 1}`;
  const isExpanded = expandedPaths[pathIndex] || false;

  return (
    <ExpandableItem
      title={`Path: ${pathTitle}`}
      isExpanded={isExpanded}
      onToggleExpand={() => togglePathExpansion(pathIndex)}
      onDelete={
        pathFields.length > 1
          ? () => {
              removePath(pathIndex);
              setTimeout(() => {
                const formData = form.getValues();
                handleSubmit(formData);
              }, 50);
            }
          : undefined
      }
      canDelete={pathFields.length > 1}
    >
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
                The endpoint path (e.g., /users, /products/{"{id}"})
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
              <FormDescription>A brief summary of the path</FormDescription>
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
              setSelectedOperationForRequestBody={
                setSelectedOperationForRequestBody
              }
              setIsRequestBodyModalOpen={setIsRequestBodyModalOpen}
              requestBodies={requestBodies}
              handleSubmit={handleSubmit}
              operationFields={operationFields}
              components={components} // Pass components to OperationItem
              setSelectedOperationForResponse={setSelectedOperationForResponse}
              setIsResponseModalOpen={setIsResponseModalOpen}
              setResponseToEdit={setResponseToEdit}
            />
          ))}

          <AddButton
            onClick={() => {
              appendOperation({
                method: "get",
                summary: "",
                description: "",
                operationId: "",
                tags: [],
                responses: [
                  {
                    statusCode: "200",
                    description: "Successful operation",
                    schemaRef: "",
                  },
                ],
              });

              // Auto-expand the new operation
              toggleOperationExpansion(pathIndex, operationFields.length);

              // Trigger form submission
              setTimeout(() => {
                const formData = form.getValues();
                handleSubmit(formData);
              }, 50);
            }}
            label="Add Operation"
            size="sm"
          />
        </div>
      </div>
    </ExpandableItem>
  );
};

type OperationItemParams = {
  pathIndex: number;
  operationIndex: number;
  form: UseFormReturn<PathsFormValues>; // Use proper form type
  expandedOperations: Record<string, boolean>;
  toggleOperationExpansion: (pathIndex: number, operationIndex: number) => void;
  removeOperation: (index: number) => void;
  setSelectedOperationForRequestBody: (
    value: { pathIndex: number; operationIndex: number } | null
  ) => void;
  setIsRequestBodyModalOpen: (value: boolean) => void;
  requestBodies: Record<string, RequestBodyObject>;
  handleSubmit: (values: PathsFormValues) => void;
  operationFields: any[]; // Change the strict typing to any[] to avoid the type mismatch
  components?: ComponentsObject; // Add components as a prop
  // Add new props for response modal
  setSelectedOperationForResponse: (
    value: { pathIndex: number; operationIndex: number } | null
  ) => void;
  setIsResponseModalOpen: (value: boolean) => void;
  setResponseToEdit: (value: { index: number; data: any } | null) => void;
};
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
  components,
  setSelectedOperationForResponse,
  setIsResponseModalOpen,
  setResponseToEdit,
}) => {
  const operationKey = `${pathIndex}-${operationIndex}`;
  const isExpanded = expandedOperations[operationKey];
  const currentMethod = form.watch(
    `paths.${pathIndex}.operations.${operationIndex}.method`
  );
  const currentPath = form.watch(`paths.${pathIndex}.path`);

  // Create a field array for responses within this specific operation
  const { fields: responseFields, remove: removeResponse } = useFieldArray({
    name: fieldArrayPaths.responses(pathIndex, operationIndex) as any,
    control: form.control,
  });

  // Create a field array for request body content types
  const { fields: requestContentFields, remove: removeRequestContent } =
    useFieldArray({
      name: fieldArrayPaths.requestContent(pathIndex, operationIndex) as any,
      control: form.control,
    });

  // Check if request body exists for this operation
  const path = form.getValues(`paths.${pathIndex}.path`);
  const method = form.getValues(
    `paths.${pathIndex}.operations.${operationIndex}.method`
  );
  const requestBodyKey = `${path}-${method}`;
  const hasRequestBody = !!requestBodies[requestBodyKey];

  const getMethodBadgeColor = (method: string) => {
    switch (method.toLowerCase()) {
      case "get":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "post":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "put":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "patch":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  // Create title with method badge
  const titleWithBadge = (
    <div className="flex items-center gap-2">
      <span
        className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${getMethodBadgeColor(currentMethod)}`}
      >
        {currentMethod ? currentMethod.toUpperCase() : "METHOD"}
      </span>
      <span className="text-sm font-medium">{currentPath || "/path"}</span>
    </div>
  );

  return (
    <ExpandableItem
      title={titleWithBadge}
      isExpanded={isExpanded}
      onToggleExpand={() => toggleOperationExpansion(pathIndex, operationIndex)}
      onDelete={
        operationFields.length > 1
          ? () => {
              removeOperation(operationIndex);
              // Trigger form submission after removing
              setTimeout(() => {
                const formData = form.getValues();
                handleSubmit(formData);
              }, 50);
            }
          : undefined
      }
      canDelete={operationFields.length > 1}
      className="border rounded-md p-3 mb-3 bg-muted/10"
    >
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
                    {httpMethods.map((method) => (
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
                operationIndex,
              });
              setIsRequestBodyModalOpen(true);
            }}
            disabled={
              form
                .getValues(
                  `paths.${pathIndex}.operations.${operationIndex}.method`
                )
                .toLowerCase() === "get"
            }
          >
            {hasRequestBody ? "Edit Request" : "Add Request"}
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
                  value={field.value ? field.value.join(", ") : ""}
                  onChange={(e) => {
                    const tagsString = e.target.value;
                    const tagsArray = tagsString
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag !== "");
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

        {/* Request Body Section */}
        <div className="mt-4">
          <div className="space-y-2">
            {requestContentFields.map(
              (requestContentField, requestContentIndex) => (
                <div
                  key={requestContentField.id}
                  className="flex gap-2 p-2 border rounded-md bg-muted/5"
                >
                  <FormField
                    control={form.control}
                    name={`paths.${pathIndex}.operations.${operationIndex}.requestBody.content.${requestContentIndex}.contentType`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Content Type</FormLabel>
                        <FormControl>
                          <Input placeholder="application/json" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`paths.${pathIndex}.operations.${operationIndex}.requestBody.content.${requestContentIndex}.schemaRef`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">
                          Schema Reference
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Reference schema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {/* Reference schemas from components */}
                            {Object.entries(components?.schemas || {}).map(
                              ([name]) => (
                                <SelectItem
                                  key={name}
                                  value={`#/components/schemas/${name}`}
                                >
                                  {name}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-6"
                    onClick={() => {
                      removeRequestContent(requestContentIndex);
                      // Trigger form submission
                      setTimeout(() => {
                        const formData = form.getValues();
                        handleSubmit(formData);
                      }, 50);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )
            )}

            {requestContentFields.length > 0 && (
              <div className="flex gap-2 p-2 border rounded-md bg-muted/5">
                <FormField
                  control={form.control}
                  name={`paths.${pathIndex}.operations.${operationIndex}.requestBody.description`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Request body description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`paths.${pathIndex}.operations.${operationIndex}.requestBody.required`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 h-full pt-5">
                      <FormLabel className="text-xs">Required</FormLabel>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            // Trigger form submission
                            setTimeout(() => {
                              const formData = form.getValues();
                              handleSubmit(formData);
                            }, 50);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Responses Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h6 className="text-sm font-medium">Responses</h6>
            <AddButton
              onClick={() => {
                setSelectedOperationForResponse({
                  pathIndex,
                  operationIndex,
                });
                setIsResponseModalOpen(true);
                setResponseToEdit(null);
              }}
              label="Add Response"
              size="sm"
            />
          </div>

          <div className="space-y-2">
            {responseFields.map((responseField, responseIndex) => (
              <div
                key={responseField.id}
                className="flex gap-2 p-2 border rounded-md bg-muted/5"
              >
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
                          {commonStatusCodes.map((code) => (
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
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Reference schema" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {/* Reference schemas from components */}
                          {Object.entries(components?.schemas || {}).map(
                            ([name]) => (
                              <SelectItem
                                key={name}
                                value={`#/components/schemas/${name}`}
                              >
                                {name}
                              </SelectItem>
                            )
                          )}
                          {/* Reference response components */}
                          {Object.entries(components?.responses || {}).map(
                            ([name]) => (
                              <SelectItem
                                key={`resp-${name}`}
                                value={`#/components/responses/${name}`}
                              >
                                Response: {name}
                              </SelectItem>
                            )
                          )}
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

                <div className="flex gap-1 mt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Open the response modal for editing
                      setSelectedOperationForResponse({
                        pathIndex,
                        operationIndex,
                      });
                      setResponseToEdit({
                        index: responseIndex,
                        data: form.getValues(
                          `paths.${pathIndex}.operations.${operationIndex}.responses.${responseIndex}`
                        ),
                      });
                      setIsResponseModalOpen(true);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-pencil"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </Button>

                  {responseFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </ExpandableItem>
  );
};

export default PathsForm;
