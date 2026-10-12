/**
 * Generates and downloads a high-resolution, branded PNG of the QR code
 * that clearly displays the business name at the top without compromising
 * the QR code scanner quiet-zone.
 */
export function downloadQRCodeWithBusinessName(
  svgElement: SVGSVGElement | null,
  businessName: string
): boolean {
  if (!svgElement) return false;

  try {
    const cleanName = (businessName || "Business").trim();
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    // High resolution canvas for crisp printing and digital viewing
    const width = 640;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.onload = () => {
      // 1. Pure White Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Subtle outer frame border
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, width - 16, height - 16);

      // 2. Business Name Header (Top)
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let fontSize = 32;
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      // Dynamically fit business name within 540px width
      while (ctx.measureText(cleanName).width > 540 && fontSize > 16) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      }

      ctx.fillStyle = "#0f172a"; // Slate 900
      ctx.fillText(cleanName, width / 2, 58);

      // 3. 5-Star Rating & Subtitle
      ctx.fillStyle = "#f59e0b"; // Golden Amber Stars
      ctx.font = "20px system-ui, -apple-system, sans-serif";
      ctx.fillText("★★★★★", width / 2, 98);

      ctx.fillStyle = "#64748b"; // Slate 500
      ctx.font = "600 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Review us on Google", width / 2, 124);

      // 4. Centered QR Code with full ISO quiet zone
      const qrSize = 440;
      const qrX = (width - qrSize) / 2;
      const qrY = 150;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // 5. Bottom Instructions & Watermark
      ctx.fillStyle = "#1e293b"; // Slate 800
      ctx.font = "600 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Scan with camera to review", width / 2, 630);

      ctx.fillStyle = "#94a3b8"; // Slate 400
      ctx.font = "500 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("dumpareview.online", width / 2, 660);

      // 6. Download Trigger
      const fileSafeName = cleanName
        .replace(/[^a-zA-Z0-9_\-\s]/g, "")
        .replace(/\s+/g, "_");

      const a = document.createElement("a");
      a.download = `${fileSafeName}_QR_Code.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();

      URL.revokeObjectURL(blobURL);
    };

    img.src = blobURL;
    return true;
  } catch (err) {
    console.error("[DumpaReview] Error generating branded QR code image:", err);
    return false;
  }
}
