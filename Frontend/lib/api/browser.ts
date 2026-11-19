export function browserApiBase(): string | undefined {
  if (process.env.NEXT_PUBLIC_API_SAME_ORIGIN === "true") {
    return typeof window === "undefined" ? undefined : window.location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL;
}
