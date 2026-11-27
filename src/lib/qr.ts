import QRCode from "qrcode";

/** Logo shown in the middle of every pass QR. */
export const QR_LOGO = "/brand/mark.png";

// "H" error correction keeps the code readable with ~20% of the middle covered by the logo
const OPTS = { errorCorrectionLevel: "H" as const, margin: 0, color: { dark: "#0b1424", light: "#fbfbfb" } };

export const qrSvg = (url: string) => QRCode.toString(url, { ...OPTS, type: "svg" });
export const qrCanvas = (canvas: HTMLCanvasElement, url: string, width: number) => QRCode.toCanvas(canvas, url, { ...OPTS, width });
