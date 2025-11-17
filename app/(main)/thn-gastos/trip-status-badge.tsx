import { TripStatus } from "./trips-list";

interface TripStatusBadgeProps {
  status: TripStatus;
}

const statusConfig: Record<
  TripStatus,
  { label: string; color: string; bg: string }
> = {
  nuevo: {
    label: "Nuevo",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  "en-proceso": {
    label: "En Proceso",
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  completado: {
    label: "Completado",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  cancelado: {
    label: "Cancelado",
    color: "text-red-700",
    bg: "bg-red-100",
  },
};

export function TripStatusBadge({ status }: TripStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full ${config.bg} ${config.color}`}
    >
      <span className="text-xs font-semibold">{config.label}</span>
    </div>
  );
}
