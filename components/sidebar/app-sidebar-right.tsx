"use client";

import * as React from "react";
import {
  IconBell,
  IconClock,
  IconMessage,
  IconNotes,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
// import type { Agent } from "@/types/agent";

// Importar componentes de agentes
// import { NotificationAgent } from "@/components/agents/notification-agent";
// import { MessageAgent } from "@/components/agents/message-agent";
// import { ActivityAgent } from "@/components/agents/activity-agent";
// import { ExpensesAgent } from "@/components/agents/expenses-agent";

const EXPENSES_AGENT_ID = "expenses-assistant";

// const agents: Agent[] = [
//   {
//     id: EXPENSES_AGENT_ID,
//     name: "THN Gastos",
//     icon: IconNotes,
//     badge: null,
//     component: ExpensesAgent,
//     width: "420px",
//   },
//   {
//     id: "notifications",
//     name: "Notificaciones",
//     icon: IconBell,
//     badge: 3,
//     component: NotificationAgent,
//     width: "250px",
//   },
//   {
//     id: "messages",
//     name: "Mensajes",
//     icon: IconMessage,
//     badge: 5,
//     component: MessageAgent,
//     width: "420px",
//   },
//   {
//     id: "activity",
//     name: "Actividad",
//     icon: IconClock,
//     badge: null,
//     component: ActivityAgent,
//     width: "400px",
//   },
// ];

export function AppSidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { setOpenRight, openRight } = useSidebar();
  const pathname = usePathname();
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const openTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const previousPinnedAgentIdRef = React.useRef<string | null>(null);
  const pinnedAgentId = React.useMemo(() => {
    if (!pathname) {
      return null;
    }

    if (pathname === "/thn-gastos" || pathname.startsWith("/thn-gastos/")) {
      return EXPENSES_AGENT_ID;
    }

    return null;
  }, [pathname]);
  const [activeAgentId, setActiveAgentId] = React.useState<string | null>(
    pinnedAgentId
  );
  const [renderedAgentId, setRenderedAgentId] = React.useState<string | null>(
    pinnedAgentId
  );

  // Obtener el agente activo
  // TODO: Descomentar cuando se implementen los agentes
  // const activeAgent = agents.find((agent) => agent.id === activeAgentId);
  // const renderedAgent = agents.find((agent) => agent.id === renderedAgentId);
  // const isPinnedActive =
  //   Boolean(pinnedAgentId) && activeAgent?.id === pinnedAgentId;
  // const isPinnedRendered =
  //   Boolean(pinnedAgentId) && renderedAgent?.id === pinnedAgentId;

  const handleMouseEnter = (agentId: string) => {
    // Cancelar cualquier cierre pendiente
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // Cancelar cualquier apertura pendiente
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    // Asegurar que el contenedor se expanda cuando se interactúa con cualquier agente
    if (!openRight) {
      setOpenRight(true);
    }

    // Actualizar el agente activo inmediatamente para gestionar el ancho
    setActiveAgentId(agentId);

    // Ocultar temporalmente el contenido anterior mientras se espera
    if (agentId !== renderedAgentId) {
      setRenderedAgentId(null);
    }

    // Crear delay antes de renderizar el contenido
    openTimeoutRef.current = setTimeout(() => {
      openTimeoutRef.current = null;
      setRenderedAgentId(agentId);
    }, 175);
  };

  const handleMouseLeave = () => {
    // Cancelar cualquier apertura pendiente
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (pinnedAgentId) {
      setOpenRight(true);
      setActiveAgentId(pinnedAgentId);
      setRenderedAgentId(pinnedAgentId);
      return;
    }

    // Cerrar con delay de 500ms
    closeTimeoutRef.current = setTimeout(() => {
      setOpenRight(false);
      setActiveAgentId(null);
      setRenderedAgentId(null);
      closeTimeoutRef.current = null;
    }, 500);
  };

  // Limpiar timeout al desmontar
  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    // Solo ejecutar si realmente cambió el pinnedAgentId
    if (previousPinnedAgentIdRef.current === pinnedAgentId) {
      return;
    }

    // Cancelar timeouts pendientes cuando cambia la ruta
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    // Si hay un agente pinneado, abrirlo automáticamente
    if (pinnedAgentId) {
      setOpenRight(true);
      setActiveAgentId(pinnedAgentId);
      setRenderedAgentId(pinnedAgentId);
    } else if (previousPinnedAgentIdRef.current !== null) {
      // Solo limpiar si veníamos de tener un agente pinneado
      setActiveAgentId(null);
      setRenderedAgentId(null);
      setOpenRight(false);
    }

    // Actualizar la referencia
    previousPinnedAgentIdRef.current = pinnedAgentId;
  }, [pinnedAgentId, setOpenRight]);

  // Aplicar ancho dinámico basado en el agente activo
  // Ancho total = ancho de iconos (3rem) + ancho del contenido del agente
  // TODO: Descomentar cuando se implementen los agentes
  const iconWidth = "3rem";
  // const contentWidth = activeAgent?.width || "0px";
  // const sidebarWidth =
  //   (openRight && activeAgent) || isPinnedActive
  //     ? `calc(${iconWidth} + ${contentWidth})`
  //     : iconWidth;
  const sidebarWidth = iconWidth; // Por ahora solo el ancho de iconos

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      {...props}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => {
        // Cancelar el cierre si vuelve a entrar al sidebar
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
      }}
      style={
        {
          "--sidebar-width": sidebarWidth,
        } as React.CSSProperties
      }
    >
      <div className="flex h-full">
        {/* TODO: Descomentar cuando se implementen los agentes */}
        {/* Contenido del agente - solo visible cuando hay un agente activo */}
        {/* {((openRight && renderedAgent) || isPinnedRendered) &&
          renderedAgent && (
            <div
              key={renderedAgent.id}
              className="flex-1 animate-in fade-in slide-in-from-left-4 duration-300"
              style={{ width: renderedAgent.width }}
            >
              <renderedAgent.component agentId={renderedAgent.id} />
            </div>
          )} */}

        {/* Columna de iconos - siempre visible en el lado derecho */}
        <div className="flex w-12 shrink-0 flex-col ml-auto">
          {/* Header */}
          {/* <div className="flex h-12 items-center justify-center border-b">
            <IconNotes className="size-5 text-muted-foreground" />
          </div> */}

          {/* Iconos de agentes */}
          <div className="flex flex-1 flex-col gap-1 p-2 mt-12">
            {/* {agents.map((agent) => {
              const hasBadge = agent.badge !== null && agent.badge > 0;
              const isActive = activeAgentId === agent.id;

              return (
                <button
                  key={agent.id}
                  type="button"
                  onMouseEnter={() => handleMouseEnter(agent.id)}
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-md transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={agent.name}
                >
                  <agent.icon className="size-4" />
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {agent.badge}
                    </span>
                  )}
                </button>
              );
            })} */}
          </div>

          {/* Footer */}
          {/* <div className="flex h-8 items-center justify-center border-t">
            <div className="size-1.5 rounded-full bg-green-500" />
          </div> */}
        </div>
      </div>
    </Sidebar>
  );
}
