export type WishlistStatus = 'pending' | 'to_buy' | 'to_pay' | 'done'

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: { id: string; user_id: string; name: string; created_at: string }
        Insert: { id?: string; user_id: string; name: string; created_at?: string }
        Update: { id?: string; user_id?: string; name?: string; created_at?: string }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          description: string
          amount: number
          category: string
          expense_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          amount: number
          category: string
          expense_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          category?: string
          expense_date?: string
          created_at?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number | null
          due_date: string | null
          status: WishlistStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount?: number | null
          due_date?: string | null
          status?: WishlistStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number | null
          due_date?: string | null
          status?: WishlistStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
