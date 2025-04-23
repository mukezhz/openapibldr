import React from "react";
import { Control } from "react-hook-form";
import {
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
import { Trash2 } from "lucide-react";

interface ContentTypeItemProps {
  responseIndex: number;
  contentIndex: number;
  control: Control<any>;
  removeContent: () => void;
  canDelete: boolean;
  schemas: any[];
}

export const ContentTypeItem: React.FC<ContentTypeItemProps> = ({
  responseIndex,
  contentIndex,
  control,
  removeContent,
  canDelete,
  schemas,
}) => {
  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex justify-between items-center">
        <h6 className="text-sm font-medium">
          Content Type {contentIndex + 1}
        </h6>
        
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeContent}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <FormField
        control={control}
        name={`responses.${responseIndex}.content.${contentIndex}.contentType`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content Type *</FormLabel>
            <FormControl>
              <Input placeholder="application/json" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name={`responses.${responseIndex}.content.${contentIndex}.schemaRef`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Schema Reference</FormLabel>
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
                <SelectItem value="">None</SelectItem>
                {schemas.map((schema, i) => {
                  const schemaName = schema.name;
                  return (
                    <SelectItem key={i} value={`#/components/schemas/${schemaName}`}>
                      {schemaName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};