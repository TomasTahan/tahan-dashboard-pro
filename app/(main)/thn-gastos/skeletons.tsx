import { Skeleton } from "@/components/ui/skeleton";

export function ImageViewerSkeleton() {
  return (
    <section className="relative flex flex-col gap-4">
      <div className="relative flex h-full max-h-[88vh] overflow-auto rounded-xl border bg-muted/20">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="absolute bottom-8 right-8 z-10 flex gap-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
    </section>
  );
}

export function FormSkeleton() {
  return (
    <section className="flex flex-col rounded-xl border bg-muted/10 p-4 shadow-xs">
      <div className="flex flex-1 flex-col gap-4">
        <div className="grid gap-4">
          {/* Referencia */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Razón social */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Fecha y Total */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Moneda y RUC */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>

        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-10 w-full" />
      </div>
    </section>
  );
}
