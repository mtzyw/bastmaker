import { Tables } from '@/lib/supabase/types';

export type OrderWithUser = Tables<'orders'> & {
  users: {
    email: string;
    full_name: string | null;
  } | null;
}; 