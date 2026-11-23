"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/header";
import { 
  Image as ImageIcon, 
  Plus, 
  Upload, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  ExternalLink,
  Sparkles,
  Smartphone,
  Layers,
  RefreshCw
} from "lucide-react";
import { Banner } from "@/types/database";

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    badge: "PREMIUM TOY SUBSCRIPTION ⚡",
    image_url: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=800&auto=format&fit=crop",
    video_url: "",
    cta_text: "Explore Library",
    cta_link: "/categories",
    display_order: 0,
    is_active: true,
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/banners");
      const data = await res.json();
      if (data.banners) {
        setBanners(data.banners);
      }
    } catch (err) {
      console.error("Failed to load banners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormData({
      title: "Guild Club Toy Library 🎁",
      subtitle: "Unlimited rotating access to premium STEM, Montessori & educational toys delivered home.",
      badge: "PREMIUM TOY SUBSCRIPTION ⚡",
      image_url: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=800&auto=format&fit=crop",
      video_url: "",
      cta_text: "Explore Library",
      cta_link: "/categories",
      display_order: banners.length + 1,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b: Banner) => {
    setEditingBanner(b);
    setFormData({
      title: b.title,
      subtitle: b.subtitle || "",
      badge: b.badge || "FEATURED",
      image_url: b.image_url,
      video_url: b.video_url || "",
      cta_text: b.cta_text || "Shop Now",
      cta_link: b.cta_link || "/categories",
      display_order: b.display_order,
      is_active: b.is_active,
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const updated = !banner.is_active;
      await fetch("/api/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: banner.id, is_active: updated }),
      });
      fetchBanners();
    } catch (err) {
      console.error("Failed to toggle banner:", err);
    }
  };

  const handleMove = async (banner: Banner, direction: "up" | "down") => {
    const currentIndex = banners.findIndex((b) => b.id === banner.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const targetBanner = banners[targetIndex];

    try {
      await fetch("/api/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: banner.id, display_order: targetBanner.display_order }),
      });
      await fetch("/api/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetBanner.id, display_order: banner.display_order }),
      });
      fetchBanners();
    } catch (err) {
      console.error("Failed to reorder banners:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hero banner?")) return;
    try {
      await fetch(`/api/banners?id=${id}`, { method: "DELETE" });
      fetchBanners();
    } catch (err: any) {
      alert("Failed to delete banner: " + err.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bucket", "banners");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, image_url: data.url }));
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await fetch("/api/banners", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingBanner.id, ...formData }),
        });
      } else {
        await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setModalOpen(false);
      fetchBanners();
    } catch (err: any) {
      alert("Failed to save banner: " + err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <AdminHeader
        title="Mobile Home Carousel & Banners"
        subtitle="Manage the hero carousel stream shown on the Guild Club customer mobile app"
        actionButton={{
          label: "New Hero Slide",
          href: "#",
          icon: Plus,
        }}
      />

      <div className="p-6 space-y-6">
        {/* Controls Toolbar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>Mobile Home Screen Hero Carousel (Live Slides: {banners.filter(b => b.is_active).length})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBanners}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Hero Slide
            </button>
          </div>
        </div>

        {/* Banners Grid with Visual Mobile Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              {loading ? "Loading banners from Supabase..." : "No banners configured yet."}
            </div>
          ) : (
            banners.map((banner, index) => (
              <div
                key={banner.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                {/* Visual Mobile App Preview Card */}
                <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Scrim Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent flex flex-col justify-end p-5">
                    {banner.badge && (
                      <span className="inline-block px-2 py-0.5 rounded bg-red-500 text-white text-[9px] font-extrabold uppercase tracking-wide w-fit mb-1.5 shadow-sm">
                        {banner.badge}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="mt-2.5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold shadow-md">
                        {banner.cta_text || "Explore Now"} →
                      </span>
                    </div>
                  </div>

                  {/* Active Badge Overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                        banner.is_active
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-slate-900/80 text-slate-400 border-slate-700"
                      }`}
                    >
                      {banner.is_active ? "Active on App" : "Hidden"}
                    </span>
                  </div>
                </div>

                {/* Banner Metadata & Admin Actions */}
                <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(banner, "up")}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(banner, "down")}
                        disabled={index === banners.length - 1}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-20"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      Slide #{banner.display_order}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Destination: {banner.cta_link}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                        banner.is_active
                          ? "bg-slate-800 text-slate-300 border-slate-700"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {banner.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(banner)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Edit Banner"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Banner Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                {editingBanner ? "Edit Hero Slide" : "Create Hero Slide"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Headline Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Guild Club Toy Library 🎁"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Subtext / Summary</label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Unlimited rotating access to premium STEM, Montessori & educational toys..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sparkle Badge Text</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. PREMIUM TOY SUBSCRIPTION ⚡"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Button CTA Text</label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="e.g. Explore Library"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Destination Route</label>
                  <input
                    type="text"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    placeholder="e.g. /categories or /search"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Poster Image Upload */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Hero Poster Image *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <label className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? "Uploading..." : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.image_url}
                      alt="Banner Preview"
                      className="h-20 w-full object-cover rounded border border-slate-800"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="banner_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="banner_is_active" className="text-slate-200 font-medium select-none">
                  Active (Streamed to customer home screen carousel)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-sm"
                >
                  {editingBanner ? "Update Slide" : "Create Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
