import type { Icon } from "@tabler/icons-react";

export type AgentComponentProps = {
  agentId: string;
  onClose?: () => void;
};

export type Agent = {
  id: string;
  name: string;
  icon: Icon;
  badge: number | null;
  component: React.ComponentType<AgentComponentProps>;
  width?: string; // Ancho del sidebar cuando este agente está activo (ej: "400px", "30rem")
};
