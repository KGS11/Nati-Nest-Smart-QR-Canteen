import { useState, ChangeEvent } from "react";
import jsQR from "jsqr";
import { Camera, RotateCcw } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const MAX_IMAGE_DIMENSION = 1200;

/**
 * Load a File into an Image element via FileReader → data URL.
 */
function loadFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Draw the image to canvas (auto-applies EXIF rotation in modern browsers)
 * and return the canvas + context.
 */
function drawImageToCanvas(
  img: HTMLImageElement,
  maxDim: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  let { width, height } = img;

  // Downscale if needed
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, width, height);
  return { canvas, ctx };
}

/**
 * Try decoding QR from canvas pixel data using jsQR.
 * Attempts multiple strategies:
 *  1. Original image
 *  2. Enhanced contrast
 *  3. Grayscale
 *  4. Inverted
 */
function tryDecodeQR(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): string | null {
  const { width, height } = canvas;

  // Attempt 1: Original pixels
  const imageData = ctx.getImageData(0, 0, width, height);
  const result = jsQR(imageData.data, width, height, {
    inversionAttempts: "attemptBoth",
  });
  if (result?.data) return result.data;

  // Attempt 2: Higher contrast — stretch histogram
  const contrastData = ctx.getImageData(0, 0, width, height);
  const cd = contrastData.data;
  for (let i = 0; i < cd.length; i += 4) {
    cd[i] = Math.min(255, Math.max(0, (cd[i] - 128) * 1.5 + 128));
    cd[i + 1] = Math.min(255, Math.max(0, (cd[i + 1] - 128) * 1.5 + 128));
    cd[i + 2] = Math.min(255, Math.max(0, (cd[i + 2] - 128) * 1.5 + 128));
  }
  const result2 = jsQR(cd, width, height, {
    inversionAttempts: "attemptBoth",
  });
  if (result2?.data) return result2.data;

  // Attempt 3: Grayscale conversion
  const grayData = ctx.getImageData(0, 0, width, height);
  const gd = grayData.data;
  for (let i = 0; i < gd.length; i += 4) {
    const gray = 0.299 * gd[i] + 0.587 * gd[i + 1] + 0.114 * gd[i + 2];
    gd[i] = gray;
    gd[i + 1] = gray;
    gd[i + 2] = gray;
  }
  const result3 = jsQR(gd, width, height, {
    inversionAttempts: "attemptBoth",
  });
  if (result3?.data) return result3.data;

  // Attempt 4: Threshold to black/white
  const bwData = ctx.getImageData(0, 0, width, height);
  const bw = bwData.data;
  for (let i = 0; i < bw.length; i += 4) {
    const gray = 0.299 * bw[i] + 0.587 * bw[i + 1] + 0.114 * bw[i + 2];
    const val = gray > 128 ? 255 : 0;
    bw[i] = val;
    bw[i + 1] = val;
    bw[i + 2] = val;
  }
  const result4 = jsQR(bw, width, height, {
    inversionAttempts: "attemptBoth",
  });
  if (result4?.data) return result4.data;

  return null;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const file = e.target.files[0];
      const img = await loadFileAsImage(file);

      // Try multiple scales for better detection
      const scales = [MAX_IMAGE_DIMENSION, 800, 1600];
      let decoded: string | null = null;

      for (const maxDim of scales) {
        const { canvas, ctx } = drawImageToCanvas(img, maxDim);
        decoded = tryDecodeQR(canvas, ctx);
        if (decoded) break;
      }

      if (decoded) {
        onScanSuccess(decoded);
      } else {
        setError(
          "Could not find a valid QR code. Tips:\n• Hold your phone steady and close to the QR code\n• Make sure QR code is well-lit with no glare\n• Try from gallery if camera doesn't work"
        );
      }
    } catch (err) {
      console.error("QR scan error:", err);
      setError("Failed to process the image. Please try again.");
    } finally {
      setIsProcessing(false);
      // Reset file input so the same file can be re-selected
      e.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
      <div className="flex-1 flex flex-col justify-center p-4">
        <div className="bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 w-full max-w-sm mx-auto">
          <div className="p-4 border-b border-zinc-800 text-center relative">
            <h3 className="text-zinc-100 font-bold flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              Scan Merchant QR
            </h3>
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-6 text-center w-full">
            <Camera className="w-16 h-16 text-amber-500 mb-4 opacity-80" />
            <h4 className="text-white font-semibold text-lg mb-2">
              Capture QR Code
            </h4>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Tap the button below to open your camera and take a clear photo of
              the merchant's UPI QR code.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 w-full">
                <p className="text-red-400 text-xs whitespace-pre-line">
                  {error}
                </p>
              </div>
            )}

            {/* Camera capture button */}
            <label className="relative cursor-pointer bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-4 px-6 rounded-xl flex items-center gap-2 transition-all active:scale-95 w-full justify-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 animate-spin" />
                  Decoding QR...
                </span>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Tap to Open Camera
                </>
              )}
            </label>

            {/* Gallery option */}
            <label className="relative cursor-pointer text-amber-400 hover:text-amber-300 font-medium text-sm mt-4 underline">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              Or pick from gallery
            </label>
          </div>

          <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
            <p className="text-zinc-500 text-xs text-center">
              Take a clear, well-lit photo of the QR code. Hold steady and avoid
              glare.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
