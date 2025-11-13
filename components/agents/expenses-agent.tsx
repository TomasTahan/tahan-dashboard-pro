"use client";

import { IconWallet, IconChecklist, IconNotes } from "@tabler/icons-react";
import {
  Conversation,
  ConversationContent,
} from "../ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageResponse,
} from "../ai-elements/message";
import { Loader } from "../ai-elements/loader";
import {
  CopyIcon,
  DatabaseIcon,
  FileTextIcon,
  ExternalLinkIcon,
  PhoneIcon,
  MessageSquareIcon,
  SendIcon,
  XIcon,
} from "lucide-react";
import { Fragment, useState, useCallback, useRef } from "react";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "../ai-elements/prompt-input";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Action, Actions } from "../ai-elements/actions";
import { AgentComponentProps } from "./types";
import { ExpenseRenditionCard } from "./expense-rendition-card";

type QuickAction = {
  id: string;
  icon: typeof IconChecklist;
  title: string;
  description: string;
  prompt: string;
};

const expensesQuickActions: QuickAction[] = [
  {
    id: "upload",
    icon: IconChecklist,
    title: "Cargar comprobantes",
    description:
      "Sube tickets o facturas pendientes para clasificarlos al instante.",
    prompt: "Necesito cargar nuevos comprobantes de gastos.",
  },
  {
    id: "summary",
    icon: IconWallet,
    title: "Ver resumen del mes",
    description: "Obtén una vista rápida de gastos aprobados y pendientes.",
    prompt: "¿Cuál es el resumen de gastos del mes?",
  },
  {
    id: "policy",
    icon: IconNotes,
    title: "Consultar políticas",
    description:
      "Repasa los topes y categorías antes de cargar un gasto nuevo.",
    prompt: "Recordame las políticas de gastos vigentes.",
  },
];

// Tipos para mensajes simulados
type MessagePart =
  | { type: "text"; text: string }
  | { type: "searching"; status: "pending" | "running" | "completed" }
  | { type: "rendition"; data: any }
  | { type: "generating-pdf"; status: "running" | "completed" }
  | { type: "pdf-link"; url: string }
  | { type: "searching-phone"; status: "running" | "completed" }
  | { type: "whatsapp-preview"; phone: string; message: string }
  | { type: "sending-whatsapp"; status: "running" | "completed" };

interface MessageVersion {
  id: string;
  parts: MessagePart[];
}

interface SimulatedMessage {
  key: string;
  from: "user" | "assistant";
  versions: MessageVersion[];
}

// Datos simulados de rendición
const mockRenditionData = {
  driver: "Tomás Tahan",
  tripDate: "19 de Octubre, 2025",
  destination: "Santiago - Valparaíso",
  advanceAmount: 150000, // Anticipo entregado al chofer
  totalAmount: 45000, // Total gastado
  expenses: [
    {
      id: "1",
      concept: "Combustible",
      amount: 25000,
      date: "19/10/2025",
      status: "approved" as const,
    },
    {
      id: "2",
      concept: "Peaje",
      amount: 8000,
      date: "19/10/2025",
      status: "approved" as const,
    },
    {
      id: "3",
      concept: "Alimentación",
      amount: 12000,
      date: "19/10/2025",
      status: "pending" as const,
    },
  ],
};

// Mensajes de WhatsApp
const whatsappMessageWithEmojis = `Hola Tomás 👋

Te envío el resumen de rendiciones de tu viaje Santiago - Valparaíso del 19 de Octubre.

📊 Resumen:
• Anticipo entregado: $150.000
• Total gastado: $45.000
• Sobra para devolver: $105.000

📎 Adjunto el PDF con el detalle completo de gastos:
http://localhost:3000/rendicion-tomas-tahan.html

Cualquier consulta, estamos a tu disposición.`;

const whatsappMessageWithoutEmojis = `Hola Tomás

Te envío el resumen de rendiciones de tu viaje Santiago - Valparaíso del 19 de Octubre.

Resumen:
• Anticipo entregado: $150.000
• Total gastado: $45.000
• Sobra para devolver: $105.000

Adjunto el PDF con el detalle completo de gastos:
http://localhost:3000/rendicion-tomas-tahan.html

Cualquier consulta, estamos a tu disposición.`;

