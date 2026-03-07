import { QRCodeSVG } from 'qrcode.react';

interface QRCodePanelProps {
  url?: string;
}

export function QRCodePanel({ url }: QRCodePanelProps) {
  const qrUrl = url || window.location.href;

  return (
    <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-qr-gradient-start to-qr-gradient-end p-8 sticky top-0 h-screen">
      <div className="bg-navy-mid p-8 rounded-2xl shadow-xl border border-navy-light/50">
        <QRCodeSVG
          value={qrUrl}
          size={256}
          level="H"
          bgColor="#12243D"
          fgColor="#F5F0E6"
        />
      </div>
    </div>
  );
}
