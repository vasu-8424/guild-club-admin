import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import ws from "ws";

globalThis.WebSocket = ws;

const envContent = fs.readFileSync(".env.local", "utf-8");
let serviceKey = "";
let supabaseUrl = "";

envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
    serviceKey = trimmed.split("=")[1].trim();
  }
  if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = trimmed.split("=")[1].trim();
  }
});

const adminClient = createClient(supabaseUrl, serviceKey);

const realCategories = [
  // Top Level
  {
    id: "c1000000-0000-0000-0000-000000000001",
    name: "Play Schools",
    slug: "play-schools",
    icon_key: "toys_rounded",
    parent_id: null,
    sort_order: 1,
    color_hex: "#1E3A8A",
    banner_url: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=800&auto=format&fit=crop",
    is_active: true,
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    name: "Child Development Centers",
    slug: "child-development-centers",
    icon_key: "psychology_rounded",
    parent_id: null,
    sort_order: 2,
    color_hex: "#B91C1C",
    banner_url: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=800&auto=format&fit=crop",
    is_active: true,
  },
  {
    id: "c1000000-0000-0000-0000-000000000003",
    name: "Schools",
    slug: "schools",
    icon_key: "school_rounded",
    parent_id: null,
    sort_order: 3,
    color_hex: "#0F172A",
    banner_url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop",
    is_active: true,
  },
  {
    id: "c1000000-0000-0000-0000-000000000004",
    name: "Interior Designing",
    slug: "interior-designing",
    icon_key: "architecture_rounded",
    parent_id: null,
    sort_order: 4,
    color_hex: "#FFFFFF",
    banner_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop",
    is_active: true,
  },
  // Subcategories under Child Development Centers
  {
    id: "c2000000-0000-0000-0000-000000000001",
    name: "Speech Therapy",
    slug: "speech-therapy",
    icon_key: "record_voice_over_rounded",
    parent_id: "c1000000-0000-0000-0000-000000000002",
    sort_order: 1,
    color_hex: "#1E3A8A",
    banner_url: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=800&auto=format&fit=crop",
    is_active: true,
  },
  {
    id: "c2000000-0000-0000-0000-000000000002",
    name: "Occupational Therapy",
    slug: "occupational-therapy",
    icon_key: "accessibility_new_rounded",
    parent_id: "c1000000-0000-0000-0000-000000000002",
    sort_order: 2,
    color_hex: "#B91C1C",
    banner_url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=800&auto=format&fit=crop",
    is_active: true,
  },
  {
    id: "c2000000-0000-0000-0000-000000000003",
    name: "Behavioural Therapy",
    slug: "behavioural-therapy",
    icon_key: "psychology_alt_rounded",
    parent_id: "c1000000-0000-0000-0000-000000000002",
    sort_order: 3,
    color_hex: "#0F172A",
    banner_url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=800&auto=format&fit=crop",
    is_active: true,
  },
  {
    id: "c2000000-0000-0000-0000-000000000004",
    name: "Special Education",
    slug: "special-education",
    icon_key: "auto_stories_rounded",
    parent_id: "c1000000-0000-0000-0000-000000000002",
    sort_order: 4,
    color_hex: "#FFFFFF",
    banner_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
    is_active: true,
  },
];

async function seed() {
  console.log("Seeding categories table with real structure...");
  // Upsert parents first
  const parents = realCategories.filter(c => !c.parent_id);
  const subs = realCategories.filter(c => c.parent_id);

  console.log(`Inserting ${parents.length} parent categories...`);
  const { data: pData, error: pErr } = await adminClient.from("categories").upsert(parents, { onConflict: "id" }).select();
  if (pErr) {
    console.error("Error inserting parent categories:", pErr.message);
    process.exit(1);
  }
  console.log("Parents inserted successfully:", pData.map(p => `${p.name} (${p.slug})`));

  console.log(`Inserting ${subs.length} subcategories...`);
  const { data: sData, error: sErr } = await adminClient.from("categories").upsert(subs, { onConflict: "id" }).select();
  if (sErr) {
    console.error("Error inserting subcategories:", sErr.message);
    process.exit(1);
  }
  console.log("Subcategories inserted successfully:", sData.map(s => `${s.name} under ${s.parent_id}`));

  console.log("Seeding COMPLETE! Total categories seeded:", pData.length + sData.length);
}

seed();
