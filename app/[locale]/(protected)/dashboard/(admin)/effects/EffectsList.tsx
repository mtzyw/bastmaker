import { getServiceRoleClient } from "@/lib/supabase/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

async function getEffects() {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("video_effect_templates")
    .select("id, slug, title, provider_model, is_active, display_order, category")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[EffectsList] Failed to fetch effects:", error);
    return [];
  }
  return data;
}

export async function EffectsList() {
  const effects = await getEffects();

  if (effects.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No video effects found in the database.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Provider Model</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {effects.map((effect) => (
            <TableRow key={effect.id}>
              <TableCell className="font-medium">{effect.title}</TableCell>
              <TableCell className="text-muted-foreground">{effect.slug}</TableCell>
              <TableCell>{effect.category}</TableCell>
              <TableCell className="font-mono text-xs">{effect.provider_model}</TableCell>
              <TableCell>{effect.display_order}</TableCell>
              <TableCell>
                <Badge variant={effect.is_active ? "default" : "destructive"}>
                  {effect.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
