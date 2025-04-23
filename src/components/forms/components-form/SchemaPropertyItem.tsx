import React from "react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { schemaTypes, stringFormats, numberFormats, integerFormats } from "@/lib/utils/defaults";

interface SchemaPropertyItemProps {
  schemaIndex: number;
  propertyIndex: number;
  control: Control<any>;
  watch: any;
  removeProperty: () => void;
  allSchemas: any[];
  currentSchemaIndex: number;
}

export const SchemaPropertyItem: React.FC<SchemaPropertyItemProps> = ({
  schemaIndex,
  propertyIndex,
  control,
  watch,
  removeProperty,
  allSchemas,
  currentSchemaIndex,
}) => {
  const isReference = watch(`schemas.${schemaIndex}.properties.${propertyIndex}.isReference`);
  const type = watch(`schemas.${schemaIndex}.properties.${propertyIndex}.type`);
  
  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex justify-between items-center">
        <h6 className="text-sm font-medium">
          {watch(`schemas.${schemaIndex}.properties.${propertyIndex}.name`) || `Property ${propertyIndex + 1}`}
        </h6>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={removeProperty}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={control}
          name={`schemas.${schemaIndex}.properties.${propertyIndex}.name`}
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
          name={`schemas.${schemaIndex}.properties.${propertyIndex}.isReference`}
          render={({ field }) => (
            <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Reference another schema</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>

      {!isReference ? (
        <>
          <FormField
            control={control}
            name={`schemas.${schemaIndex}.properties.${propertyIndex}.type`}
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
            control={control}
            name={`schemas.${schemaIndex}.properties.${propertyIndex}.format`}
            render={({ field }) => {
              let formats: string[] = [];
            
              if (type === 'string') formats = stringFormats;
              else if (type === 'number') formats = numberFormats;
              else if (type === 'integer') formats = integerFormats;
              
              if (formats.length === 0) return null;
              
              return (
                <FormItem>
                  <FormLabel>Format</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {formats.map(format => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              );
            }}
          />
        </>
      ) : (
        <FormField
          control={control}
          name={`schemas.${schemaIndex}.properties.${propertyIndex}.reference`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schema Reference *</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schema" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allSchemas.map((schema, i) => {
                    // Don't allow self-reference
                    if (i === currentSchemaIndex) return null;
                    const schemaName = watch(`schemas.${i}.name`);
                    return (
                      <SelectItem key={i} value={`#/components/schemas/${schemaName}`}>
                        {schemaName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormDescription>
                Reference to another schema
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      <FormField
        control={control}
        name={`schemas.${schemaIndex}.properties.${propertyIndex}.description`}
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
        control={control}
        name={`schemas.${schemaIndex}.properties.${propertyIndex}.required`}
        render={({ field }) => (
          <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
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
  );
};