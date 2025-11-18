export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app: {
        Row: {
          app_id: string
          created_at: string | null
          descripcion: string | null
          is_active: boolean | null
          nombre: string
          tipo: string | null
        }
        Insert: {
          app_id: string
          created_at?: string | null
          descripcion?: string | null
          is_active?: boolean | null
          nombre: string
          tipo?: string | null
        }
        Update: {
          app_id?: string
          created_at?: string | null
          descripcion?: string | null
          is_active?: boolean | null
          nombre?: string
          tipo?: string | null
        }
        Relationships: []
      }
      app_screen: {
        Row: {
          app_id: string
          created_at: string | null
          descripcion: string | null
          icono: string | null
          is_active: boolean | null
          is_default: boolean | null
          nombre: string
          orden: number | null
          rank: number
          ruta: string
          screen_id: string
        }
        Insert: {
          app_id: string
          created_at?: string | null
          descripcion?: string | null
          icono?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          nombre: string
          orden?: number | null
          rank?: number
          ruta: string
          screen_id: string
        }
        Update: {
          app_id?: string
          created_at?: string | null
          descripcion?: string | null
          icono?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          nombre?: string
          orden?: number | null
          rank?: number
          ruta?: string
          screen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_screen_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "app"
            referencedColumns: ["app_id"]
          },
        ]
      }
      app_screen_user: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          is_default: boolean | null
          notas: string | null
          screen_id: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          is_default?: boolean | null
          notas?: string | null
          screen_id: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          is_default?: boolean | null
          notas?: string | null
          screen_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_screen_user_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "drivers_info"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "app_screen_user_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_session_info"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "app_screen_user_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "app_screen_user_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "app_screen"
            referencedColumns: ["screen_id"]
          },
          {
            foreignKeyName: "app_screen_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "drivers_info"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "app_screen_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_session_info"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "app_screen_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      boletas: {
        Row: {
          boleta_id: number
          created_at: string
          date: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["boleta_estado"]
          identificador_fiscal: string | null
          metadata: Json
          moneda: string | null
          odoo_expense_id: number | null
          razon_social: string | null
          referencia: string | null
          total: number | null
          trip_id: string | null
          updated_at: string | null
          url: string | null
          user_id: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          boleta_id?: number
          created_at?: string
          date?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["boleta_estado"]
          identificador_fiscal?: string | null
          metadata?: Json
          moneda?: string | null
          odoo_expense_id?: number | null
          razon_social?: string | null
          referencia?: string | null
          total?: number | null
          trip_id?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          boleta_id?: number
          created_at?: string
          date?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["boleta_estado"]
          identificador_fiscal?: string | null
          metadata?: Json
          moneda?: string | null
          odoo_expense_id?: number | null
          razon_social?: string | null
          referencia?: string | null
          total?: number | null
          trip_id?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boletas_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      departamentos: {
        Row: {
          created_at: string
          departamento_id: number
          nombre: string
        }
        Insert: {
          created_at?: string
          departamento_id?: number
          nombre: string
        }
        Update: {
          created_at?: string
          departamento_id?: number
          nombre?: string
        }
        Relationships: []
      }
      empleados: {
        Row: {
          created_at: string
          empleado_id: number
          end_date: string | null
          odoo_id: number | null
          position_id: number
          start_date: string
          sucursal_id: number
          tipo_empleo: Database["public"]["Enums"]["employment_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          empleado_id?: number
          end_date?: string | null
          odoo_id?: number | null
          position_id: number
          start_date: string
          sucursal_id: number
          tipo_empleo: Database["public"]["Enums"]["employment_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          empleado_id?: number
          end_date?: string | null
          odoo_id?: number | null
          position_id?: number
          start_date?: string
          sucursal_id?: number
          tipo_empleo?: Database["public"]["Enums"]["employment_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empleados_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "empleados_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["sucursal_id"]
          },
          {
            foreignKeyName: "empleados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "drivers_info"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "empleados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_session_info"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "empleados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      position_levels: {
        Row: {
          level_id: number
          nombre: string
          rank: number
        }
        Insert: {
          level_id?: number
          nombre: string
          rank: number
        }
        Update: {
          level_id?: number
          nombre?: string
          rank?: number
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          departamento_id: number
          level_id: number
          position_id: number
          titulo: string
        }
        Insert: {
          created_at?: string
          departamento_id: number
          level_id: number
          position_id?: number
          titulo: string
        }
        Update: {
          created_at?: string
          departamento_id?: number
          level_id?: number
          position_id?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["departamento_id"]
          },
          {
            foreignKeyName: "positions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "position_levels"
            referencedColumns: ["level_id"]
          },
        ]
      }
      sucursales: {
        Row: {
          activo: boolean
          ciudad: string
          country: Database["public"]["Enums"]["paises"]
          created_at: string
          direccion: string | null
          nombre: string
          region: string | null
          sucursal_id: number
          timezone: string
        }
        Insert: {
          activo?: boolean
          ciudad: string
          country: Database["public"]["Enums"]["paises"]
          created_at?: string
          direccion?: string | null
          nombre: string
          region?: string | null
          sucursal_id?: number
          timezone?: string
        }
        Update: {
          activo?: boolean
          ciudad?: string
          country?: Database["public"]["Enums"]["paises"]
          created_at?: string
          direccion?: string | null
          nombre?: string
          region?: string | null
          sucursal_id?: number
          timezone?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          date: string
          destination: string
          driver: string
          driver_id: string | null
          end_date: string | null
          id: string
          moneda_adelantado: string | null
          monto_adelantado: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["trip_status"]
          trip_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          destination: string
          driver: string
          driver_id?: string | null
          end_date?: string | null
          id?: string
          moneda_adelantado?: string | null
          monto_adelantado?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          trip_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          destination?: string
          driver?: string
          driver_id?: string | null
          end_date?: string | null
          id?: string
          moneda_adelantado?: string | null
          monto_adelantado?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          trip_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          identificador: string | null
          is_active: boolean
          nacionalidad: Database["public"]["Enums"]["nacionalidades"] | null
          primer_apellido: string
          primer_nombre: string
          segundo_apellido: string | null
          segundo_nombre: string | null
          telefono: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          identificador?: string | null
          is_active?: boolean
          nacionalidad?: Database["public"]["Enums"]["nacionalidades"] | null
          primer_apellido: string
          primer_nombre: string
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          telefono?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          identificador?: string | null
          is_active?: boolean
          nacionalidad?: Database["public"]["Enums"]["nacionalidades"] | null
          primer_apellido?: string
          primer_nombre?: string
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          telefono?: string | null
          user_id?: string
        }
        Relationships: []
      }
      viajes: {
        Row: {
          conductor: string | null
          created_at: string
          destino: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          salida: string | null
          viaje_id: string
          viaje_numero: string | null
        }
        Insert: {
          conductor?: string | null
          created_at?: string
          destino?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          salida?: string | null
          viaje_id?: string
          viaje_numero?: string | null
        }
        Update: {
          conductor?: string | null
          created_at?: string
          destino?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          salida?: string | null
          viaje_id?: string
          viaje_numero?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      drivers_info: {
        Row: {
          cargo: string | null
          departamento_nombre: string | null
          email: string | null
          nivel_nombre: string | null
          nivel_rank: number | null
          nombre_completo: string | null
          odoo_id: number | null
          sucursal_nombre: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_session_info: {
        Row: {
          cargo: string | null
          departamento_nombre: string | null
          email: string | null
          nivel_nombre: string | null
          nivel_rank: number | null
          nombre_completo: string | null
          sucursal_nombre: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      refresh_drivers_info: { Args: never; Returns: undefined }
      refresh_user_session_info: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      boleta_estado:
        | "creado"
        | "procesando"
        | "espera"
        | "confirmado"
        | "cancelado"
      employment_type:
        | "full_time"
        | "part_time"
        | "externo"
        | "remoto"
        | "temporal"
        | "practica"
      nacionalidades:
        | "chilena"
        | "argentina"
        | "brasileña"
        | "peruana"
        | "paraguaya"
      paises: "chile" | "argentina" | "peru" | "paraguay" | "brasil"
      trip_status:
        | "planned"
        | "confirmed"
        | "pending_approval"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      boleta_estado: [
        "creado",
        "procesando",
        "espera",
        "confirmado",
        "cancelado",
      ],
      employment_type: [
        "full_time",
        "part_time",
        "externo",
        "remoto",
        "temporal",
        "practica",
      ],
      nacionalidades: [
        "chilena",
        "argentina",
        "brasileña",
        "peruana",
        "paraguaya",
      ],
      paises: ["chile", "argentina", "peru", "paraguay", "brasil"],
      trip_status: [
        "planned",
        "confirmed",
        "pending_approval",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
