import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ReceiptImage } from "./receipt-image";
import { ReceiptForm } from "./receipt-form";
import { ImageViewerSkeleton, FormSkeleton } from "./skeletons";
import { getPendingReceipt } from "./data";

type ReceiptContentProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function ReceiptContent({ searchParams }: ReceiptContentProps) {
  const params = await searchParams;
  let receiptId = typeof params.id === "string" ? params.id : undefined;

  // Si no hay ID en la URL, obtener la primera boleta pendiente y redirigir
  if (!receiptId) {
    const firstReceipt = await getPendingReceipt();
    if (firstReceipt) {
      redirect(`/thn-gastos?id=${firstReceipt.id}`);
    }
  }

  return (
    <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
      {/* DYNAMIC: Image Viewer - carga la URL de la imagen desde la base de datos */}
      <Suspense fallback={<ImageViewerSkeleton />}>
        <ReceiptImage receiptId={receiptId} />
      </Suspense>

      {/* DYNAMIC: Form - carga los datos del formulario desde la base de datos */}
      <Suspense fallback={<FormSkeleton />}>
        <ReceiptForm receiptId={receiptId} />
      </Suspense>
    </div>
  );
}
