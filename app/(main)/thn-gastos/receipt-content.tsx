import { Suspense } from "react";
import { ReceiptImage } from "./receipt-image";
import { ReceiptForm } from "./receipt-form";
import { ImageViewerSkeleton, FormSkeleton } from "./skeletons";

type ReceiptContentProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function ReceiptContent({ searchParams }: ReceiptContentProps) {
  const params = await searchParams;
  const receiptId = typeof params.id === "string" ? params.id : undefined;

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
