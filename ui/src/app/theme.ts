// Control UI module implements theme behavior.
export type ThemeName = "craw" | "knot" | "dash" | "custom";
export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme =
  | "dark"
  | "light"
  | "openknot"
  | "openknot-light"
  | "dash"
  | "dash-light"
  | "custom"
  | "custom-light";

const VALID_THEME_NAMES = new Set<ThemeName>(["craw", "knot", "dash", "custom"]);
const VALID_THEME_MODES = new Set<ThemeMode>(["system", "light", "dark"]);

function prefersLightScheme(): boolean {
  if (typeof globalThis.matchMedia !== "function") {
    return false;
  }
  return globalThis.matchMedia("(prefers-color-scheme: light)").matches;
}

export function parseThemeSelection(
  themeRaw: unknown,
  modeRaw: unknown,
): { theme: ThemeName; mode: ThemeMode } {
  const theme = typeof themeRaw === "string" ? themeRaw : "";
  const mode = typeof modeRaw === "string" ? modeRaw : "";

  const normalizedTheme = normalizeThemeName(theme) ?? "craw";
  const normalizedMode = VALID_THEME_MODES.has(mode as ThemeMode) ? (mode as ThemeMode) : "system";

  return { theme: normalizedTheme, mode: normalizedMode };
}

/** Resolve the removed Claw name without exposing it as a selectable theme. */
export function normalizeThemeName(themeRaw: unknown): ThemeName | undefined {
  if (themeRaw === "claw") {
    return "craw";
  }
  return VALID_THEME_NAMES.has(themeRaw as ThemeName) ? (themeRaw as ThemeName) : undefined;
}

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return prefersLightScheme() ? "light" : "dark";
  }
  return mode;
}

export function resolveTheme(theme: ThemeName, mode: ThemeMode): ResolvedTheme {
  const resolvedMode = resolveMode(mode);
  if (theme === "craw") {
    return resolvedMode === "light" ? "light" : "dark";
  }
  if (theme === "knot") {
    return resolvedMode === "light" ? "openknot-light" : "openknot";
  }
  if (theme === "dash") {
    return resolvedMode === "light" ? "dash-light" : "dash";
  }
  return resolvedMode === "light" ? "custom-light" : "custom";
}
