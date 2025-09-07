import z from "zod";
import type { Comment } from "../types";

const MAX_FILE_SIZE = 102400; // 100 KB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/gif", "image/png"];
const ALLOWED_TEXT_TYPES = ["text/plain"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_TEXT_TYPES];

export const formSchema = z.object({
  username: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Za-z0-9]+$/, { message: "Only Latin letters and numbers" }),
  email: z.email({ message: "Invalid email address" }),
  homepage: z
    .string()
    .refine((val) => val === "" || z.url().safeParse(val).success, {
      message: "Invalid homepage URL",
    })
    .optional(),
  text: z.string().min(1).max(1000),
  captchaValid: z.boolean().refine((val) => val === true, {
    message: "Please complete the captcha",
  }),
  captchaText: z.string(),
  file: z
    .custom<FileList>()
    .optional()
    .refine(
      (files) => {
        if (!files || files.length === 0) return true;
        const file = files[0];
        return ALLOWED_TYPES.includes(file.type);
      },
      {
        message: "Invalid file type. Only JPG, GIF, PNG, and TXT are allowed.",
      }
    )
    .refine(
      (files) => {
        if (!files || files.length === 0) return true;
        const file = files[0];
        if (ALLOWED_TEXT_TYPES.includes(file.type)) {
          return file.size <= MAX_FILE_SIZE;
        }
        return true;
      },
      {
        message: `Text file size should be less than 100 KB.`,
      }
    ),
});

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result.split(",")[1]); // remove base64 prefix
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const resizeImage = (
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;

      if (width <= maxWidth && height <= maxHeight) {
        return resolve(file);
      }

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Could not get canvas context"));
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            reject(new Error("Canvas to Blob conversion failed"));
          }
        },
        file.type,
        0.95
      );
    };
    img.onerror = (error) => reject(error);
  });
};

/**
 * Builds comment hierarchy from flat list
 * @param flatComments - Flat array of comments
 * @returns Array of top-level comments with nested replies
 */
export const buildCommentHierarchy = (flatComments: Comment[]): Comment[] => {
  const commentMap = new Map<string, Comment & { replies: Comment[] }>();
  const topLevelComments: (Comment & { replies: Comment[] })[] = [];

  // First pass: create map of all comments with empty replies array
  flatComments.forEach((comment) => {
    commentMap.set(comment.id, {
      ...comment,
      replies: [],
    });
  });

  // Second pass: build hierarchy
  flatComments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment.id)!;

    if (!comment.parentId) {
      // Top-level comment
      topLevelComments.push(commentWithReplies);
    } else {
      // Reply - add to parent's replies
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
    }
  });

  return topLevelComments;
};
