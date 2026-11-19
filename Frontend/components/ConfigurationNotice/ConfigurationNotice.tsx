import { Alert } from "flowbite-react";
import {
  CONFIGURATION_COPY,
  type ConfigurationKind,
} from "@/lib/display/feedback.ts";

export interface ConfigurationNoticeProps {
  kind: ConfigurationKind;
}

export default function ConfigurationNotice({ kind }: ConfigurationNoticeProps) {
  const copy = CONFIGURATION_COPY[kind];

  return (
    <Alert
      color={kind === "preview" ? "info" : "warning"}
      role="region"
      aria-label={copy.title}
      withBorderAccent
    >
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        <p className="max-w-3xl text-sm leading-6">{copy.description}</p>
        <p className="max-w-3xl text-sm leading-6">{copy.nextStep}</p>
      </div>
    </Alert>
  );
}
