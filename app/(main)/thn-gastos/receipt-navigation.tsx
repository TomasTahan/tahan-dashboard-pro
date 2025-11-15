import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ReceiptNavigationProps = {
  previousId: string | null;
  nextId: string | null;
  currentIndex: number;
  totalCount: number;
};

export function ReceiptNavigation({
  previousId,
  nextId,
  currentIndex,
  totalCount,
}: ReceiptNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">
        {currentIndex} de {totalCount}
      </span>
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="outline"
          disabled={!previousId}
          asChild={!!previousId}
        >
          {previousId ? (
            <Link href={`/thn-gastos?id=${previousId}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="outline"
          disabled={!nextId}
          asChild={!!nextId}
        >
          {nextId ? (
            <Link href={`/thn-gastos?id=${nextId}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
