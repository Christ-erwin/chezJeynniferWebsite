import type { Order } from "@/lib/api";
import { isLightColor } from "@/lib/catalog";

/**
 * Image PNG des billets (un bloc par billet : équipe, soirée, date, lieu,
 * titulaire, code, QR code), à enregistrer dans la galerie du téléphone.
 * Remplace window.print(), ignoré par la plupart des navigateurs mobiles
 * (et par les navigateurs intégrés de WhatsApp, Instagram, Facebook…).
 *
 * qrSvgs : le balisage SVG des QR codes déjà affichés sur la page, dans
 * l'ordre des billets.
 */
const W = 1080;
const PAD = 56;
const CARD_H = 760;
const GAP = 40;
const FONT = "Helvetica, Arial, sans-serif";
const INK = "#2b1a14";
const MUTED = "#7a6a60";
const CREAM = "#f5efe6";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function svgUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Coupe un texte trop long pour tenir dans maxWidth (ajoute « … »). */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

export async function ticketsImage(order: Order, qrSvgs: string[], when: string): Promise<Blob> {
  const n = order.tickets.length;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = PAD * 2 + n * CARD_H + (n - 1) * GAP + 70;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0b0b0c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const logo = await loadImage("/brand/logo-dark.png").catch(() => null);
  const qrs = await Promise.all(qrSvgs.map((s) => loadImage(svgUrl(s)).catch(() => null)));
  const title = order.eventTitle.replace(" chez Jeynnifer", "");
  const place = order.venue ? (order.venue.address ?? [order.venue.name, order.venue.city].filter(Boolean).join(", ")) : "";

  order.tickets.forEach((t, i) => {
    const x = PAD;
    const y = PAD + i * (CARD_H + GAP);
    const w = W - PAD * 2;

    ctx.save();
    roundRect(ctx, x, y, w, CARD_H, 36);
    ctx.clip();
    ctx.fillStyle = CREAM;
    ctx.fillRect(x, y, w, CARD_H);

    let top = y;
    if (t.team) {
      ctx.fillStyle = t.team.color;
      ctx.fillRect(x, y, w, 96);
      ctx.fillStyle = isLightColor(t.team.color) ? "#141213" : "#ffffff";
      ctx.font = `700 40px ${FONT}`;
      ctx.textBaseline = "middle";
      ctx.fillText(`ÉQUIPE ${t.team.name.toUpperCase()}`, x + 44, y + 48);
      top += 96;
    }
    ctx.restore();

    ctx.textBaseline = "alphabetic";
    // en-tête : logo, numéro du billet, soirée, date, lieu
    if (logo) ctx.drawImage(logo, x + 44, top + 36, 170, (170 * logo.height) / logo.width);
    ctx.fillStyle = INK;
    roundRect(ctx, x + w - 44 - 110, top + 40, 110, 56, 28);
    ctx.fill();
    ctx.fillStyle = "#f2b8a0";
    ctx.font = `700 30px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(`${i + 1}/${n}`, x + w - 44 - 55, top + 79);
    ctx.textAlign = "left";

    ctx.fillStyle = INK;
    ctx.font = `700 60px ${FONT}`;
    ctx.fillText(fit(ctx, title.toUpperCase(), w - 88), x + 44, top + 210);
    ctx.fillStyle = MUTED;
    ctx.font = `400 32px ${FONT}`;
    ctx.fillText(fit(ctx, when, w - 88), x + 44, top + 262);
    if (place) ctx.fillText(fit(ctx, place, w - 88), x + 44, top + 306);

    // ligne pointillée de découpe
    const cut = top + 350;
    ctx.strokeStyle = "rgba(43,26,20,0.25)";
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 12]);
    ctx.beginPath();
    ctx.moveTo(x + 30, cut);
    ctx.lineTo(x + w - 30, cut);
    ctx.stroke();
    ctx.setLineDash([]);

    // titulaire + code à gauche, QR code à droite
    const qrSize = Math.min(300, y + CARD_H - cut - 50);
    const qrX = x + w - 44 - qrSize;
    const textW = qrX - x - 44 - 24;
    ctx.fillStyle = MUTED;
    ctx.font = `600 26px ${FONT}`;
    ctx.fillText(fit(ctx, t.label.toUpperCase(), textW), x + 44, cut + 70);
    ctx.fillStyle = INK;
    ctx.font = `700 42px ${FONT}`;
    ctx.fillText(fit(ctx, t.holder, textW), x + 44, cut + 124);
    let line = cut + 124;
    if (t.pack) {
      ctx.fillStyle = MUTED;
      ctx.font = `400 28px ${FONT}`;
      line += 46;
      ctx.fillText(fit(ctx, `Pack : ${t.pack.style} · ${t.pack.size}`, textW), x + 44, line);
    }
    ctx.fillStyle = INK;
    ctx.font = `600 32px Menlo, Consolas, monospace`;
    ctx.fillText(fit(ctx, t.code, textW), x + 44, line + 64);

    const qr = qrs[i];
    if (qr) {
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, qrX - 14, cut + 36 - 14, qrSize + 28, qrSize + 28, 18);
      ctx.fill();
      ctx.drawImage(qr, qrX, cut + 36, qrSize, qrSize);
    }
  });

  ctx.fillStyle = "#8b857e";
  ctx.font = `400 28px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(`Commande ${order.reference} · présente un QR code par personne à l'entrée`, W / 2, canvas.height - PAD - 10);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("image"))), "image/png"));
}

/**
 * Propose d'enregistrer l'image : menu de partage du téléphone (« Enregistrer
 * l'image », WhatsApp…) quand il existe, sinon téléchargement classique.
 */
export async function saveImage(blob: Blob, filename: string, title: string): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // partage annulé par l'utilisateur
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
