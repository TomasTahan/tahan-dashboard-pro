import { getPendingReceipt } from "./data";
import { ImageViewer } from "./image-viewer";

type ReceiptImageProps = {
  receiptId?: string;
};

export async function ReceiptImage({ receiptId }: ReceiptImageProps) {
  const receipt = await getPendingReceipt(receiptId);

  if (!receipt) {
    return (
      <section className="relative flex flex-col gap-4">
        <div className="relative flex h-full max-h-[88vh] items-center justify-center rounded-xl border bg-muted/20">
          <p className="text-muted-foreground">No se encontró la boleta</p>
        </div>
      </section>
    );
  }

  return (
    <ImageViewer imageUrl={receipt.url} altText="Boleta subida por el chofer" />
  );
}
