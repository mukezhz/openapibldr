import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RequestBodyObject, MediaTypeObject, SchemaObject, ComponentsObject, ReferenceObject } from "@/lib/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import MediaTypeForm from "./shared/MediaTypeForm";
import { loadComponentsFromLocalStorage } from "./shared/localstorage";

// Define schema types explicitly for templates
const schemaTypesEnum = z.enum(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null']);
type SchemaType = z.infer<typeof schemaTypesEnum>;


// Request body templates for common patterns
const requestBodyTemplates = {
  empty: {
    description: "",
    required: false,
    content: [
      {
        contentType: "application/json",
        useSchemaRef: false,
        schemaRef: "",
        schema: {
          type: "object" as SchemaType, // Explicit type
          description: "",
          properties: [
            { name: "id", type: "string" as SchemaType, description: "Unique identifier", required: true }
          ],
        },
      },
    ],
  },
  createResource: {
    description: "Create a new resource",
    required: true,
    content: [
      {
        contentType: "application/json",
        useSchemaRef: true,
        schemaRef: "#/components/schemas/Resource",
        schema: {
          type: "object" as SchemaType, // Explicit type
          description: "",
          properties: [],
        },
      },
    ],
  },
  updateResource: {
    description: "Update an existing resource",
    required: true,
    content: [
      {
        contentType: "application/json",
        useSchemaRef: true,
        schemaRef: "#/components/schemas/Resource",
        schema: {
          type: "object" as SchemaType, // Explicit type
          description: "",
          properties: [],
        },
      },
    ],
  },
  multipartFormData: {
    description: "Upload file with metadata",
    required: true,
    content: [
      {
        contentType: "multipart/form-data",
        useSchemaRef: false,
        schemaRef: "",
        schema: {
          type: "object" as SchemaType, // Explicit type
          description: "File upload with metadata",
          properties: [
            { name: "file", type: "string" as SchemaType, description: "The file to upload", required: true },
            { name: "description", type: "string" as SchemaType, description: "Description of the file", required: false }
          ],
        },
      },
    ],
  },
};

// Schema for request body validation
const requestBodySchema = z.object({
  description: z.string().optional(),
  required: z.boolean().optional(),
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
  ),
});

type RequestBodyFormValues = z.infer<typeof requestBodySchema>;

interface RequestBodyFormProps {
  initialValue?: RequestBodyObject;
  onUpdate: (requestBody: RequestBodyObject) => void;
  components?: ComponentsObject; // Add components as a prop
}

const RequestBodyForm: React.FC<RequestBodyFormProps> = ({ initialValue, onUpdate, components }) => {
  const [localStorageComponents, setLocalStorageComponents] = useState<ComponentsObject | null>(null);
  useEffect(() => {
    setLocalStorageComponents(loadComponentsFromLocalStorage());
  }, []);

  const getInitialValues = (): RequestBodyFormValues => {
    if (!initialValue) {
      // Now matches the schema type
      return requestBodyTemplates.empty as RequestBodyFormValues;
    }

    const contentArray: RequestBodyFormValues['content'] = Object.entries(initialValue.content || {}).map(([contentType, mediaType]) => {
      const hasSchemaRef = mediaType.schema && '$ref' in mediaType.schema;
      const schemaRef = (hasSchemaRef ? mediaType?.schema as ReferenceObject : {}).$ref || "";

      const properties = !hasSchemaRef && mediaType.schema && 'properties' in mediaType.schema && mediaType.schema.properties
        ? Object.entries(mediaType.schema.properties).map(([name, prop]) => {
          const typedProp = prop as SchemaObject;
          return {
            name,
            type: typedProp.type || "string",
            description: typedProp.description || "",
            required: !!initialValue.required,
          };
        })
        : [];

      return {
        contentType,
        useSchemaRef: hasSchemaRef!,
        schemaRef: schemaRef || undefined,
        schema: {
          type: !hasSchemaRef && mediaType.schema && 'type' in mediaType.schema ? mediaType.schema.type || "object" : "object",
          format: !hasSchemaRef && mediaType.schema && 'format' in mediaType.schema ? mediaType.schema.format || "" : "",
          description: !hasSchemaRef && mediaType.schema && 'description' in mediaType.schema ? mediaType.schema.description || "" : "",
          // Ensure properties array has correct type
          properties: properties.length > 0 ? properties.map(p => ({...p, type: p.type as SchemaType})) : [{ name: "example", type: "string" as SchemaType, description: "", required: false }],
        },
      };
    });

    return {
      description: initialValue.description || "",
      required: initialValue.required || false,
      // Ensure content array matches the schema type
      content: contentArray.length > 0 ? contentArray as RequestBodyFormValues['content'] : (requestBodyTemplates.empty as RequestBodyFormValues).content,
    };
  };

  const form = useForm<RequestBodyFormValues>({
    resolver: zodResolver(requestBodySchema),
    defaultValues: getInitialValues(),
  });

  const { fields: contentFields, append: appendContent, remove: removeContent } = useFieldArray({
    name: "content",
    control: form.control,
  });

  const handleSubmit = (values: RequestBodyFormValues) => {
    const requestBody: RequestBodyObject = {
      description: values.description || undefined,
      required: values.required || false,
      content: {},
    };

    if (values.content) {
      values.content.forEach(item => {
        if (!item || !item.contentType) return;
        
        if (item.useSchemaRef && item.schemaRef) {
          requestBody.content[item.contentType] = {
            schema: {
              $ref: item.schemaRef
            }
          };
        } else if (item.schema) {
          const mediaType: MediaTypeObject = {
            schema: {
              type: item.schema.type,
              format: item.schema.format || undefined,
              description: item.schema.description || undefined,
            } as SchemaObject,
          };

          if (item.schema.type === "object" && item.schema.properties) {
            const properties: Record<string, SchemaObject> = {};
            const required: string[] = [];

            item.schema.properties.forEach(prop => {
              if (!prop || !prop.name) return;
              
              properties[prop.name] = {
                type: prop.type,
                description: prop.description || undefined,
              };

              if (prop.required) {
                required.push(prop.name);
              }
            });

            (mediaType.schema as SchemaObject).properties = properties;
            if (required.length > 0) {
              (mediaType.schema as SchemaObject).required = required;
            }
          }

          requestBody.content[item.contentType] = mediaType;
        }
      });
    }
    
    console.log("Request Body:", requestBody);
    onUpdate(requestBody);
  };

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <Form {...form}>
          <form className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description of the request body"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Required</FormLabel>
                      <FormDescription>
                        Indicates if the request body is required
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Request Content Types</h3>

                {contentFields.map((field, index) => (
                  <MediaTypeForm
                    key={field.id}
                    control={form.control}
                    index={index}
                    remove={removeContent}
                    components={components}
                    localStorageComponents={localStorageComponents}
                    fieldId={field.id}
                    totalFields={contentFields.length}
                    formType="request"
                  />
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    appendContent({
                      contentType: "application/json",
                      useSchemaRef: false,
                      schemaRef: "",
                      schema: {
                        type: "object",
                        description: "",
                        properties: [
                          { name: "example", type: "string", description: "", required: false }
                        ],
                      },
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content Type
                </Button>
              </div>
            </div>
          </form>
        </Form>
        <Button
          type="button"
          onClick={form.handleSubmit(handleSubmit)}
          className="w-full"
        >
          Save Request Body
        </Button>
      </div>
    </FormProvider>
  );
};

export default RequestBodyForm;