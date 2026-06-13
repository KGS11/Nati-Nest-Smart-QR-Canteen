import QRCode from "qrcode";

export const generateTableQRText = (tableNumber: string): string => {
  const clientUrl = process.env.CLIENT_URL;

  if (!clientUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CLIENT_URL environment variable is not set. Cannot generate QR codes without a valid public URL.",
      );
    }
    console.warn(
      "[QR WARNING] CLIENT_URL is not set. Falling back to http://localhost:3000. " +
        "Generated QR codes will NOT work in production.",
    );
  }

  const baseUrl = clientUrl ?? "http://localhost:3000";
  return `${baseUrl}/scan/${tableNumber}`;
};

export const generateQRCodeDataURL = async (text: string): Promise<string> => {
  return QRCode.toDataURL(text, {
    type: "image/png",
    errorCorrectionLevel: "M",
  });
};
