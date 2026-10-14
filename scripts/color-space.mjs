// Adapted from bloxwap/monorepo d47cef4c40363184bdfda8d8c263ead108ef9ff6, packages/tokens/src/oklch.ts (same-owner adaptation; source repository has no root LICENSE).
function parseOklch(input) {
  const m = /^oklch\(\s*([^)]+)\)$/i.exec(input.trim());
  if (!m) throw new Error(`not an oklch() string: ${input}`);
  const [coords, alphaPart] = m[1].split("/").map((s) => s.trim());
  const parts = coords.split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`malformed oklch coordinates: ${input}`);
  }
  const [L, C, H] = parts;
  let alpha = 1;
  if (alphaPart != null && alphaPart !== "") {
    alpha = alphaPart.endsWith("%") ? Number(alphaPart.slice(0, -1)) / 100 : Number(alphaPart);
  }
  return { L, C, H, alpha };
}
function oklchToLinearSrgb(L, C, H) {
  const hRad = H * Math.PI / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  };
}
function linearSrgbToLinearP3({ r, g, b }) {
  return {
    r: 0.8224621209 * r + 0.1775378791 * g,
    g: 0.0331941989 * r + 0.9668058011 * g,
    b: 0.0170826307 * r + 0.0723974407 * g + 0.9105199286 * b
  };
}
function gammaToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToGamma(c) {
  const v = c <= 31308e-7 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.min(1, Math.max(0, v));
}
function channelToHex(c) {
  return Math.round(c * 255).toString(16).padStart(2, "0");
}
function formatColor({ r, g, b }, alpha) {
  if (alpha >= 1) {
    return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
  }
  const r255 = Math.round(r * 255);
  const g255 = Math.round(g * 255);
  const b255 = Math.round(b * 255);
  return `rgba(${r255}, ${g255}, ${b255}, ${Number(alpha.toFixed(3))})`;
}
function encode(lin) {
  return { r: linearToGamma(lin.r), g: linearToGamma(lin.g), b: linearToGamma(lin.b) };
}
function oklchToSrgb(input) {
  const { L, C, H, alpha } = parseOklch(input);
  return formatColor(encode(oklchToLinearSrgb(L, C, H)), alpha);
}
function oklchToDisplayP3(input) {
  const { L, C, H, alpha } = parseOklch(input);
  return formatColor(encode(linearSrgbToLinearP3(oklchToLinearSrgb(L, C, H))), alpha);
}
function srgbHexToDisplayP3(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`not a #rrggbb color: ${hex}`);
  const n = Number.parseInt(m[1], 16);
  const lin = {
    r: gammaToLinear((n >> 16 & 255) / 255),
    g: gammaToLinear((n >> 8 & 255) / 255),
    b: gammaToLinear((n & 255) / 255)
  };
  return formatColor(encode(linearSrgbToLinearP3(lin)), 1);
}
function p3ChannelsToHex([r, g, b]) {
  return formatColor({ r, g, b }, 1);
}
export {
  oklchToDisplayP3,
  oklchToSrgb,
  p3ChannelsToHex,
  parseOklch,
  srgbHexToDisplayP3
};
