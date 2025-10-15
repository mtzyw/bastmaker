import { getServiceRoleClient } from "@/lib/supabase/admin";
import { EffectsPageClient } from "./ClientPage";

async function getEffects() {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("video_effect_templates")
    .select("*") // Select all fields for editing
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[EffectsPage] Failed to fetch effects:", error);
    return [];
  }
  return data;
}

const EffectsPage = async () => {
  const effects = await getEffects();

  return <EffectsPageClient initialEffects={effects} />;
};

export default EffectsPage;