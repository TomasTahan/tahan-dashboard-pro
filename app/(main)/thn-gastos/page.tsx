import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { ReceiptContent } from "./receipt-content";
import { ImageViewerSkeleton, FormSkeleton } from "./skeletons";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function ThnGastosPage({ searchParams }: PageProps) {
  return (
    <>
      {/* STATIC: Header - se renderiza instantáneamente */}
      <SiteHeader title="THN Gastos" />

      <div className="flex h-full flex-col gap-6 p-6">
        {/* DYNAMIC: Todo el contenido incluyendo searchParams */}
        <Suspense
          fallback={
            <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
              <ImageViewerSkeleton />
              <FormSkeleton />
            </div>
          }
        >
          <ReceiptContent searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
