import React from "react";
import { useFieldArray } from "react-hook-form";
import { Control } from "react-hook-form";
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
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { schemaTypes, stringFormats, numberFormats, integerFormats } from "@/lib/utils/defaults";
import { SchemaPropertyItem } from "./SchemaPropertyItem";

interface SchemaItemProps {
  schemaIndex: number;
  control: Control<any>;
  watch: any;
  expanded: boolean;
  toggleExpansion: (index: number) => void;
  removeSchema: (index: number) => void;
  canDelete: boolean;
}

export const SchemaItem: React.FC<SchemaItemProps> = ({
  schemaIndex,
  control,
  watch,
  expanded,
  toggleExpansion,
  removeSchema,
  canDelete,
}) => {
  const { fields: propertyFields, append: appendProperty, remove: removeProperty } = useFieldArray({
    name: `schemas.${schemaIndex}.properties`,
    control,
  });

  return (
    <div className="border rounded-md p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => toggleExpansion(schemaIndex)}
      >
        <div className="flex items-center">
          {expanded ? (
            <ChevronUp className="h-5 w-5 mr-2" />
          ) : (
            <ChevronDown className="h-5 w-5 mr-2" />
          )}
          <h4 className="text-md font-medium">
            {watch(`schemas.${schemaIndex}.name`)} ({watch(`schemas.${schemaIndex}.type`)})
          </h4>
        </div>
        
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              removeSchema(schemaIndex);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
      
      {expanded && (
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name={`schemas.${schemaIndex}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="SchemaName" {...field} />
                  </FormControl>
                  <FormDescription>
                    Schema name, used for references
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name={`schemas.${schemaIndex}.type`}
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
          </div>
          
          <FormField
            control={control}
            name={`schemas.${schemaIndex}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Schema description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {watch(`schemas.${schemaIndex}.type`) !== 'object' && (
            <FormField
              control={control}
              name={`schemas.${schemaIndex}.format`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Format</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {(() => {
                        const type = watch(`schemas.${schemaIndex}.type`);
                        if (type === 'string') {
                          return stringFormats.map(format => (
                            <SelectItem key={format} value={format}>
                              {format}
                            </SelectItem>
                          ));
                        } else if (type === 'number') {
                          return numberFormats.map(format => (
                            <SelectItem key={format} value={format}>
                              {format}
                            </SelectItem>
                          ));
                        } else if (type === 'integer') {
                          return integerFormats.map(format => (
                            <SelectItem key={format} value={format}>
                              {format}
                            </SelectItem>
                          ));
                        }
                        return null;
                      })()}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* Properties section for object type */}
          {watch(`schemas.${schemaIndex}.type`) === 'object' && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-sm font-medium">Properties</h5>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    appendProperty({
                      name: "",
                      type: "string",
                      description: "",
                      format: "",
                      required: false,
                      isReference: false,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Property
                </Button>
              </div>
              
              <div className="space-y-3">
                {propertyFields.map((propertyField, propertyIndex) => (
                  <SchemaPropertyItem
                    key={propertyField.id}
                    schemaIndex={schemaIndex}
                    propertyIndex={propertyIndex}
                    control={control}
                    watch={watch}
                    removeProperty={() => removeProperty(propertyIndex)}
                    allSchemas={watch('schemas')}
                    currentSchemaIndex={schemaIndex}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};