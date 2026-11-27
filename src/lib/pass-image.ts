import { qrCanvas, QR_LOGO } from "./qr";

type PassInfo = { name: string; passCode: string; url: string; host: string; when: string; where: string; logo: string };

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** Font stacks from the page (next/font generates the family names). */
function fonts() {
  const css = getComputedStyle(document.documentElement);
  const ethi = css.getPropertyValue("--f-ethi").trim();
  return {
    display: `${css.getPropertyValue("--f-display").trim()}, ${ethi}, sans-serif`,
    body: `${css.getPropertyValue("--f-body").trim()}, ${ethi}, sans-serif`,
  };
}

/** Wrap text to at most `maxLines` lines that fit `width`. */
function lines(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number) {
  const out: string[] = [];
  let cur = "";
  for (const w of text.split(/\s+/)) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= width || !cur) cur = next;
    else { out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  return out.slice(0, maxLines);
}

/** Draws the entry pass as a 1080×1620 PNG (phone-photo friendly). */
export async function renderPass(p: PassInfo): Promise<Blob> {
  const W = 1080, H = 1620, M = 90;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  const f = fonts();
  await document.fonts?.ready;

  // card
  ctx.fillStyle = "#24385c";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#152441";
  ctx.beginPath(); ctx.roundRect(50, 50, W - 100, H - 100, 48); ctx.fill();

  // logo
  try {
    const logo = await loadImage(p.logo);
    const lh = 150, lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, M + 10, 110, lw, lh);
  } catch { /* logo is decoration only */ }

  ctx.fillStyle = "rgba(251,251,251,.75)";
  ctx.font = `600 30px ${f.body}`;
  ctx.letterSpacing = "6px";
  ctx.fillText(`ENTRY PASS · ${p.host.toUpperCase()}`, M + 10, 340);
  ctx.letterSpacing = "0px";

  // name (up to 2 lines)
  ctx.fillStyle = "#fbfbfb";
  ctx.font = `600 96px ${f.display}`;
  const nameLines = lines(ctx, p.name.toUpperCase(), W - 2 * M - 20, 2);
  nameLines.forEach((l, i) => ctx.fillText(l, M + 10, 450 + i * 100));
  let y = 450 + nameLines.length * 100 + 10;

  ctx.fillStyle = "rgba(251,251,251,.88)";
  ctx.font = `500 38px ${f.body}`;
  ctx.fillText(p.when, M + 10, y); y += 56;
  ctx.fillText(p.where, M + 10, y);

  // tear line with notches
  const cutY = 860;
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 4; ctx.setLineDash([18, 14]);
  ctx.beginPath(); ctx.moveTo(110, cutY); ctx.lineTo(W - 110, cutY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#24385c";
  for (const x of [50, W - 50]) { ctx.beginPath(); ctx.arc(x, cutY, 40, 0, Math.PI * 2); ctx.fill(); }

  // QR
  const qrSize = 500, qx = (W - qrSize) / 2, qy = 930;
  ctx.fillStyle = "#fbfbfb";
  ctx.beginPath(); ctx.roundRect(qx - 36, qy - 36, qrSize + 72, qrSize + 72, 36); ctx.fill();
  const qc = document.createElement("canvas");
  await qrCanvas(qc, p.url, qrSize);
  ctx.drawImage(qc, qx, qy, qrSize, qrSize);
  // logo in the middle
  try {
    const mark = await loadImage(QR_LOGO);
    const ms = qrSize * 0.22, mx = W / 2 - ms / 2, my = qy + qrSize / 2 - ms / 2;
    ctx.fillStyle = "#fbfbfb";
    ctx.beginPath(); ctx.roundRect(mx - 10, my - 10, ms + 20, ms + 20, 22); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(mx, my, ms, ms, 16); ctx.clip();
    ctx.drawImage(mark, mx, my, ms, ms); ctx.restore();
  } catch { /* QR still works without it */ }

  ctx.textAlign = "center";
  ctx.fillStyle = "#fbfbfb";
  ctx.font = `500 40px ui-monospace, Menlo, monospace`;
  ctx.letterSpacing = "10px";
  ctx.fillText(p.passCode, W / 2, qy + qrSize + 100);
  ctx.letterSpacing = "0px";

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't create image"))), "image/png"));
}

export type PassFile = { file: File; url: string };

/** Render once, ahead of the tap, so the download/share happens instantly inside the tap. */
export async function preparePass(p: PassInfo): Promise<PassFile> {
  const blob = await renderPass(p);
  const file = new File([blob], `entry-pass-${p.passCode}.png`, { type: "image/png" });
  return { file, url: URL.createObjectURL(blob) };
}

/** Phones: open the share sheet ("Save image" → Photos). Returns false when not possible → normal download. */
export function sharePass(f: PassFile): boolean {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (!matchMedia("(pointer: coarse)").matches || !nav.canShare?.({ files: [f.file] })) return false;
  navigator.share({ files: [f.file], title: "Entry pass" }).catch((e: Error) => {
    if (e.name === "AbortError") return; // guest closed the share sheet
    const a = document.createElement("a"); // share refused → plain download
    a.href = f.url; a.download = f.file.name; document.body.appendChild(a); a.click(); a.remove();
  });
  return true;
}
