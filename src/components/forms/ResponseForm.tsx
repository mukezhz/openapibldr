import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ResponseObject, MediaTypeObject, SchemaObject, ComponentsObject, ReferenceObject } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { schemaTypes, commonStatusCodes } from "@/lib/utils/defaults";
import { Card, CardContent } from "@/components/ui/card";

// Response templates for common patterns
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
          type: "object",
          description: "Success response",
          properties: [
            { name: "success", type: "boolean", description: "Indicates if the operation was successful", required: true },
            { name: "data", type: "object", description: "The response data", required: false }
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
          type: "object",
          description: "Created resource",
          properties: [
            { name: "id", type: "string", description: "ID of the created resource", required: true },
            { name: "createdAt", type: "string", description: "Creation timestamp", required: true }
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
          type: "object",
          description: "Error details",
          properties: [
            { name: "message", type: "string", description: "Error message", required: true },
            { name: "errors", type: "array", description: "Validation errors", required: false }
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
          type: "object",
          description: "Error details",
          properties: [
            { name: "message", type: "string", description: "Error message", required: true }
          ],
        },
      },
    ],
  },
};

// Schema for response validation
const responseSchema = z.object({
  statusCode: z.string().min(1, { message: "Status code is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  content: z.array(
    z.object({
      contentType: z.string().min(1, "Content type is required"),
      useSchemaRef: z.boolean().optional(),
      schemaRef: z.string().optional(),
      schema: z.object({
        type: z.enum(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null']),
        format: z.string().optional(),
        description: z.string().optional(),
        properties: z.array(
          z.object({
            name: z.string().min(1, "Property name is required"),
            type: z.enum(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null']),
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
  const [expandedContentTypes, setExpandedContentTypes] = useState<Record<number, boolean>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const getInitialValues = (): ResponseFormValues => {
    if (!initialValue) {
      return responseTemplates.success;
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
              type: "object",
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
              type: "object",
              description: "",
              properties: [
                { name: "success", type: "boolean", description: "Indicates if the operation was successful", required: true }
              ],
            }
          }]
        };
      }
    }

    return responseTemplates.success;
  };

  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: getInitialValues(),
  });

  const { fields: contentFields, append: appendContent, remove: removeContent } = useFieldArray({
    name: "content",
    control: form.control,
  });

  // Create property field arrays for content types
  const MAX_CONTENT_TYPES = 10; // Set a reasonable maximum
  const propertyFieldArrays = Array.from({ length: MAX_CONTENT_TYPES }, (_, i) => {
    // Only create real field arrays for existing content fields
    if (i < (contentFields?.length || 0)) {
      return useFieldArray({
        name: `content.${i}.schema.properties`,
        control: form.control,
      });
    }
    // Return a dummy field array for slots that don't have content yet
    return {
      fields: [],
      append: () => { },
      prepend: () => { },
      remove: () => { },
      swap: () => { },
      move: () => { },
      insert: () => { },
      update: () => { },
      replace: () => { }
    };
  });

  const toggleContentExpansion = (index: number) => {
    setExpandedContentTypes(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Handle form submission
  const handleSubmit = (values: ResponseFormValues) => {
    const response: {
      statusCode: string;
      description: string;
      schemaRef?: string;
      content?: Record<string, MediaTypeObject>;
    } = {
      statusCode: values.statusCode,
      description: values.description,
    };

    // If there's a schema reference from the first content type
    if (values.content && values.content.length > 0 && values.content[0].useSchemaRef && values.content[0].schemaRef) {
      response.schemaRef = values.content[0].schemaRef;
    } 
    // If there are content entries, process them
    else if (values.content && values.content.length > 0) {
      response.content = {};
      
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
        
        response.content[item.contentType] = mediaType;
      });
    }
    
    onUpdate(response);
  };

  return (
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

              <FormField
                control={form.control}
                name="selectedTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedTemplate(value);
                        const template = responseTemplates[value as keyof typeof responseTemplates];
                        if (template) {
                          form.reset(template);
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
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    const newIndex = contentFields ? contentFields.length : 0;
                    appendContent({
                      contentType: "application/json",
                      useSchemaRef: false,
                      schemaRef: "",
                      schema: {
                        type: "object",
                        description: "",
                        properties: [
                          { name: "success", type: "boolean", description: "Operation success status", required: true }
                        ],
                      },
                    });
                    // Expand the newly added content type
                    setExpandedContentTypes(prev => ({
                      ...prev,
                      [newIndex]: true
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content Type
                </Button>
              </div>

              {contentFields && contentFields.map((field, index) => (
                <div key={field.id} className="border rounded-md p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleContentExpansion(index)}
                  >
                    <div className="flex items-center">
                      {expandedContentTypes[index] ? (
                        <ChevronUp className="h-5 w-5 mr-2" />
                      ) : (
                        <ChevronDown className="h-5 w-5 mr-2" />
                      )}
                      <h4 className="text-md font-medium">
                        {form.watch(`content.${index}.contentType`) || `Content Type ${index + 1}`}
                      </h4>
                    </div>

                    {contentFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeContent(index);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>

                  {expandedContentTypes[index] && (
                    <div className="space-y-4 mt-4">
                      <FormField
                        control={form.control}
                        name={`content.${index}.contentType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content Type *</FormLabel>
                            <FormControl>
                              <Input placeholder="application/json" {...field} />
                            </FormControl>
                            <FormDescription>
                              e.g., application/json, application/xml
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`content.${index}.useSchemaRef`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Use Schema Reference</FormLabel>
                              <FormDescription>
                                Use a reference to an existing schema instead of defining inline
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch(`content.${index}.useSchemaRef`) ? (
                        <FormField
                          control={form.control}
                          name={`content.${index}.schemaRef`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Schema Reference</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a schema" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[50vh] overflow-y-auto">
                                  {/* Display schemas from components */}
                                  {components?.schemas && Object.keys(components.schemas).length > 0 && (
                                    <div className="p-2">
                                      <p className="text-sm font-semibold mb-1">Schemas</p>
                                      {Object.entries(components.schemas).map(([name]) => (
                                        <SelectItem key={name} value={`#/components/schemas/${name}`}>
                                          {name}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  )}

                                  {/* Display responses from components */}
                                  {components?.responses && Object.keys(components.responses).length > 0 && (
                                    <div className="p-2 border-t">
                                      <p className="text-sm font-semibold mb-1">Responses</p>
                                      {Object.entries(components.responses).map(([name]) => (
                                        <SelectItem key={`resp-${name}`} value={`#/components/responses/${name}`}>
                                          {name}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  )}

                                  {/* Show message if no schemas are available */}
                                  {(!components?.schemas || Object.keys(components?.schemas || {}).length === 0) &&
                                    (!components?.responses || Object.keys(components?.responses || {}).length === 0) && (
                                      <div className="p-2 text-center text-sm text-muted-foreground">
                                        No schemas or responses available. Create them in the Components section first.
                                      </div>
                                    )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <div className="space-y-4">
                          <h5 className="text-md font-medium">Schema</h5>

                          <FormField
                            control={form.control}
                            name={`content.${index}.schema.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type *</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {schemaTypes.map(type => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`content.${index}.schema.format`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Format</FormLabel>
                                <FormControl>
                                  <Input placeholder="Format (e.g., date-time, email)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`content.${index}.schema.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Schema Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Schema description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Show properties if schema type is object */}
                          {form.watch(`content.${index}.schema.type`) === 'object' && (
                            <div className="mt-4">
                              <h6 className="text-sm font-medium mb-2">Properties</h6>

                              {(() => {
                                // Get the property field array for this specific content index
                                const { fields: propertyFields, append: appendProperty, remove: removeProperty } =
                                  propertyFieldArrays[index];

                                return (
                                  <>
                                    {propertyFields.map((propField, propIndex) => (
                                      <div key={propField.id} className="border rounded-md p-3 mb-3 space-y-3">
                                        <div className="flex justify-between items-center">
                                          <h6 className="text-sm font-medium">Property {propIndex + 1}</h6>

                                          {propertyFields.length > 1 && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeProperty(propIndex)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>

                                        <FormField
                                          control={form.control}
                                          name={`content.${index}.schema.properties.${propIndex}.name`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Name *</FormLabel>
                                              <FormControl>
                                                <Input placeholder="Property name" {...field} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name={`content.${index}.schema.properties.${propIndex}.type`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Type *</FormLabel>
                                              <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                              >
                                                <FormControl>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                  {schemaTypes.map(type => (
                                                    <SelectItem key={type} value={type}>
                                                      {type}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name={`content.${index}.schema.properties.${propIndex}.description`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Description</FormLabel>
                                              <FormControl>
                                                <Input placeholder="Property description" {...field} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name={`content.${index}.schema.properties.${propIndex}.required`}
                                          render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                              <FormControl>
                                                <input
                                                  type="checkbox"
                                                  checked={field.value}
                                                  onChange={(e) => field.onChange(e.target.checked)}
                                                />
                                              </FormControl>
                                              <div className="space-y-1 leading-none">
                                                <FormLabel>Required</FormLabel>
                                              </div>
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    ))}

                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => appendProperty({
                                        name: "",
                                        type: "string",
                                        description: "",
                                        required: false
                                      })}
                                      className="mt-2"
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Property
                                    </Button>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </Form>
      <Button
        type="button"
        onClick={() => handleSubmit(form.getValues())}
        className="w-full"
      >
        Save Response
      </Button>
    </div>
  );
};

export default ResponseForm;