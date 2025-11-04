import { getServiceRoleClient } from "@/lib/supabase/admin";
import { ImageEffectsPageClient } from "./ClientPage";

async function getImageEffects() {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("image_effect_templates")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ImageEffectsPage] Failed to fetch effects", error);
    return [];
  }
  return data ?? [];
}

const ImageEffectsPage = async () => {
  const effects = await getImageEffects();
  return <ImageEffectsPageClient initialEffects={effects} />;
};

export default ImageEffectsPage;
