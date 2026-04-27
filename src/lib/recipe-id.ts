import { createHash } from "crypto";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildDeterministicRecipeId(title: string, diet?: string): string {
  const safeTitle = title?.trim() || "recipe";
  const base = slugify(safeTitle).slice(0, 48) || "recipe";
  const hashInput = `${safeTitle.toLowerCase()}|${(diet || "all").toLowerCase()}`;
  const hash = createHash("sha256").update(hashInput).digest("hex").slice(0, 12);
  return `${base}-${hash}`;
}

