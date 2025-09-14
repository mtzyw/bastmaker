'use server';

import { ActionResult, actionResponse } from '@/lib/action-response';
import { Database } from '@/lib/supabase/types';
import { OrderWithUser } from '@/types/admin/orders';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { z } from 'zod';

const FilterSchema = z.object({
  pageIndex: z.coerce.number().default(0),
  pageSize: z.coerce.number().default(10),
  filter: z.string().optional(),
  provider: z.string().optional(),
  order_type: z.string().optional(),
  status: z.string().optional(),
});

export type GetOrdersResult = ActionResult<{
  orders: OrderWithUser[];
  totalCount: number;
}>;

const supabaseAdmin = createAdminClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getOrders(
  params: z.infer<typeof FilterSchema>
): Promise<GetOrdersResult> {
  try {
    const { pageIndex, pageSize, filter, provider, order_type, status } =
      FilterSchema.parse(params);

    const start = pageIndex * pageSize;
    const end = start + pageSize - 1;

    let query = supabaseAdmin
      .from('orders')
      .select('*, users(email, full_name)', { count: 'exact' });

    if (filter) {
      query = query.or(
        `email.ilike.%${filter}%,provider_order_id.ilike.%${filter}%`,
        {
          foreignTable: 'users',
        }
      );
    }

    if (provider) {
      query = query.eq('provider', provider);
    }
    if (order_type) {
      query = query.eq('order_type', order_type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const {
      data: orders,
      error,
      count,
    } = await query
      .range(start, end)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return actionResponse.success({
      orders: orders as unknown as OrderWithUser[],
      totalCount: count ?? 0,
    });
  } catch (error) {
    console.error('Error getting orders', error);
    const message = error instanceof Error ? error.message : 'Error getting orders';
    return actionResponse.error(message);
  }
} 