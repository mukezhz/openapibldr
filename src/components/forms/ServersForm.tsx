import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ServerObject } from "@/lib/types";
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
import { Plus, Trash2 } from "lucide-react";

// Validation schema for server objects
const serverSchema = z.object({
  servers: z.array(
    z.object({
      url: z.string().url({ message: "Must be a valid URL" }).or(z.string().regex(/^https?:\/\/\{[a-zA-Z0-9_-]+\}/, { message: "Must be a valid URL or template URL" })),
      description: z.string().optional(),
    })
  ),
});

type ServerFormValues = z.infer<typeof serverSchema>;

interface ServersFormProps {
  initialValues: ServerObject[];
  onUpdate: (values: ServerObject[]) => void;
}

const ServersForm: React.FC<ServersFormProps> = ({ initialValues, onUpdate }) => {
  const form = useForm<ServerFormValues>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      servers: initialValues.length > 0
        ? initialValues
        : [{ url: "https://api.example.com", description: "Production server" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "servers",
    control: form.control,
  });

  const handleSubmit = (values: ServerFormValues) => {
    // Clean up empty descriptions
    const cleanServers = values.servers.map(server => ({
      ...server,
      description: server.description || undefined,
    }));
    
    onUpdate(cleanServers);
  };

  // Submit the form whenever it changes
  React.useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      form.handleSubmit(handleSubmit)();
    }, 300); // Debounce for 300ms to prevent rapid re-renders

    return () => clearTimeout(debounceTimeout);
  }, [form.watch()]);

  // Add a new server form at the end and auto-scroll to it
  const addNewServer = () => {
    // Add a new server to the list
    append({ url: "https://", description: "" });
    
    // Scroll to the new form with a small delay to allow rendering
    setTimeout(() => {
      const newServerElement = document.getElementById(`server-form-${fields.length}`);
      if (newServerElement) {
        newServerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Servers</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div id={`server-form-${index}`} key={field.id} className="p-4 border rounded-md bg-muted/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium">Server {index + 1}</h3>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`servers.${index}.url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL *</FormLabel>
                      <FormControl>
                        <Input placeholder="https://api.example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        The URL of the server (e.g. https://api.example.com or https://{'{host}'})
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`servers.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Server description"
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => {
                            // Update the field and trigger form submission for immediate YAML update
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        A description of the server's purpose
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addNewServer}
              className="mt-4 w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ServersForm;