export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      inventory_logs: {
        Row: {
          action: string
          batch_number: string | null
          created_at: string
          created_by: string | null
          expiration_date: string | null
          id: string
          movement_type: string | null
          new_quantity: number | null
          old_quantity: number | null
          product_id: string
          quantity_change: number | null
          reason: string | null
          remarks: string | null
          supplier: string | null
          value_change: number | null
        }
        Insert: {
          action: string
          batch_number?: string | null
          created_at?: string
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          movement_type?: string | null
          new_quantity?: number | null
          old_quantity?: number | null
          product_id: string
          quantity_change?: number | null
          reason?: string | null
          remarks?: string | null
          supplier?: string | null
          value_change?: number | null
        }
        Update: {
          action?: string
          batch_number?: string | null
          created_at?: string
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          movement_type?: string | null
          new_quantity?: number | null
          old_quantity?: number | null
          product_id?: string
          quantity_change?: number | null
          reason?: string | null
          remarks?: string | null
          supplier?: string | null
          value_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string
          created_at: string
          expiration_date: string | null
          id: string
          location: string | null
          max_threshold: number
          min_threshold: number
          name: string
          price_per_unit: number
          quantity: number
          remarks: string | null
          sku: string | null
          supplier: string | null
          supplier_id: string | null
          unit_type: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          barcode?: string | null
          brand: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          location?: string | null
          max_threshold?: number
          min_threshold?: number
          name: string
          price_per_unit?: number
          quantity?: number
          remarks?: string | null
          sku?: string | null
          supplier?: string | null
          supplier_id?: string | null
          unit_type: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          location?: string | null
          max_threshold?: number
          min_threshold?: number
          name?: string
          price_per_unit?: number
          quantity?: number
          remarks?: string | null
          sku?: string | null
          supplier?: string | null
          supplier_id?: string | null
          unit_type?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          created_at: string
          id: string
          product_id: string
          qr_data: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          qr_data: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          qr_data?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string
          id: string
          movement_type: string
          product_id: string
          quantity: number
          reason: string
          reference_number: string | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          movement_type: string
          product_id: string
          quantity: number
          reason: string
          reference_number?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          movement_type?: string
          product_id?: string
          quantity?: number
          reason?: string
          reference_number?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never