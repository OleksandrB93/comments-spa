import React from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { formSchema } from "@/components/Post/PostWithComments";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Captcha from "./Capcha";
import { Textarea } from "../ui/textarea";

interface CommentFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  placeholder?: string;
  buttonText?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  placeholder = "Write your comment...",
  buttonText = "Add comment",
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      homepage: "",
      text: "",
      captchaValid: false,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    // Reset form after successful submission
    form.reset();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="homepage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Homepage</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="captchaValid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Captcha</FormLabel>
                    <Captcha
                      onValidate={(isValid) => {
                        field.onChange(isValid);
                        if (!isValid) {
                          form.setError("captchaValid", {
                            message: "Please complete the captcha correctly",
                          });
                        } else {
                          form.clearErrors("captchaValid");
                        }
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Text</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={placeholder}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end mt-3">
            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting ||
                !form.formState.isValid ||
                !form.watch("captchaValid")
              }
            >
              {form.formState.isSubmitting ? "Sending..." : buttonText}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CommentForm;
