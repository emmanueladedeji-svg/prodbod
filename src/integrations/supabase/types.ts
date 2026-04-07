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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      business_metrics: {
        Row: {
          baseline_value: number
          business_objective_id: string
          current_value: number | null
          id: string
          name: string
          target_value: number
          type: string
          unit: string
        }
        Insert: {
          baseline_value?: number
          business_objective_id: string
          current_value?: number | null
          id?: string
          name: string
          target_value?: number
          type?: string
          unit?: string
        }
        Update: {
          baseline_value?: number
          business_objective_id?: string
          current_value?: number | null
          id?: string
          name?: string
          target_value?: number
          type?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_metrics_business_objective_id_fkey"
            columns: ["business_objective_id"]
            isOneToOne: false
            referencedRelation: "business_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      business_objectives: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          objective_type: string | null
          owner_name: string | null
          product_id: string
          quarter: string
          start_date: string | null
          statement: string
          status: string | null
          target_customers: number | null
          target_percentage: number | null
          target_revenue: number | null
          target_segment_id: string | null
          target_segment_ids: string[] | null
          target_type: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          objective_type?: string | null
          owner_name?: string | null
          product_id: string
          quarter?: string
          start_date?: string | null
          statement: string
          status?: string | null
          target_customers?: number | null
          target_percentage?: number | null
          target_revenue?: number | null
          target_segment_id?: string | null
          target_segment_ids?: string[] | null
          target_type?: string | null
          updated_at?: string
          year?: number
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          objective_type?: string | null
          owner_name?: string | null
          product_id?: string
          quarter?: string
          start_date?: string | null
          statement?: string
          status?: string | null
          target_customers?: number | null
          target_percentage?: number | null
          target_revenue?: number | null
          target_segment_id?: string | null
          target_segment_ids?: string[] | null
          target_type?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_objectives_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_objectives_target_segment_id_fkey"
            columns: ["target_segment_id"]
            isOneToOne: false
            referencedRelation: "market_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_comments: {
        Row: {
          author_name: string
          content: string
          created_at: string | null
          feature_id: string
          id: string
        }
        Insert: {
          author_name: string
          content: string
          created_at?: string | null
          feature_id: string
          id?: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string | null
          feature_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_comments_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          assignee_name: string | null
          category: string
          created_at: string
          description: string
          due_date: string | null
          expected_outcome: string | null
          feature_code: string | null
          feature_type: string | null
          id: string
          name: string
          owner_name: string | null
          parent_feature_id: string | null
          priority: string
          product_objective_id: string
          progress: number | null
          release_id: string | null
          source: string
          sprint_id: string | null
          start_date: string | null
          status: string
          story_points: number | null
          success_metrics: string[] | null
          tags: string[] | null
          time_estimate: number | null
          updated_at: string
        }
        Insert: {
          assignee_name?: string | null
          category?: string
          created_at?: string
          description?: string
          due_date?: string | null
          expected_outcome?: string | null
          feature_code?: string | null
          feature_type?: string | null
          id?: string
          name: string
          owner_name?: string | null
          parent_feature_id?: string | null
          priority?: string
          product_objective_id: string
          progress?: number | null
          release_id?: string | null
          source?: string
          sprint_id?: string | null
          start_date?: string | null
          status?: string
          story_points?: number | null
          success_metrics?: string[] | null
          tags?: string[] | null
          time_estimate?: number | null
          updated_at?: string
        }
        Update: {
          assignee_name?: string | null
          category?: string
          created_at?: string
          description?: string
          due_date?: string | null
          expected_outcome?: string | null
          feature_code?: string | null
          feature_type?: string | null
          id?: string
          name?: string
          owner_name?: string | null
          parent_feature_id?: string | null
          priority?: string
          product_objective_id?: string
          progress?: number | null
          release_id?: string | null
          source?: string
          sprint_id?: string | null
          start_date?: string | null
          status?: string
          story_points?: number | null
          success_metrics?: string[] | null
          tags?: string[] | null
          time_estimate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "features_parent_feature_id_fkey"
            columns: ["parent_feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "features_product_objective_id_fkey"
            columns: ["product_objective_id"]
            isOneToOne: false
            referencedRelation: "product_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "features_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "features_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          content: string
          created_at: string
          customer: string | null
          feature_ids: string[] | null
          frequency_count: number
          id: string
          product_id: string
          segment_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          customer?: string | null
          feature_ids?: string[] | null
          frequency_count?: number
          id?: string
          product_id: string
          segment_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          customer?: string | null
          feature_ids?: string[] | null
          frequency_count?: number
          id?: string
          product_id?: string
          segment_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      market_models: {
        Row: {
          created_at: string
          currency: string
          id: string
          product_id: string
          serviceable_addressable_market: number | null
          serviceable_obtainable_market: number | null
          time_horizon_years: number
          total_addressable_market: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          product_id: string
          serviceable_addressable_market?: number | null
          serviceable_obtainable_market?: number | null
          time_horizon_years?: number
          total_addressable_market?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          product_id?: string
          serviceable_addressable_market?: number | null
          serviceable_obtainable_market?: number | null
          time_horizon_years?: number
          total_addressable_market?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_models_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      market_segments: {
        Row: {
          assumptions: string | null
          competitive_intensity: string | null
          created_at: string
          currency: string | null
          current_customers: number | null
          current_revenue: number | null
          customer_type: string | null
          geography: string | null
          id: string
          industry: string | null
          location: string | null
          measurement_type: string | null
          name: string
          notes: string | null
          population: number
          product_id: string
          purchasing_power: string | null
          sam: number | null
          sam_arpu: number | null
          sam_customers: number | null
          size: number
          som: number | null
          som_capture_pct: number | null
          status: string | null
          strategic_importance: string | null
          tam: number | null
          tam_arpu: number | null
          tam_customers: number | null
          updated_at: string
        }
        Insert: {
          assumptions?: string | null
          competitive_intensity?: string | null
          created_at?: string
          currency?: string | null
          current_customers?: number | null
          current_revenue?: number | null
          customer_type?: string | null
          geography?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          measurement_type?: string | null
          name: string
          notes?: string | null
          population?: number
          product_id: string
          purchasing_power?: string | null
          sam?: number | null
          sam_arpu?: number | null
          sam_customers?: number | null
          size?: number
          som?: number | null
          som_capture_pct?: number | null
          status?: string | null
          strategic_importance?: string | null
          tam?: number | null
          tam_arpu?: number | null
          tam_customers?: number | null
          updated_at?: string
        }
        Update: {
          assumptions?: string | null
          competitive_intensity?: string | null
          created_at?: string
          currency?: string | null
          current_customers?: number | null
          current_revenue?: number | null
          customer_type?: string | null
          geography?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          measurement_type?: string | null
          name?: string
          notes?: string | null
          population?: number
          product_id?: string
          purchasing_power?: string | null
          sam?: number | null
          sam_arpu?: number | null
          sam_customers?: number | null
          size?: number
          som?: number | null
          som_capture_pct?: number | null
          status?: string | null
          strategic_importance?: string | null
          tam?: number | null
          tam_arpu?: number | null
          tam_customers?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_segments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      market_targets: {
        Row: {
          created_at: string
          current_value: number | null
          deadline: string | null
          id: string
          metric_type: string
          name: string
          owner: string | null
          priority: string
          segment_id: string
          start_date: string | null
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          id?: string
          metric_type?: string
          name: string
          owner?: string | null
          priority?: string
          segment_id: string
          start_date?: string | null
          target_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          id?: string
          metric_type?: string
          name?: string
          owner?: string | null
          priority?: string
          segment_id?: string
          start_date?: string | null
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_targets_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "market_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          id: string
          invited_by: string | null
          invited_on: string | null
          last_active: string | null
          name: string
          organization_id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          invited_by?: string | null
          invited_on?: string | null
          last_active?: string | null
          name: string
          organization_id: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          invited_by?: string | null
          invited_on?: string | null
          last_active?: string | null
          name?: string
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_objectives: {
        Row: {
          created_at: string
          id: string
          measurement_method: string
          priority: string
          statement: string
          strategy_id: string
          success_metrics: string[] | null
          timeframe: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          measurement_method?: string
          priority?: string
          statement: string
          strategy_id: string
          success_metrics?: string[] | null
          timeframe?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          measurement_method?: string
          priority?: string
          statement?: string
          strategy_id?: string
          success_metrics?: string[] | null
          timeframe?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_objectives_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_teams: {
        Row: {
          product_id: string
          team_id: string
        }
        Insert: {
          product_id: string
          team_id: string
        }
        Update: {
          product_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_teams_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          product_manager_name: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          product_manager_name?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          product_manager_name?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          created_at: string
          feature_ids: string[] | null
          goal: string | null
          id: string
          notes: string | null
          product_id: string
          progress: number | null
          release_date: string
          release_type: string | null
          status: string | null
          target_date: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          feature_ids?: string[] | null
          goal?: string | null
          id?: string
          notes?: string | null
          product_id: string
          progress?: number | null
          release_date?: string
          release_type?: string | null
          status?: string | null
          target_date?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          feature_ids?: string[] | null
          goal?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          progress?: number | null
          release_date?: string
          release_type?: string | null
          status?: string | null
          target_date?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "releases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string | null
          end_date: string | null
          goal: string | null
          id: string
          name: string
          product_id: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          product_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          product_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sprints_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          approach: string | null
          business_objective_id: string
          created_at: string
          description: string | null
          end_date: string | null
          failure_threshold: number | null
          health_score: number | null
          hypothesis: string | null
          id: string
          leading_indicators: string[] | null
          name: string
          partial_threshold: number | null
          primary_metrics: string[] | null
          problem_statement: string | null
          rationale: string
          risk_assumptions: string[] | null
          start_date: string | null
          statement: string
          status: string | null
          updated_at: string
          value_lever: string | null
        }
        Insert: {
          approach?: string | null
          business_objective_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          failure_threshold?: number | null
          health_score?: number | null
          hypothesis?: string | null
          id?: string
          leading_indicators?: string[] | null
          name?: string
          partial_threshold?: number | null
          primary_metrics?: string[] | null
          problem_statement?: string | null
          rationale?: string
          risk_assumptions?: string[] | null
          start_date?: string | null
          statement: string
          status?: string | null
          updated_at?: string
          value_lever?: string | null
        }
        Update: {
          approach?: string | null
          business_objective_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          failure_threshold?: number | null
          health_score?: number | null
          hypothesis?: string | null
          id?: string
          leading_indicators?: string[] | null
          name?: string
          partial_threshold?: number | null
          primary_metrics?: string[] | null
          problem_statement?: string | null
          rationale?: string
          risk_assumptions?: string[] | null
          start_date?: string | null
          statement?: string
          status?: string | null
          updated_at?: string
          value_lever?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategies_business_objective_id_fkey"
            columns: ["business_objective_id"]
            isOneToOne: false
            referencedRelation: "business_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_metrics: {
        Row: {
          baseline_value: number
          created_at: string
          current_value: number
          id: string
          measurement_frequency: string | null
          metric_name: string
          strategy_id: string
          target_value: number
          updated_at: string
        }
        Insert: {
          baseline_value?: number
          created_at?: string
          current_value?: number
          id?: string
          measurement_frequency?: string | null
          metric_name: string
          strategy_id: string
          target_value?: number
          updated_at?: string
        }
        Update: {
          baseline_value?: number
          created_at?: string
          current_value?: number
          id?: string
          measurement_frequency?: string | null
          metric_name?: string
          strategy_id?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_metrics_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      task_owners: {
        Row: {
          id: string
          owner_name: string
          task_id: string
        }
        Insert: {
          id?: string
          owner_name: string
          task_id: string
        }
        Update: {
          id?: string
          owner_name?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_owners_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          dependencies: string[] | null
          description: string | null
          due_date: string | null
          feature_id: string
          id: string
          name: string
          priority: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          feature_id: string
          id?: string
          name: string
          priority?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          feature_id?: string
          id?: string
          name?: string
          priority?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar: string | null
          email: string | null
          id: string
          name: string
          role: string | null
          team_id: string
        }
        Insert: {
          avatar?: string | null
          email?: string | null
          id?: string
          name: string
          role?: string | null
          team_id: string
        }
        Update: {
          avatar?: string | null
          email?: string | null
          id?: string
          name?: string
          role?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          actual_outcome: string | null
          created_at: string
          description: string
          environment: string
          expected_outcome: string
          feature_id: string
          id: string
          preconditions: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_outcome?: string | null
          created_at?: string
          description?: string
          environment?: string
          expected_outcome?: string
          feature_id: string
          id?: string
          preconditions?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_outcome?: string | null
          created_at?: string
          description?: string
          environment?: string
          expected_outcome?: string
          feature_id?: string
          id?: string
          preconditions?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      visions: {
        Row: {
          because_of_that: string[]
          core_problem: string
          created_at: string
          differentiation: string[] | null
          every_day: string
          generated_story: string
          id: string
          long_term_impact: string
          once_upon_a_time: string
          one_day: string
          product_id: string
          statement: string
          strategic_intent: string
          success_indicators: string[]
          target_customer: string
          target_segment_ids: string[]
          time_horizon: number
          until_finally: string
          updated_at: string
          value_proposition: string
        }
        Insert: {
          because_of_that?: string[]
          core_problem?: string
          created_at?: string
          differentiation?: string[] | null
          every_day?: string
          generated_story?: string
          id?: string
          long_term_impact?: string
          once_upon_a_time?: string
          one_day?: string
          product_id: string
          statement?: string
          strategic_intent?: string
          success_indicators?: string[]
          target_customer?: string
          target_segment_ids?: string[]
          time_horizon?: number
          until_finally?: string
          updated_at?: string
          value_proposition?: string
        }
        Update: {
          because_of_that?: string[]
          core_problem?: string
          created_at?: string
          differentiation?: string[] | null
          every_day?: string
          generated_story?: string
          id?: string
          long_term_impact?: string
          once_upon_a_time?: string
          one_day?: string
          product_id?: string
          statement?: string
          strategic_intent?: string
          success_indicators?: string[]
          target_customer?: string
          target_segment_ids?: string[]
          time_horizon?: number
          until_finally?: string
          updated_at?: string
          value_proposition?: string
        }
        Relationships: [
          {
            foreignKeyName: "visions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
