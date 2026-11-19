import { HelperText } from "flowbite-react";

export default function FieldFeedback({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string;
  hint?: string;
}) {
  return (
    <HelperText id={id} color={error ? "failure" : "default"}>
      {error ?? hint ?? ""}
    </HelperText>
  );
}
