import type { ThemeProviderProps } from "flowbite-react";

// Static Tailwind classes are scanned from this file. No runtime color interpolation.
// AppProviders replaces overridden theme leaves, retaining Flowbite's other defaults.
export const APP_THEME = {
  button: {
    color: {
      default:
        "bg-action text-canvas hover:bg-action-hover focus:ring-action/30",
      alternative:
        "border border-action bg-canvas text-action hover:bg-soft-accent/30 focus:ring-action/30",
      failure:
        "bg-critical text-canvas hover:bg-critical/90 focus:ring-critical/30",
    },
  },
  alert: {
    color: {
      info: "border-action/30 bg-soft-accent/25 text-ink",
      failure: "border-critical/30 bg-canvas text-critical",
      warning: "border-verification/30 bg-canvas text-verification",
      success: "border-success/30 bg-canvas text-success",
    },
  },
  card: {
    root: {
      base: "flex rounded-2xl border border-accent/25 bg-canvas shadow-sm",
      children: "flex h-full flex-col justify-start gap-4 p-6",
    },
  },
  spinner: {
    color: { default: "fill-action" },
  },
  navbar: {
    root: {
      base: "border-b border-accent/25 bg-canvas px-4 py-4 sm:px-6",
      inner: {
        base: "mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4",
        fluid: { on: "", off: "" },
      },
    },
    brand: { base: "flex items-center gap-3 rounded-sm" },
    collapse: {
      base: "w-full lg:block lg:w-auto",
      list: "mt-2 flex flex-col gap-1 lg:mt-0 lg:flex-row lg:items-center lg:gap-1 lg:text-sm lg:font-medium",
    },
    link: {
      base: "block rounded-lg px-3 py-2",
      active: {
        on: "bg-soft-accent/40 font-semibold text-ink",
        off: "text-action hover:bg-soft-accent/25 hover:text-action-hover",
      },
    },
    toggle: {
      base: "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-action hover:bg-soft-accent/25 focus:ring-2 focus:ring-action/30 lg:hidden",
    },
  },
  modal: {
    root: {
      base: "fixed inset-0 z-50 h-dvh overflow-y-auto overflow-x-hidden",
      show: { on: "flex bg-ink/50", off: "hidden" },
    },
    content: {
      base: "relative w-full p-4",
      inner:
        "relative flex max-h-[90dvh] flex-col rounded-2xl border border-accent/25 bg-canvas text-ink shadow-xl",
    },
    header: {
      base: "flex items-start justify-between rounded-t-2xl border-b border-accent/25 p-6",
      title: "text-xl font-semibold text-ink",
      close: {
        base: "ms-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-transparent p-2 text-action hover:bg-soft-accent/25",
      },
    },
    footer: {
      base: "flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-accent/25 p-6",
    },
  },
} satisfies NonNullable<ThemeProviderProps["theme"]>;
