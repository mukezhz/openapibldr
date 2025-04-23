import React, { useState } from "react";
import { useFormContext, useFieldArray, Control } from "react-hook-form"; // Removed unused Controller
import { ComponentsObject } from "@/lib/types"; // Removed unused SchemaObject
import {
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

interface MediaTypeFormProps {
  control: Control<any>; // Use Control<any> for flexibility or define a specific type
  index: number;
  remove: (index: number) => void;
  components?: ComponentsObject;
  localStorageComponents?: ComponentsObject | null; // Specific to RequestBodyForm
  fieldId: string; // Pass the field ID for key prop
  totalFields: number; // Pass total number of fields for conditional rendering
  formType: 'request' | 'response'; // Differentiate between request and response forms
}

const MediaTypeForm: React.FC<MediaTypeFormProps> = ({
  control,
  index,
  remove,
  components,
  localStorageComponents,
  fieldId,
  totalFields,
  formType
}) => {
  const { watch } = useFormContext(); // Use Form Context to watch values
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded

  // Property field array setup - needs to be stable
  const { fields: propertyFields, append: appendProperty, remove: removeProperty } = useFieldArray({
    name: `content.${index}.schema.properties`,
    control: control,
  });

  const toggleExpansion = () => setIsExpanded(!isExpanded);

  const contentTypeValue = watch(`content.${index}.contentType`);
  const useSchemaRefValue = watch(`content.${index}.useSchemaRef`);
  const schemaTypeValue = watch(`content.${index}.schema.type`);

  return (
    <div key={fieldId} className="border rounded-md p-4 mb-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleExpansion}
      >
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 mr-2" />
          ) : (
            <ChevronDown className="h-5 w-5 mr-2" />
          )}
          <h4 className="text-md font-medium">
            {contentTypeValue || `Content Type ${index + 1}`}
          </h4>
        </div>

        {totalFields > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent toggling expansion when removing
              remove(index);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4 mt-4">
          <FormField
            control={control}
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
            control={control}
            name={`content.${index}.useSchemaRef`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  {/* Use standard checkbox for ResponseForm compatibility */}
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

          {useSchemaRefValue ? (
            <FormField
              control={control}
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
                        <SelectValue placeholder="Select a schema or response" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[50vh] overflow-y-auto">
                      {/* Display option group for current components schemas */}
                      {components?.schemas && Object.keys(components.schemas).length > 0 && (
                        <div className="p-2">
                          <p className="text-sm font-semibold mb-1">Current Schemas</p>
                          {Object.entries(components.schemas).map(([name]) => (
                            <SelectItem key={`comp-schema-${name}`} value={`#/components/schemas/${name}`}>
                              {name}
                            </SelectItem>
                          ))}
                        </div>
                      )}

                      {/* Display option group for localStorage schemas (only for request body) */}
                      {localStorageComponents?.schemas && Object.keys(localStorageComponents.schemas).length > 0 && (
                        <div className="p-2 border-t">
                          <p className="text-sm font-semibold mb-1">Saved Schemas</p>
                          {Object.entries(localStorageComponents.schemas)
                            .filter(([name]) => !components?.schemas || !components.schemas[name]) // Avoid duplicates
                            .map(([name]) => (
                              <SelectItem key={`local-schema-${name}`} value={`#/components/schemas/${name}`}>
                                {name} (saved)
                              </SelectItem>
                            ))}
                        </div>
                      )}

                      {/* Display option group for current components responses (only for response body) */}
                       {formType === 'response' && components?.responses && Object.keys(components.responses).length > 0 && (
                        <div className="p-2 border-t">
                          <p className="text-sm font-semibold mb-1">Current Responses</p>
                          {Object.entries(components.responses).map(([name]) => (
                            <SelectItem key={`comp-resp-${name}`} value={`#/components/responses/${name}`}>
                              {name}
                            </SelectItem>
                          ))}
                        </div>
                      )}

                      {/* Show message if no schemas/responses are available */}
                      {/* Corrected conditional logic */}
                      {(!components?.schemas || Object.keys(components.schemas).length === 0) &&
                       (formType === 'request' ? (!localStorageComponents?.schemas || Object.keys(localStorageComponents.schemas).length === 0) : true) && // Check local storage only for request
                       (formType === 'response' ? (!components?.responses || Object.keys(components.responses).length === 0) : true) && // Check responses only for response
                       (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No schemas {formType === 'response' ? 'or responses ' : ''}available. Create them in the Components section first.
                          </div>
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="space-y-4 border rounded-md p-3">
              <h5 className="text-md font-medium">Inline Schema</h5>

              <FormField
                control={control}
                name={`content.${index}.schema.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "object"} // Default to object if undefined
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
                control={control}
                name={`content.${index}.schema.format`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <FormControl>
                      <Input placeholder="Format (e.g., date-time, email)" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`content.${index}.schema.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schema Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Schema description" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Show properties if schema type is object */}
              {schemaTypeValue === 'object' && (
                <div className="mt-4">
                  <h6 className="text-sm font-medium mb-2">Properties</h6>
                  {propertyFields.map((propField, propIndex) => (
                    <div key={propField.id} className="border rounded-md p-3 mb-3 space-y-3 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <h6 className="text-sm font-medium">Property {propIndex + 1}</h6>
                        {propertyFields.length > 1 && (
                           <Button
                              type="button"
                              variant="ghost"
                              size="sm" // Changed from icon-sm to sm
                              onClick={() => removeProperty(propIndex)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                        )}
                      </div>

                      <FormField
                        control={control}
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
                        control={control}
                        name={`content.${index}.schema.properties.${propIndex}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "string"} // Default to string
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
                        control={control}
                        name={`content.${index}.schema.properties.${propIndex}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Property description" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`content.${index}.schema.properties.${propIndex}.required`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
                             <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            <FormLabel>Required</FormLabel>
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
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaTypeForm;
