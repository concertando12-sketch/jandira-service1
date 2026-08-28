// Tipos manuais espelhando supabase/schema.sql, no mesmo formato que
// `supabase gen types typescript` geraria — incluindo `Relationships`,
// necessário para o supabase-js tipar corretamente os `.select()` com
// joins (ex: `services(name)`). Quando o projeto Supabase estiver
// conectado, dá pra substituir por tipos gerados sem quebrar nada, já
// que os nomes de tabela/coluna são os mesmos.

export type UserRole = "CLIENT" | "PROVIDER" | "ADMIN";

export type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type SuggestionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      cities: {
        Row: {
          id: string;
          name: string;
          state: string;
          country: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cities"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["cities"]["Row"]>;
        Relationships: [];
      };
      regions: {
        Row: {
          id: string;
          city_id: string;
          name: string;
          slug: string;
          latitude: number | null;
          longitude: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["regions"]["Row"]> & {
          city_id: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["regions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "regions_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      region_suggestions: {
        Row: {
          id: string;
          name: string;
          city_id: string | null;
          submitted_by: string | null;
          status: SuggestionStatus;
          created_region_id: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["region_suggestions"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["region_suggestions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "region_suggestions_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "region_suggestions_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["services"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["services"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_profiles: {
        Row: {
          id: string;
          user_id: string;
          professional_name: string;
          description: string | null;
          phone: string | null;
          whatsapp: string | null;
          profile_photo: string | null;
          city_id: string | null;
          region_id: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          service_radius_km: number | null;
          price_from: number | null;
          price_to: number | null;
          availability: string | null;
          is_verified: boolean;
          is_active: boolean;
          profile_completion: number;
          rating_avg: number;
          rating_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["provider_profiles"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["provider_profiles"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "provider_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "provider_profiles_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "provider_profiles_region_id_fkey";
            columns: ["region_id"];
            isOneToOne: false;
            referencedRelation: "regions";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_services: {
        Row: {
          id: string;
          provider_id: string;
          service_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["provider_services"]["Row"]> & {
          provider_id: string;
          service_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["provider_services"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "provider_services_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "provider_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "provider_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_regions: {
        Row: {
          id: string;
          provider_id: string;
          region_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["provider_regions"]["Row"]> & {
          provider_id: string;
          region_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["provider_regions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "provider_regions_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "provider_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "provider_regions_region_id_fkey";
            columns: ["region_id"];
            isOneToOne: false;
            referencedRelation: "regions";
            referencedColumns: ["id"];
          },
        ];
      };
      service_requests: {
        Row: {
          id: string;
          client_id: string;
          provider_id: string;
          service_id: string;
          description: string | null;
          address: string | null;
          region_id: string | null;
          city: string | null;
          latitude: number | null;
          longitude: number | null;
          status: RequestStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["service_requests"]["Row"]> & {
          client_id: string;
          provider_id: string;
          service_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_requests"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "service_requests_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_requests_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "provider_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_requests_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_requests_region_id_fkey";
            columns: ["region_id"];
            isOneToOne: false;
            referencedRelation: "regions";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          client_id: string;
          provider_id: string;
          service_request_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]> & {
          client_id: string;
          provider_id: string;
          service_request_id: string;
          rating: number;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "reviews_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "provider_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_service_request_id_fkey";
            columns: ["service_request_id"];
            isOneToOne: true;
            referencedRelation: "service_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          id: string;
          client_id: string;
          provider_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["favorites"]["Row"]> & {
          client_id: string;
          provider_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "favorites_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "provider_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_providers: {
        Args: { p_service_slug: string; p_region_id: string };
        Returns: {
          provider_id: string;
          professional_name: string;
          profile_photo: string | null;
          description: string | null;
          price_from: number | null;
          price_to: number | null;
          rating_avg: number;
          rating_count: number;
          is_verified: boolean;
          profile_completion: number;
          home_region_name: string | null;
        }[];
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      haversine_km: {
        Args: { lat1: number; lon1: number; lat2: number; lon2: number };
        Returns: number;
      };
      approve_region_suggestion: {
        Args: { p_suggestion_id: string };
        Returns: string;
      };
      reject_region_suggestion: {
        Args: { p_suggestion_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
