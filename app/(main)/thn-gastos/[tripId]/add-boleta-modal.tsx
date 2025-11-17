"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Plus, X } from "lucide-react";

interface AddBoletaModalProps {
  tripId: string;
}

export function AddBoletaModal({ tripId }: AddBoletaModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string>("");

  // Generate a random 4-digit code when modal opens
  useEffect(() => {
    if (isOpen) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setVerificationCode(code);
    }
  }, [isOpen]);

  // Create QR data - combining tripId and verification code
  const qrData = JSON.stringify({
    tripId,
    code: verificationCode,
    timestamp: Date.now(),
  });

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative bg-amber-500 hover:bg-amber-400 text-white font-black px-8 py-4 text-lg uppercase tracking-widest transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] border-2 border-stone-900"
      >
        <span className="flex items-center gap-3">
          <Plus className="w-6 h-6" />
          Agregar Boleta
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          {/* Modal Content */}
          <div className="relative bg-white border-4 border-stone-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-2 border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="bg-stone-900 text-white p-6">
              <h2 className="text-2xl font-black uppercase tracking-tight">
                Escanear para Agregar Boleta
              </h2>
              <p className="text-sm text-stone-400 mt-2 font-mono">
                Escanea el QR desde la app móvil
              </p>
            </div>

            {/* QR Code Section */}
            <div className="p-8 space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-6 border-4 border-stone-900 inline-block">
                  <QRCodeSVG
                    value={qrData}
                    size={240}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-stone-900"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs uppercase tracking-widest font-bold text-stone-500">
                    Código de verificación
                  </span>
                </div>
              </div>

              {/* 4-Digit Code */}
              <div className="text-center">
                <div className="inline-flex gap-2 justify-center">
                  {verificationCode.split("").map((digit, index) => (
                    <div
                      key={index}
                      className="w-16 h-20 bg-stone-100 border-4 border-stone-900 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <span className="text-4xl font-black font-mono text-stone-900">
                        {digit}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-stone-500 mt-4 font-mono">
                  Ingresa este código en la app
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 border-2 border-amber-500 p-4">
                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-2">
                  Instrucciones:
                </h3>
                <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                  <li>Abre la app móvil THN Gastos</li>
                  <li>Escanea el código QR o ingresa el código</li>
                  <li>Toma fotos de las boletas del viaje</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
