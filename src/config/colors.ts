// Reno — warm earth-tone palette
// Brand colors come from the user's theme; neutrals and status colors are
// derived to fit the same warm tonality so Ant Design components stay coherent.
export const colorPalette = {
  // Brand colors (user-supplied)
  warmTan: "rgb(212, 187, 167)",      // #d4bba7 — soft warm tan, light surfaces
  taupe: "rgb(166, 145, 131)",        // #a69183 — muted taupe, secondary text/borders
  warmBlack: "rgb(45, 41, 42)",       // #2d292a — primary text, near-black with warmth
  darkBrown: "rgb(101, 65, 40)",      // #654128 — deep brand accent / hover
  caramel: "rgb(156, 111, 74)",       // #9c6f4a — primary brand accent

  // Neutrals (derived to fit the warm palette)
  white: "rgb(255, 255, 255)",
  offWhite: "rgb(250, 247, 243)",     // very light cream — body bg secondary
  lightGray: "rgb(245, 240, 234)",    // very light tan-gray — subtle dividers
  mediumGray: "rgb(166, 145, 131)",   // alias of taupe — for AntD borderSecondary

  // Functional status colors (warm-tinted to match the palette)
  red: "rgb(199, 89, 80)",
  darkRed: "rgb(160, 60, 55)",
  amber: "rgb(217, 154, 78)",
  green: "rgb(106, 142, 110)",
  darkGreen: "rgb(80, 110, 84)",
  mutedBlue: "rgb(122, 145, 168)",
} as const;

// Semantic color configuration — components must consume these, not the raw palette.
export const colorConfig = {
  // Primary (Reno caramel → dark brown on hover)
  primaryColor: colorPalette.caramel,
  primaryForegroundColor: colorPalette.white,
  primaryHoverColor: colorPalette.darkBrown,

  // Secondary
  secondaryColor: colorPalette.warmTan,
  secondaryForegroundColor: colorPalette.warmBlack,

  // Background
  backgroundColor: colorPalette.white,
  foregroundColor: colorPalette.warmBlack,
  backgroundSecondary: colorPalette.offWhite,

  // Danger / Error
  dangerColor: colorPalette.red,
  dangerForegroundColor: colorPalette.white,
  dangerHoverColor: colorPalette.darkRed,

  // Warning
  warningColor: colorPalette.amber,
  warningForegroundColor: colorPalette.white,

  // Success
  successColor: colorPalette.green,
  successForegroundColor: colorPalette.white,
  successHoverColor: colorPalette.darkGreen,

  // Info
  infoColor: colorPalette.mutedBlue,
  infoForegroundColor: colorPalette.white,

  // Borders
  borderColor: colorPalette.warmTan,
  borderColorHover: colorPalette.taupe,

  // Text
  textPrimary: colorPalette.warmBlack,
  textSecondary: colorPalette.taupe,
  textMuted: colorPalette.taupe,

  // Reno brand accent (for highlights, brand wordmark, etc.)
  brandAccent: colorPalette.darkBrown,
} as const;
