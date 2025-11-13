"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { IconCalendar, IconMapPin, IconCreditCard } from "@tabler/icons-react";
import { CheckCircle2Icon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

interface ExpenseItem {
  id: string;
  concept: string;
  amount: number;
  date: string;
  status: "approved" | "pending" | "rejected";
}

interface RenditionData {
  driver: string;
  tripDate: string;
  destination: string;
  advanceAmount: number; // Anticipo entregado
  totalAmount: number; // Total gastado
  expenses: ExpenseItem[];
}

interface ExpenseRenditionCardProps {
  data: RenditionData;
}

const statusColors = {
  approved: "bg-green-500/10 text-green-700 border-green-200",
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  rejected: "bg-red-500/10 text-red-700 border-red-200",
};

const statusLabels = {
  approved: "Aprobado",
  pending: "Pendiente",
  rejected: "Rechazado",
};

export function ExpenseRenditionCard({ data }: ExpenseRenditionCardProps) {
  const spentPercentage = (data.totalAmount / data.advanceAmount) * 100;
  const difference = data.advanceAmount - data.totalAmount;
  const isUnderBudget = difference > 0;

  return (
    <Card className="my-4 border-amber-500/20 bg-amber-500/5">
      <CardHeader className="pb-4">
        <div className="mb-4 space-y-1">
          <h4 className="font-semibold text-base">{data.driver}</h4>
          <div className="flex flex-col gap-1.5 text-muted-foreground text-xs">
            <div className="flex items-center gap-1.5">
              <IconCalendar className="size-3.5" />
              <span>{data.tripDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconMapPin className="size-3.5" />
              <span>{data.destination}</span>
            </div>
          </div>
        </div>

        {/* Visualización de anticipo vs gastado */}
        <div className="space-y-3 rounded-lg border bg-background p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Gastado</span>
              <span className="font-semibold">
                ${data.totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-xs">
                {spentPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs">Anticipo</span>
              <span className="font-semibold">
                ${data.advanceAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <Progress
            value={Math.min(spentPercentage, 100)}
            className={
              isUnderBudget
                ? "bg-green-500/20 [&>*]:bg-green-600"
                : "bg-red-500/20 [&>*]:bg-red-600"
            }
          />

          <div className="flex items-center justify-center gap-2">
            {isUnderBudget ? (
              <>
                <TrendingDownIcon className="size-4 text-green-600" />
                <p className="text-green-700 text-xs">
                  <span className="font-semibold">
                    Sobran ${difference.toLocaleString()}
                  </span>{" "}
                  - El chofer debe devolver
                </p>
              </>
            ) : (
              <>
                <TrendingUpIcon className="size-4 text-red-600" />
                <p className="text-red-700 text-xs">
                  <span className="font-semibold">
                    Faltan ${Math.abs(difference).toLocaleString()}
                  </span>{" "}
                  - Se debe reembolsar al chofer
                </p>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator className="bg-amber-500/20" />

      <CardContent className="pt-4">
        <div className="space-y-2">
          <h5 className="flex items-center gap-2 font-medium text-sm">
            <IconCreditCard className="size-4" />
            Gastos del viaje
          </h5>
          <div className="space-y-2">
            {data.expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-lg border bg-background p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{expense.concept}</p>
                  <p className="text-muted-foreground text-xs">{expense.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm">
                    ${expense.amount.toLocaleString()}
                  </span>
                  <Badge
                    variant="outline"
                    className={statusColors[expense.status]}
                  >
                    {expense.status === "approved" && (
                      <CheckCircle2Icon className="mr-1 size-3" />
                    )}
                    {statusLabels[expense.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
