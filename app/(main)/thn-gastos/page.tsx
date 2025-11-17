import { SiteHeader } from "@/components/site-header";
import { TripsListWrapper } from "./trips-list-wrapper";
import { TrendingUp, Truck, DollarSign } from "lucide-react";
import { Suspense } from "react";
import { CreateTripModal } from "./create-trip-modal";
import { getAllTrips, type TripListItem } from "./data";

// Componente async que obtiene y calcula el valor
async function StatValue({ type }: { type: "total" | "active" | "expenses" }) {
  const trips = await getAllTrips();

  let value: string | number;
  switch (type) {
    case "total":
      value = trips.length;
      break;
    case "active":
      value = trips.filter((t) => t.status === "in_progress").length;
      break;
    case "expenses":
      value = `$${trips
        .reduce((sum, t) => sum + t.total_expenses, 0)
        .toLocaleString("es-CL")}`;
      break;
  }

  return <>{value}</>;
}

// Componente sincrónico que renderiza la card con Suspense interno
function StatCard({
  title,
  type,
  icon: Icon,
  iconBgColor,
  iconColor,
}: {
  title: string;
  type: "total" | "active" | "expenses";
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            <Suspense fallback={<span className="text-gray-400">-</span>}>
              <StatValue type={type} />
            </Suspense>
          </p>
        </div>
        <div
          className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// Componente que muestra la lista de viajes
async function TripsListData() {
  // Hace la MISMA llamada - React automáticamente deduplicará esto
  const trips = await getAllTrips();

  return <TripsListWrapper trips={trips} />;
}

export default function ThnGastosPage() {
  return (
    <>
      <SiteHeader title="THN Gastos" />

      <div className="flex h-full flex-col gap-6 p-6 bg-gray-50">
        {/* Stats Cards - el Suspense está solo en el número */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Viajes"
            type="total"
            icon={TrendingUp}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Viajes Activos"
            type="active"
            icon={Truck}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Gastos Totales"
            type="expenses"
            icon={DollarSign}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Viajes
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Administra y realiza seguimiento de todos los viajes
              </p>
            </div>
            <CreateTripModal />
          </div>

          {/* Trips List - Suspense necesario porque TripsListData es async */}
          <Suspense
            fallback={
              <div className="space-y-4">
                {/* Skeleton para filtros */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="h-12 bg-gray-100 rounded-lg flex-1 animate-pulse"></div>
                  <div className="h-12 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
                {/* Skeleton para contador */}
                <div className="h-6 bg-gray-100 rounded w-32 animate-pulse"></div>
                {/* Skeleton para viajes */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 bg-gray-100 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            }
          >
            <TripsListData />
          </Suspense>
        </div>
      </div>
    </>
  );
}
