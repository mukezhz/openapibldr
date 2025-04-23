import React from "react";
import { useFieldArray, Control } from "react-hook-form";
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
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { ContentTypeItem } from "./ContentTypeItem";

interface ResponseItemProps {
  responseIndex: number;
  control: Control<any>;
  watch: any;
  expanded: boolean;
  toggleExpansion: (index: number) => void;
  removeResponse: (index: number) => void;
  canDelete: boolean;
  schemas: any[];
}

export const ResponseItem: React.FC<ResponseItemProps> = ({
  responseIndex,
  control,
  watch,
  expanded,
  toggleExpansion,
  removeResponse,
  canDelete,
  schemas,
}) => {
  const { fields: contentFields, append: appendContent, remove: removeContent } = useFieldArray({
    name: `responses.${responseIndex}.content`,
    control,
  });

  return (
    <div className="border rounded-md p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => toggleExpansion(responseIndex)}
      >
        <div className="flex items-center">
          {expanded ? (
            <ChevronUp className="h-5 w-5 mr-2" />
          ) : (
            <ChevronDown className="h-5 w-5 mr-2" />
          )}
          <h4 className="text-md font-medium">
            {watch(`responses.${responseIndex}.name`)}
          </h4>
        </div>
        
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              removeResponse(responseIndex);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
      
      {expanded && (
        <div className="space-y-4 mt-4">
          <FormField
            control={control}
            name={`responses.${responseIndex}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="ResponseName" {...field} />
                </FormControl>
                <FormDescription>
                  Response name, used for references
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name={`responses.${responseIndex}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Response description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Content types section */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-sm font-medium">Content Types</h5>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  appendContent({
                    contentType: "application/json",
                    schemaRef: "",
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Content Type
              </Button>
            </div>
            
            <div className="space-y-3">
              {contentFields.map((contentField, contentIndex) => (
                <ContentTypeItem
                  key={contentField.id}
                  responseIndex={responseIndex}
                  contentIndex={contentIndex}
                  control={control}
                  removeContent={() => removeContent(contentIndex)}
                  canDelete={contentFields.length > 1}
                  schemas={schemas}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};