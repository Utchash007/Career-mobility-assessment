import { z } from "zod";
import {
  COUNTRY_ALIASES,
  COUNTRY_CODES,
  LANGUAGE_ALIASES,
  LANGUAGE_CODES,
  SKILL_ALIASES,
} from "../contracts/codes.ts";

const countries = new Set(COUNTRY_CODES);
const languages = new Set(LANGUAGE_CODES);

function aliasOrKey(aliases: Readonly<Record<string, string>>, key: string) {
  return Object.hasOwn(aliases, key) ? aliases[key] : key;
}

export const storedKeySchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]{0,59}$(?![\s\S])/,
    "Use a canonical key of 1–60 characters.",
  );

export const canonicalKeySchema = z
  .string()
  .transform((value) =>
    value
      .normalize("NFKC")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_"),
  )
  .pipe(storedKeySchema);

export const skillKeySchema = canonicalKeySchema.transform((key) =>
  aliasOrKey(SKILL_ALIASES, key),
);

export const exactCountryCodeSchema = z
  .string()
  .refine(
    (value) => countries.has(value),
    "Use an uppercase ISO country code.",
  );

export const countryCodeSchema = z
  .string()
  .transform((value) => {
    const key = value.trim().toLowerCase().replaceAll(" ", "_");
    return Object.hasOwn(COUNTRY_ALIASES, key)
      ? COUNTRY_ALIASES[key]
      : value.trim().toUpperCase();
  })
  .pipe(exactCountryCodeSchema);

export const exactLanguageCodeSchema = z
  .string()
  .refine(
    (value) => languages.has(value),
    "Use a lowercase ISO language code.",
  );

export const languageCodeSchema = z
  .string()
  .transform((value) =>
    aliasOrKey(LANGUAGE_ALIASES, value.trim().toLowerCase()),
  )
  .pipe(exactLanguageCodeSchema);

// Backend normalization deduplicates first, then applies collection limits.
export function uniqueArraySchema<T extends z.ZodType<string>>(
  itemSchema: T,
  maxLength?: number,
) {
  return z
    .array(itemSchema)
    .transform((items) => [...new Set(items)])
    .refine(
      (items) => maxLength === undefined || items.length <= maxLength,
      `Use no more than ${maxLength ?? "the allowed number of"} unique entries.`,
    );
}

export function splitKeyInput(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
