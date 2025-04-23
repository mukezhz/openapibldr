import React, { useState } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MediaTypeObject, SchemaObject, ComponentsObject, ReferenceObject } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { commonStatusCodes } from "@/lib/utils/defaults";
import MediaTypeForm from "./shared/MediaTypeForm";

// Define schema types explicitly for templates
const schemaTypesEnum = z.enum(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null']);
type SchemaType = z.infer<typeof schemaTypesEnum>;

// Update templates with explicit SchemaType
const responseTemplates = {
  success: {
    statusCode: "200",
    description: "Successful operation",
    content: [
      {
        contentType: "application/json",
        useSchemaRef: false,
        schemaRef: "",
        schema: {
          type: "object" as SchemaType,
          description: "Success response",
          properties: [
            { name: "success", type: "boolean" as SchemaType, description: "Indicates if the operation was successful", required: true },
            { name: "data", type: "object" as SchemaType, description: "The response data", required: false }
          ],
        },
      },
    ],
  },
  created: {
    statusCode: "201",
    description: "Resource created successfully",
    content: [
      {
        contentType: "application/json",
        useSchemaRef: false,
        schemaRef: "",
        schema: {
          type: "object" as SchemaType,
          description: "Created resource",
          properties: [
            { name: "id", type: "string" as SchemaType, description: "ID of the created resource", required: true },
            { name: "createdAt", type: "string" as SchemaType, description: "Creation timestamp", required: true }
          ],
        },
      },
    ],
  },
  badRequest: {
    statusCode: "400",
    description: "Bad request",
    content: [
      {
        contentType: "application/json",
        useSchemaRef: false,
        schemaRef: "",
        schema: {
          type: "object" as SchemaType,
          description: "Error details",
          properties: [
            { name: "message", type: "string" as SchemaType, description: "Error message", required: true },
            { name: "errors", type: "array" as SchemaType, description: "Validation errors", required: false }
          ],
        },
      },
    ],
  },
  notFound: {
    statusCode: "404",
    description: "Resource not found",
    content: [
      {
        contentType: "application/json",
        useSchemaRef: false,
        schemaRef: "",
        schema: {
          type: "object" as SchemaType,
          description: "Error details",
          properties: [
            { name: "message", type: "string" as SchemaType, description: "Error message", required: true }
          ],
        },
      },
    ],
  },
};

// Update Zod schema to use the enum
const responseSchema = z.object({
  statusCode: z.string().min(1, { message: "Status code is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  content: z.array(
    z.object({
      contentType: z.string().min(1, "Content type is required"),
      useSchemaRef: z.boolean().optional(),
      schemaRef: z.string().optional(),
      schema: z.object({
        type: schemaTypesEnum, // Use the enum
        format: z.string().optional(),
        description: z.string().optional(),
        properties: z.array(
          z.object({
            name: z.string().min(1, "Property name is required"),
            type: schemaTypesEnum, // Use the enum
            description: z.string().optional(),
            required: z.boolean(),
          })
        ).optional(),
      }),
    })
  ).optional(),
});

type ResponseFormValues = z.infer<typeof responseSchema>;

interface ResponseFormProps {
  initialValue?: {
    statusCode: string;
    description: string;
    schemaRef?: string;
  };
  onUpdate: (response: {
    statusCode: string;
    description: string;
    schemaRef?: string;
    content?: Record<string, MediaTypeObject>;
  }) => void;
  components?: ComponentsObject;
}

const ResponseForm: React.FC<ResponseFormProps> = ({ initialValue, onUpdate, components }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const getInitialValues = (): ResponseFormValues => {
    if (!initialValue) {
      // Now matches the schema type
      return responseTemplates.success as ResponseFormValues;
    }

    // Handle existing simple response structure
    if (initialValue.statusCode && initialValue.description) {
      if (initialValue.schemaRef) {
        return {
          statusCode: initialValue.statusCode,
          description: initialValue.description,
          content: [{
            contentType: "application/json",
            useSchemaRef: true,
            schemaRef: initialValue.schemaRef,
            schema: {
              type: "object" as SchemaType,
              description: "",
              properties: [],
            }
          }]
        };
      } else {
        return {
          statusCode: initialValue.statusCode,
          description: initialValue.description,
          content: [{
            contentType: "application/json",
            useSchemaRef: false,
            schemaRef: "",
            schema: {
              type: "object" as SchemaType,
              description: "",
              properties: [
                { name: "success", type: "boolean" as SchemaType, description: "Indicates if the operation was successful", required: true }
              ],
            }
          }]
        };
      }
    }

    // Now matches the schema type
    return responseTemplates.success as ResponseFormValues;
  };

  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: getInitialValues(),
  });

  const { fields: contentFields, append: appendContent, remove: removeContent } = useFieldArray({
    name: "content",
    control: form.control,
  });

  const handleSubmit = (values: ResponseFormValues) => {
    const response: {
      statusCode: string;
      description: string;
      schemaRef?: string;
      content?: Record<string, MediaTypeObject>;
    } = {
      statusCode: values.statusCode,
      description: values.description,
      content: {} // Initialize content to fix potential undefined error
    };

    if (values.content && values.content.length > 0) {
      // Check for schemaRef on the first item (simplified logic)
      if (values.content[0].useSchemaRef && values.content[0].schemaRef) {
         // If using schema ref, don't populate content object directly, just the ref
         // This part might need adjustment based on how schemaRef should override content
         // For now, let's assume schemaRef takes precedence and content is cleared
         response.schemaRef = values.content[0].schemaRef;
         delete response.content; // Remove content if schemaRef is used (adjust if needed)
      } else {
        // Process content items if not using schemaRef on the first item
        values.content.forEach(item => {
          if (!item.contentType) return;

          const mediaType: MediaTypeObject = {
            schema: {} as SchemaObject
          };

          if (item.useSchemaRef && item.schemaRef) {
            mediaType.schema = {
              $ref: item.schemaRef
            } as ReferenceObject;
          } else if (item.schema) {
            const schema: SchemaObject = {
              type: item.schema.type,
              format: item.schema.format || undefined,
              description: item.schema.description || undefined,
            };

            if (item.schema.type === 'object' && item.schema.properties) {
              const properties: Record<string, SchemaObject> = {};
              const required: string[] = [];

              item.schema.properties.forEach(prop => {
                if (!prop.name) return;

                properties[prop.name] = {
                  type: prop.type,
                  description: prop.description || undefined,
                };

                if (prop.required) {
                  required.push(prop.name);
                }
              });

              schema.properties = properties;
              if (required.length > 0) {
                schema.required = required;
              }
            }

            mediaType.schema = schema;
          }
          // Ensure content is not undefined before assigning
          if (response.content) {
             response.content[item.contentType] = mediaType;
          }
        });
         // If after processing, content is empty, remove it
         if (response.content && Object.keys(response.content).length === 0) {
            delete response.content;
         }
      }
    } else {
       // No content array, remove content property
       delete response.content;
    }

    onUpdate(response);
  };

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <Form {...form}>
          <form className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="statusCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Code *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status code" />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      setSelectedTemplate(value);
                      const template = responseTemplates[value as keyof typeof responseTemplates];
                      if (template) {
                        form.reset(template as ResponseFormValues);
                      }
                    }}
                    value={selectedTemplate}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.keys(responseTemplates).map(template => (
                        <SelectItem key={template} value={template}>
                          {template}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Input placeholder="Response description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Response Content</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      appendContent({
                        contentType: "application/json",
                        useSchemaRef: false,
                        schemaRef: "",
                        schema: {
                          type: "object" as SchemaType,
                          description: "",
                          properties: [
                            { name: "success", type: "boolean" as SchemaType, description: "Operation success status", required: true }
                          ],
                        },
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content Type
                  </Button>
                </div>

                {contentFields && contentFields.map((field, index) => (
                  <MediaTypeForm
                    key={field.id}
                    control={form.control}
                    index={index}
                    remove={removeContent}
                    components={components}
                    fieldId={field.id}
                    totalFields={contentFields.length}
                    formType="response"
                  />
                ))}
              </div>
            </div>
          </form>
        </Form>
        <Button
          type="button"
          onClick={form.handleSubmit(handleSubmit)}
          className="w-full"
        >
          Save Response
        </Button>
      </div>
    </FormProvider>
  );
};

export default ResponseForm;