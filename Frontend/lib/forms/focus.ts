import type { FieldErrors } from "./errors.ts";

export function focusInvalidField(form: HTMLFormElement | null, fields: FieldErrors) {
  if (!form) return;
  const paths = Object.keys(fields);
  for (const element of form.querySelectorAll<HTMLElement>("[data-field]")) {
    const field = element.dataset.field ?? "";
    if (paths.some((path) => path === field || path.startsWith(`${field}.`) || field.startsWith(`${path}.`))) {
      element.focus();
      return;
    }
  }
}
