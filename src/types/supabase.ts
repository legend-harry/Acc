export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string
          client_id: string
          profile_id: string
          amount: number
          category: string
          type: string
          date: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          profile_id: string
          amount: number
          category: string
          type: string
          date: string
          description?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      projects: {
        Row: {
          id: string
          client_id: string
          profile_id: string
          name: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['projects']['Row']>
      }
      ponds: {
        Row: {
          id: string
          client_id: string
          profile_id: string
          name: string
          area: number
          shrimpType: string
          farmingType: string
          targetDensity: number
          seedAmount: number
          expectedCount: number
          waterSource: string
          currentStock: number
          status: string
          created_at: string
          stockingDate: string | null
        }
        Insert: Omit<Database['public']['Tables']['ponds']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['ponds']['Insert']>
      }
      alerts: {
         Row: {
             id: string
             client_id: string
             profile_id: string
             level: string
             message: string
             pondId: string | null
             created_at: string
         }
         Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
         Update: Partial<Database['public']['Tables']['alerts']['Insert']>
      }
      budgets: {
          Row: {
              id: string
              client_id: string
              profile_id: string
              category: string
              amount: number
              projectId: string | null
          }
          Insert: Omit<Database['public']['Tables']['budgets']['Row'], 'id'> & { id?: string }
          Update: Partial<Database['public']['Tables']['budgets']['Insert']>
      }
      employees: {
          Row: {
              id: string
              client_id: string
              profile_id: string
              name: string
              role: string
              salary: number
          }
          Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id'> & { id?: string }
          Update: Partial<Database['public']['Tables']['employees']['Insert']>
      }
      attendance: {
          Row: {
              id: string
              client_id: string
              profile_id: string
              employee_id: string
              date: string
              status: string
          }
          Insert: Omit<Database['public']['Tables']['attendance']['Row'], 'id'> & { id?: string }
          Update: Partial<Database['public']['Tables']['attendance']['Insert']>
      }
    }
  }
}
