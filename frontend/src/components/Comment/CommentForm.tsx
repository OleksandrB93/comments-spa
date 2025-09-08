import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
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
import Captcha, { type CaptchaRef } from "./Capcha";
import { formSchema } from "@/utils/utils";
import {
  BoldItalicUnderlineToggles,
  CreateLink,
  MDXEditor,
  toolbarPlugin,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  InsertThematicBreak,
  UndoRedo,
} from "@mdxeditor/editor";

import "@mdxeditor/editor/style.css";

interface CommentFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  buttonText?: string;
  isLoading?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  buttonText = "Add comment",
  isLoading = false,
}) => {
  const captchaRef = useRef<CaptchaRef>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      homepage: "",
      text: "",
      captchaValid: false,
      captchaText: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    // Reset form after successful submission
    form.reset();
    // Reset captcha input
    captchaRef.current?.reset();
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
                      ref={captchaRef}
                      onValidate={(isValid, captchaText) => {
                        field.onChange(isValid);
                        form.setValue("captchaText", captchaText);
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
                  <MDXEditor
                    className="prose max-w-none border rounded-md p-2 min-h-[200px] text-white bg-gray-800"
                    markdown={field.value}
                    onChange={field.onChange}
                    plugins={[
                      headingsPlugin(),
                      listsPlugin(),
                      quotePlugin(),
                      thematicBreakPlugin(),
                      linkPlugin(),
                      linkDialogPlugin(),
                      toolbarPlugin({
                        toolbarContents: () => (
                          <div className="text-white p-1 rounded flex gap-1 flex-wrap">
                            <UndoRedo />
                            {/* <BlockTypeSelect /> */}
                            <BoldItalicUnderlineToggles />
                            {/* <ListsToggle /> */}
                            <CreateLink />
                            <InsertThematicBreak />
                          </div>
                        ),
                      }),
                    ]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Attachment (JPG, GIF, PNG, TXT)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.gif,.png,.txt"
                    onChange={(e) => field.onChange(e.target.files)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end mt-3 cursor-pointer">
            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting ||
                isLoading ||
                !form.formState.isValid ||
                !form.watch("captchaValid")
              }
            >
              {form.formState.isSubmitting || isLoading
                ? "Sending..."
                : buttonText}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CommentForm;
