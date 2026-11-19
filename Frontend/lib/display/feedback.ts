export const ERROR_COPY = {
  unavailable: {
    title: "The service is unavailable",
    description: "Your data has not been replaced with an empty result. Try again later.",
  },
  network: {
    title: "We could not reach the service",
    description: "Check your connection, then try again. A failed request is not a confirmed save.",
  },
  invalid_request: {
    title: "This request could not be completed",
    description: "Review your inputs and try again. No successful change has been confirmed.",
  },
  session_expired: {
    title: "Your session needs attention",
    description: "Sign in again before continuing. Private information is not shown here.",
  },
  not_found: {
    title: "This item is no longer available",
    description: "Return to the collection and choose another item.",
  },
  unexpected: {
    title: "Something went wrong",
    description: "We could not complete this action. Try again later; no successful change has been confirmed.",
  },
} as const;

export type ErrorReason = keyof typeof ERROR_COPY;

export const CONFIGURATION_COPY = {
  preview: {
    title: "Interface preview",
    description: "This phase provides the application shell and reusable UI. Authentication and backend access are not connected yet, so private workflows remain unavailable.",
    nextStep: "Next: configure Clerk and connect the authenticated API. This screen does not use an account or application data.",
  },
  authentication: {
    title: "Authentication setup is required",
    description: "Sign-in and private workflows are unavailable until Clerk is configured. There is no mock-user fallback.",
    nextStep: "Set Clerk's public configuration and server-only secret in a local environment file, then restart the frontend. Keep all values private.",
  },
  api: {
    title: "API setup is required",
    description: "Application data cannot be loaded until the backend connection is configured.",
    nextStep: "Configure the frontend API base URL and matching allowed origins on the backend, then restart the applications. See Frontend/README.md for setup guidance.",
  },
} as const;

export type ConfigurationKind = keyof typeof CONFIGURATION_COPY;
