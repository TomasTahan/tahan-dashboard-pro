export type BoletaEstado =
  | "creado"
  | "procesando"
  | "espera"
  | "confirmado"
  | "cancelado";

export interface Boleta {
  boleta_id: number;
  created_at: string;
  url: string | null;
  identificador_fiscal: string | null;
  descripcion: string | null;
  moneda: string | null;
  date: string | null;
  razon_social: string | null;
  referencia: string | null;
  total: number | null;
  estado: BoletaEstado;
  user_id: string | null;
}

export interface BoletaFormData {
  identificador_fiscal: string;
  descripcion: string;
  moneda: string;
  date: string;
  razon_social: string;
  referencia: string;
  total: number;
}
