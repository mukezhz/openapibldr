import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InfoObject } from "@/lib/types";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Validation schema for API info
const infoSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  version: z.string().min(1, { message: "Version is required" }),
  description: z.string().optional(),
  termsOfService: z.string().url().optional().or(z.string().length(0)),
  contact: z.object({
    name: z.string().optional(),
    url: z.string().url().optional().or(z.string().length(0)),
    email: z.string().email().optional().or(z.string().length(0)),
  }).optional(),
  license: z.object({
    name: z.string().optional(),
    url: z.string().url().optional().or(z.string().length(0)),
  }).optional(),
});

interface InfoFormProps {
  initialValues: InfoObject;
  onUpdate: (values: InfoObject) => void;
}

const InfoForm: React.FC<InfoFormProps> = ({ initialValues, onUpdate }) => {
  const form = useForm<z.infer<typeof infoSchema>>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      title: initialValues.title || "",
      version: initialValues.version || "1.0.0",
      description: initialValues.description || "",
      termsOfService: initialValues.termsOfService || "",
      contact: {
        name: initialValues.contact?.name || "",
        url: initialValues.contact?.url || "",
        email: initialValues.contact?.email || "",
      },
      license: {
        name: initialValues.license?.name || "",
        url: initialValues.license?.url || "",
      },
    },
  });

  const handleSubmit = (values: z.infer<typeof infoSchema>) => {
    // Clean up empty strings for optional fields
    const cleanValues = {
      ...values,
      termsOfService: values.termsOfService || undefined,
      contact: values.contact ? {
        name: values.contact.name || undefined,
        url: values.contact.url || undefined,
        email: values.contact.email || undefined,
      } : undefined,
      license: values.license ? {
        name: values.license.name || undefined,
        url: values.license.url || undefined,
      } : undefined,
    };
    
    // Remove contact or license objects if they have no properties
    const hasContactValues = cleanValues.contact && 
      Object.values(cleanValues.contact).some(val => val !== undefined);
    
    const hasLicenseValues = cleanValues.license && 
      Object.values(cleanValues.license).some(val => val !== undefined);
    
    const finalValues = {
      ...cleanValues,
      contact: hasContactValues ? cleanValues.contact : undefined,
      license: hasLicenseValues ? cleanValues.license : undefined,
    };
    
    onUpdate(finalValues as InfoObject);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onChange={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="API Title" {...field} />
                  </FormControl>
                  <FormDescription>
                    The title of your API
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version *</FormLabel>
                  <FormControl>
                    <Input placeholder="1.0.0" {...field} />
                  </FormControl>
                  <FormDescription>
                    The version of your API
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your API"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A detailed description of your API
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="termsOfService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms of Service URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/terms" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL to the terms of service
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              
              <FormField
                control={form.control}
                name="contact.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="API Support Team" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contact.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="support@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contact.url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/support" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">License Information</h3>
              
              <FormField
                control={form.control}
                name="license.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Name</FormLabel>
                    <FormControl>
                      <Input placeholder="MIT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="license.url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://opensource.org/licenses/MIT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InfoForm;