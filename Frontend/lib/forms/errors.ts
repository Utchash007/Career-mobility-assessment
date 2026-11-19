import type { ZodError } from "zod";

export type FieldErrors = Record<string, string>;

export function fieldError(
  fields: FieldErrors,
  path: string,
): string | undefined {
  return (
    fields[path] ??
    Object.entries(fields).find(([key]) => key.startsWith(`${path}.`))?.[1]
  );
}

// Same dotted field paths as FastAPI, without logging or returning failed inputs.
export function validationFieldErrors(error: ZodError): FieldErrors {
  const fields: FieldErrors = Object.create(null);
  for (const issue of error.issues) {
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) {
        const path = [...issue.path, key].map(String).join(".");
        fields[path] ??= "This field is not supported.";
      }
    } else {
      const path = issue.path.map(String).join(".") || "body";
      fields[path] ??= issue.message;
    }
  }
  return fields;
}
