import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { schemaTypes } from "@/lib/utils/defaults";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

// Add localStorage constants for schemas
const LOCAL_STORAGE_COMPONENTS_KEY = "openapibldr_components";

// Function to load components (including schemas) from localStorage
const loadComponentsFromLocalStorage = () => {
  try {
    const savedComponents = localStorage.getItem(LOCAL_STORAGE_COMPONENTS_KEY);
    if (savedComponents) {
      return JSON.parse(savedComponents);
    }
  } catch (error) {
    console.error("Error loading components from localStorage:", error);
  }
  return null;
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
  ),
});

type RequestBodyFormValues = z.infer<typeof requestBodySchema>;

interface RequestBodyFormProps {
  initialValue?: RequestBodyObject;
  onUpdate: (requestBody: RequestBodyObject) => void;
  components?: ComponentsObject; // Add components as a prop
}

const RequestBodyForm: React.FC<RequestBodyFormProps> = ({ initialValue, onUpdate, components }) => {
  const [expandedContentTypes, setExpandedContentTypes] = useState<Record<number, boolean>>({});
  
  const [localStorageComponents, setLocalStorageComponents] = useState<ComponentsObject | null>(null);
  useEffect(() => {
    setLocalStorageComponents(loadComponentsFromLocalStorage());
  }, []);
  
  const getInitialValues = (): RequestBodyFormValues => {
    if (!initialValue) {
      return {
        description: "",
        required: false,
        content: [
          {
            contentType: "application/json",
            useSchemaRef: false,
            schemaRef: "",
            schema: {
              type: "object",
              description: "",
              properties: [
                { name: "id", type: "string", description: "Unique identifier", required: true }
              ],
            },
          },
        ],
      };
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
          properties: properties.length > 0 ? properties : [{ name: "example", type: "string", description: "", required: false }],
        },
      };
    });
    
    return {
      description: initialValue.description || "",
      required: initialValue.required || false,
      content: contentArray.length > 0 ? contentArray : getInitialValues().content,
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
  
  // Create property field arrays for all content types at once
  // This ensures hooks are called in the same order every render
  const propertyFieldArrays = contentFields.map((_, index) => 
    useFieldArray({
      name: `content.${index}.schema.properties`,
      control: form.control,
    })
  );
  
  const toggleContentExpansion = (index: number) => {
    setExpandedContentTypes(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  
  const handleSubmit = (values: RequestBodyFormValues) => {
    // Convert form values to RequestBodyObject
    const requestBody: RequestBodyObject = {
      description: values.description || undefined,
      required: values.required,
      content: {},
    };
    
    // Add content media types
    values.content.forEach(item => {
      // If using a schema reference
      if (item.useSchemaRef && item.schemaRef) {
        requestBody.content[item.contentType] = {
          schema: {
            $ref: item.schemaRef
          }
        };
      } else {
        // Otherwise use inline schema
        const mediaType: MediaTypeObject = {
          schema: {
            type: item.schema.type,
            format: item.schema.format || undefined,
            description: item.schema.description || undefined,
          } as SchemaObject,
        };
        
        // Add properties to schema if type is object
        if (item.schema.type === "object" && item.schema.properties) {
          const properties: Record<string, SchemaObject> = {};
          const required: string[] = [];
          
          item.schema.properties.forEach(prop => {
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
    
    onUpdate(requestBody);
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        {/* Remove the onChange handler from the form element to prevent auto-submission */}
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
                      onChange={(e) => {
                        field.onChange(e);
                        // Manual form submission after a delay to avoid race conditions
                        setTimeout(() => {
                          const values = form.getValues();
                          handleSubmit(values);
                        }, 100);
                      }}
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
                        // Manual form submission after a delay
                        setTimeout(() => {
                          const values = form.getValues();
                          handleSubmit(values);
                        }, 100);
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
              <h3 className="text-lg font-medium">Content Types</h3>
              
              {contentFields.map((field, index) => (
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
                              e.g., application/json, application/xml, multipart/form-data
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
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
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
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // Manual form submission after change
                                  setTimeout(() => {
                                    const values = form.getValues();
                                    handleSubmit(values);
                                  }, 100);
                                }}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a schema" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[50vh] overflow-y-auto">
                                  {/* Display option group for current components schemas */}
                                  {components?.schemas && Object.keys(components.schemas).length > 0 && (
                                    <div className="p-2">
                                      <p className="text-sm font-semibold mb-1">Current Schemas</p>
                                      {Object.entries(components.schemas).map(([name]) => (
                                        <SelectItem key={name} value={`#/components/schemas/${name}`}>
                                          {name}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Display option group for localStorage schemas */}
                                  {localStorageComponents?.schemas && Object.keys(localStorageComponents.schemas).length > 0 && (
                                    <div className="p-2 border-t">
                                      <p className="text-sm font-semibold mb-1">Saved Schemas</p>
                                      {Object.entries(localStorageComponents.schemas)
                                        .filter(([name]) => !components?.schemas || !components.schemas[name])
                                        .map(([name]) => (
                                          <SelectItem key={`local-${name}`} value={`#/components/schemas/${name}`}>
                                            {name} (saved)
                                          </SelectItem>
                                        ))}
                                    </div>
                                  )}
                                  
                                  {/* Show message if no schemas are available */}
                                  {(!components?.schemas || Object.keys(components?.schemas || {}).length === 0) &&
                                   (!localStorageComponents?.schemas || Object.keys(localStorageComponents?.schemas || {}).length === 0) && (
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                      No schemas available. Create schemas in the Components section first.
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
                                                <Checkbox
                                                  checked={field.value}
                                                  onCheckedChange={field.onChange}
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
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newIndex = contentFields.length;
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
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RequestBodyForm;