export function ExpensesAgent({ agentId }: AgentComponentProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<SimulatedMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showedWhatsAppPreview, setShowedWhatsAppPreview] = useState(false);
  const messageIdCounter = useRef(0);

  const shouldShowQuickActions = messages.length === 0;

  // Función para generar IDs únicos
  const generateId = () => {
    messageIdCounter.current += 1;
    return `msg-${messageIdCounter.current}`;
  };

  // Simular el workflow completo
  const simulateWorkflow = useCallback(
    async (userQuery: string) => {
      setIsProcessing(true);

      // Detectar intención del usuario
      const isPdfRequest = /pdf|documento|archivo|generar|convertir/i.test(
        userQuery
      );
      const isAffirmative =
        /sí|si|bueno|dale|ok|okay|claro|perfecto|genial|va|envía|enviar/i.test(
          userQuery
        );

      // 1. Agregar mensaje del usuario
      const userMessage: SimulatedMessage = {
        key: generateId(),
        from: "user",
        versions: [
          {
            id: generateId(),
            parts: [{ type: "text", text: userQuery }],
          },
        ],
      };
      setMessages((prev) => [...prev, userMessage]);

      // Pequeño delay antes de la primera respuesta
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (showedWhatsAppPreview) {
        // === FLUJO DE MODIFICACIÓN DEL MENSAJE ===

        // 2. Confirmación de modificación
        const modifyMsg: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [
                {
                  type: "text",
                  text: "Perfecto, voy a reescribir el mensaje sin emojis.",
                },
              ],
            },
          ],
        };
        setMessages((prev) => [...prev, modifyMsg]);

        await new Promise((resolve) => setTimeout(resolve, 600));

        // 3. Mostrar nueva vista previa sin emojis
        const newPreviewMsg: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [
                { type: "text", text: "Aquí está el mensaje actualizado:" },
                {
                  type: "whatsapp-preview",
                  phone: "+56992588444",
                  message: whatsappMessageWithoutEmojis,
                },
              ],
            },
          ],
        };
        setMessages((prev) => [...prev, newPreviewMsg]);
      } else if (isAffirmative) {
        // === FLUJO DE ENVÍO POR WHATSAPP ===

        // 2. Confirmación de búsqueda y envío
        const confirmWhatsAppMsg: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [
                {
                  type: "text",
                  text: "Perfecto, buscaré su número y se lo enviaré por WhatsApp.",
                },
              ],
            },
          ],
        };
        setMessages((prev) => [...prev, confirmWhatsAppMsg]);

        await new Promise((resolve) => setTimeout(resolve, 600));

        // 3. Mostrar búsqueda de número
        const searchingPhoneMsgKey = generateId();
        const searchingPhoneMsgId = generateId();
        const searchingPhoneMsg: SimulatedMessage = {
          key: searchingPhoneMsgKey,
          from: "assistant",
          versions: [
            {
              id: searchingPhoneMsgId,
              parts: [{ type: "searching-phone", status: "running" }],
            },
          ],
        };
        setMessages((prev) => [...prev, searchingPhoneMsg]);

        // Simular búsqueda (1.5 segundos)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 4. Actualizar estado a completado
        setMessages((prev) =>
          prev.map((msg) =>
            msg.key === searchingPhoneMsgKey
              ? {
                  ...msg,
                  versions: msg.versions.map((v) =>
                    v.id === searchingPhoneMsgId
                      ? {
                          ...v,
                          parts: [
                            { type: "searching-phone", status: "completed" },
                          ],
                        }
                      : v
                  ),
                }
              : msg
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 300));

        // 5. Mostrar número encontrado y preparación de mensaje
        const phoneFoundMsg: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [
                {
                  type: "text",
                  text: "Perfecto, aquí encontré su número +56992588444, ahora prepararé el mensaje.",
                },
              ],
            },
          ],
        };
        setMessages((prev) => [...prev, phoneFoundMsg]);

        await new Promise((resolve) => setTimeout(resolve, 800));

        // 6. Mostrar preview del mensaje con botones
        const previewMsg: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [
                { type: "text", text: "¿Está bien este mensaje?" },
                {
                  type: "whatsapp-preview",
                  phone: "+56992588444",
                  message: whatsappMessageWithEmojis,
                },
              ],
            },
          ],
        };
        setMessages((prev) => [...prev, previewMsg]);
        setShowedWhatsAppPreview(true);
      } else if (isPdfRequest) {
        // === FLUJO DE GENERACIÓN DE PDF ===

        // 2. Respuesta confirmando generación de PDF
        const confirmMsg: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [
                {
                  type: "text",
                  text: "Claro, convertiré todas las rendiciones de este viaje a un PDF de forma clara para que se lo puedas enviar.",
                },
              ],
            },
          ],
        };
        setMessages((prev) => [...prev, confirmMsg]);

        await new Promise((resolve) => setTimeout(resolve, 600));

        // 3. Mostrar estado de generación
        const generatingMsgKey = generateId();
        const generatingMsgId = generateId();
        const generatingMsg: SimulatedMessage = {
          key: generatingMsgKey,
          from: "assistant",
          versions: [
            {
              id: generatingMsgId,
              parts: [{ type: "generating-pdf", status: "running" }],
            },
          ],
        };
        setMessages((prev) => [...prev, generatingMsg]);

        // Simular generación (2 segundos)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // 4. Actualizar estado a completado
        setMessages((prev) =>
          prev.map((msg) =>
            msg.key === generatingMsgKey
              ? {
                  ...msg,
                  versions: msg.versions.map((v) =>
                    v.id === generatingMsgId
                      ? {
                          ...v,
                          parts: [{ type: "generating-pdf", status: "completed" }],
                        }
                      : v
                  ),
                }
              : msg
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 300));

        // 5. Mostrar URL del PDF
        const pdfLinkMsg: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [
                { type: "text", text: "Esta es la URL de tu PDF:" },
                {
                  type: "pdf-link",
                  url: "http://localhost:3000/rendicion-tomas-tahan.html",
                },
              ],
            },
          ],
        };
        setMessages((prev) => [...prev, pdfLinkMsg]);

        await new Promise((resolve) => setTimeout(resolve, 500));

        // 6. Pregunta sobre WhatsApp
        const whatsappMsg: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [
                {
                  type: "text",
                  text: "¿Te gustaría que busque su número de teléfono y se lo envíe por WhatsApp?",
                },
              ],
            },
          ],
        };
        setMessages((prev) => [...prev, whatsappMsg]);
      } else {
        // === FLUJO DE BÚSQUEDA DE RENDICIONES ===

        // 2. Primera respuesta del asistente
        const assistantMsg1: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [
                {
                  type: "text",
                  text: "Perfecto! No hay problema, déjame buscar en la base de datos a ver qué encuentro.",
                },
              ],
            },
          ],
        };
        setMessages((prev) => [...prev, assistantMsg1]);

        await new Promise((resolve) => setTimeout(resolve, 1600));

        // 3. Mostrar estado de búsqueda
        const searchingMsgKey = generateId();
        const searchingMsgId = generateId();
        const searchingMsg: SimulatedMessage = {
          key: searchingMsgKey,
          from: "assistant",
          versions: [
            {
              id: searchingMsgId,
              parts: [{ type: "searching", status: "running" }],
            },
          ],
        };
        setMessages((prev) => [...prev, searchingMsg]);

        // Simular búsqueda (1 segundo)
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 4. Actualizar estado de búsqueda a completado
        setMessages((prev) =>
          prev.map((msg) =>
            msg.key === searchingMsgKey
              ? {
                  ...msg,
                  versions: msg.versions.map((v) =>
                    v.id === searchingMsgId
                      ? {
                          ...v,
                          parts: [{ type: "searching", status: "completed" }],
                        }
                      : v
                  ),
                }
              : msg
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 300));

        // 5. Mostrar resultados encontrados
        const resultsMsg: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [
                {
                  type: "text",
                  text: "Mira, esto es lo que he encontrado de Tomás Tahan de su último viaje hecho hace dos días:",
                },
              ],
            },
          ],
        };
        setMessages((prev) => [...prev, resultsMsg]);

        await new Promise((resolve) => setTimeout(resolve, 400));

        // 6. Mostrar componente de rendición
        const renditionMsg: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [{ type: "rendition", data: mockRenditionData }],
            },
          ],
        };
        setMessages((prev) => [...prev, renditionMsg]);

        await new Promise((resolve) => setTimeout(resolve, 500));

        // 7. Mensaje final
        const finalMsg: SimulatedMessage = {
          key: generateId(),
          from: "assistant",
          versions: [
            {
              id: generateId(),
              parts: [
                {
                  type: "text",
                  text: "¿Hay algo más en lo que te gustaría que te ayude?",
                },
              ],
            },
          ],
        };
        setMessages((prev) => [...prev, finalMsg]);
      }

      setIsProcessing(false);
    },
    [showedWhatsAppPreview]
  );

  const handleSubmit = (message: PromptInputMessage) => {
    // Type guard para acceder a las propiedades
    const messageText = ('text' in message && typeof message.text === 'string') ? message.text : '';
    const messageFiles = ('files' in message && Array.isArray(message.files)) ? message.files : undefined;

    const hasText = Boolean(messageText);
    const hasAttachments = Boolean(messageFiles?.length);

    if (!(hasText || hasAttachments) || isProcessing) {
      return;
    }

    const query = messageText || "Consulta con archivos adjuntos";
    simulateWorkflow(query);
    setInput("");
  };

  // Función para enviar el mensaje por WhatsApp
  const handleSendWhatsApp = useCallback(async () => {
    setIsProcessing(true);

    // 1. Mostrar estado de envío
    const sendingMsgKey = generateId();
    const sendingMsgId = generateId();
    const sendingMsg: SimulatedMessage = {
      key: sendingMsgKey,
      from: "assistant",
      versions: [
        {
          id: sendingMsgId,
          parts: [{ type: "sending-whatsapp", status: "running" }],
        },
      ],
    };
    setMessages((prev) => [...prev, sendingMsg]);

    // Simular envío (1 segundo)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 2. Actualizar a completado
    setMessages((prev) =>
      prev.map((msg) =>
        msg.key === sendingMsgKey
          ? {
              ...msg,
              versions: msg.versions.map((v) =>
                v.id === sendingMsgId
                  ? {
                      ...v,
                      parts: [{ type: "sending-whatsapp", status: "completed" }],
                    }
                  : v
              ),
            }
          : msg
      )
    );

    setIsProcessing(false);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
            <IconWallet className="size-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Asistente de Gastos</h3>
            <p className="text-xs text-muted-foreground">
              Siempre disponible para tus reportes THN.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-auto">
        <Conversation className="flex-1">
          <ConversationContent>
            {shouldShowQuickActions && (
              <div className="space-y-4 bg-muted/20 px-4 py-4">
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-sm text-muted-foreground">
                    Soy el agente de THN Gastos. Puedo ayudarte a encontrar
                    rendiciones, cargar comprobantes o solucionar cualquier duda
                    respecto a las rendiciones.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-medium uppercase text-muted-foreground">
                    Acciones rápidas
                  </h4>
                  <div className="space-y-2">
                    {expensesQuickActions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        className="flex w-full items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:border-amber-500/40 hover:bg-amber-500/5"
                        onClick={() => {
                          setInput(action.prompt || action.title);
                        }}
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
                          <action.icon className="size-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{action.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {messages.map(({ versions, ...message }) => {
              const isAssistant = message.from === "assistant";
              return (
                <MessageBranch defaultBranch={0} key={message.key}>
                  <MessageBranchContent>
                    {versions.map((version) => (
                      <div key={version.id} className="group/message relative">
                        {version.parts.map((part, i) => {
                          switch (part.type) {
                            case "text":
                              return (
                                <Fragment key={`${version.id}-${i}`}>
                                  <Message from={message.from}>
                                    <MessageContent>
                                      <MessageResponse>{part.text}</MessageResponse>
                                    </MessageContent>
                                  </Message>
                                  {isAssistant && (
                                    <Actions className="absolute bottom-2 right-[40px] opacity-0 transition-opacity group-hover/message:opacity-100">
                                      <Action
                                        label="Copiar"
                                        onClick={() => {
                                          void navigator.clipboard.writeText(
                                            part.text
                                          );
                                        }}
                                        tooltip="Copiar"
                                      >
                                        <CopyIcon className="size-3" />
                                      </Action>
                                    </Actions>
                                  )}
                                </Fragment>
                              );

                            case "searching":
                              return (
                                <Message
                                  key={`${version.id}-${i}`}
                                  from="assistant"
                                >
                                  <MessageContent className="flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                                      <DatabaseIcon className="size-4 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">
                                          {part.status === "running"
                                            ? "Buscando en la base de datos..."
                                            : "Búsqueda completada"}
                                        </span>
                                        {part.status === "running" && (
                                          <Loader size={14} />
                                        )}
                                        {part.status === "completed" && (
                                          <span className="text-green-600 text-xs">
                                            ✓
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </MessageContent>
                                </Message>
                              );

                            case "rendition":
                              return (
                                <div key={`${version.id}-${i}`} className="px-4">
                                  <ExpenseRenditionCard data={part.data} />
                                </div>
                              );

                            case "generating-pdf":
                              return (
                                <Message
                                  key={`${version.id}-${i}`}
                                  from="assistant"
                                >
                                  <MessageContent className="flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                                      <FileTextIcon className="size-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">
                                          {part.status === "running"
                                            ? "Generando PDF..."
                                            : "PDF generado exitosamente"}
                                        </span>
                                        {part.status === "running" && (
                                          <Loader size={14} />
                                        )}
                                        {part.status === "completed" && (
                                          <span className="text-green-600 text-xs">
                                            ✓
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </MessageContent>
                                </Message>
                              );

                            case "pdf-link":
                              return (
                                <div
                                  key={`${version.id}-${i}`}
                                  className="mx-4 my-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                                      <FileTextIcon className="size-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="mb-1 font-medium text-sm">
                                        Rendición - Tomás Tahan.pdf
                                      </p>
                                      <a
                                        href={part.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-blue-600 text-xs transition-colors hover:text-blue-700 hover:underline"
                                      >
                                        <ExternalLinkIcon className="size-3" />
                                        {part.url}
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              );

                            case "searching-phone":
                              return (
                                <Message
                                  key={`${version.id}-${i}`}
                                  from="assistant"
                                >
                                  <MessageContent className="flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-green-500/10">
                                      <PhoneIcon className="size-4 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">
                                          {part.status === "running"
                                            ? "Buscando número de teléfono..."
                                            : "Número encontrado"}
                                        </span>
                                        {part.status === "running" && (
                                          <Loader size={14} />
                                        )}
                                        {part.status === "completed" && (
                                          <span className="text-green-600 text-xs">
                                            ✓
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </MessageContent>
                                </Message>
                              );

                            case "whatsapp-preview":
                              return (
                                <div
                                  key={`${version.id}-${i}`}
                                  className="mx-4 my-2 space-y-3"
                                >
                                  {/* WhatsApp Preview Card */}
                                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                                    <div className="mb-3 flex items-center gap-2">
                                      <MessageSquareIcon className="size-4 text-green-600" />
                                      <span className="font-medium text-sm">
                                        Vista previa del mensaje
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="ml-auto bg-green-500/10 text-green-700 border-green-200"
                                      >
                                        WhatsApp
                                      </Badge>
                                    </div>

                                    <div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
                                      <PhoneIcon className="size-3" />
                                      <span>Para: {part.phone}</span>
                                    </div>

                                    {/* Mensaje simulado estilo WhatsApp */}
                                    <div className="rounded-lg bg-white p-3 shadow-sm">
                                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                                        {part.message}
                                      </pre>
                                    </div>
                                  </div>

                                  {/* Botones de acción */}
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        console.log("Envío cancelado");
                                      }}
                                    >
                                      <XIcon className="mr-1.5 size-3.5" />
                                      Cancelar
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={handleSendWhatsApp}
                                      disabled={isProcessing}
                                    >
                                      <SendIcon className="mr-1.5 size-3.5" />
                                      Enviar por WhatsApp
                                    </Button>
                                  </div>
                                </div>
                              );

                            case "sending-whatsapp":
                              return (
                                <Message
                                  key={`${version.id}-${i}`}
                                  from="assistant"
                                >
                                  <MessageContent className="flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-green-500/10">
                                      <SendIcon className="size-4 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">
                                          {part.status === "running"
                                            ? "Enviando mensaje..."
                                            : "Mensaje enviado con éxito"}
                                        </span>
                                        {part.status === "running" && (
                                          <Loader size={14} />
                                        )}
                                        {part.status === "completed" && (
                                          <span className="text-green-600 text-xs">
                                            ✓
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </MessageContent>
                                </Message>
                              );

                            default:
                              return null;
                          }
                        })}
                      </div>
                    ))}
                  </MessageBranchContent>
                  {versions.length > 1 && (
                    <MessageBranchSelector from={message.from}>
                      <MessageBranchPrevious />
                      <MessageBranchPage />
                      <MessageBranchNext />
                    </MessageBranchSelector>
                  )}
                </MessageBranch>
              );
            })}
          </ConversationContent>
        </Conversation>
      </div>

      <div className="border-t p-3">
        <PromptInput
          className="w-full"
          globalDrop
          multiple
          onSubmit={handleSubmit}
        >
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => (
                <PromptInputAttachment data={attachment} key={attachment.id} />
              )}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe cómo quieres que te ayude con tus gastos…"
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit
              disabled={isProcessing}
              status={isProcessing ? "submitted" : "ready"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
