"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  Upload, 
  Star, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  IndianRupee, 
  CheckCircle2,
  FileText,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Category, Product } from "@/types/database";
import { getAuthHeaders } from "@/lib/supabase/client";

interface ProductFormProps {
  initialProduct?: Product | null;
  isEditing?: boolean;
}

export function ProductForm({ initialProduct, isEditing }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: initialProduct?.title || "",
    subtitle: initialProduct?.subtitle || "",
    description: initialProduct?.description || "",
    price: initialProduct?.price || 999,
    original_price: initialProduct?.original_price || 1499,
    discount_percentage: initialProduct?.discount_percentage || 33,
    stock_quantity: initialProduct?.stock_quantity ?? 50,
    category_id: initialProduct?.category_id || (initialProduct as any)?.category_slug || "",
    min_age: initialProduct?.min_age || 3,
    max_age: initialProduct?.max_age || 10,
    material: initialProduct?.material || "BPA-Free Recyclable Polymer & Eco Wood",
    educational_type: initialProduct?.educational_type || "STEM",
    is_trending: initialProduct?.is_trending || false,
    is_best_seller: initialProduct?.is_best_seller || false,
    is_featured: initialProduct?.is_featured || false,
    is_limited_edition: initialProduct?.is_limited_edition || false,
    safety_certification:
      initialProduct?.safety_certification ||
      "ASTM F963-17 & EN 71 European Safety Norms Certified. 100% Lead-Free & Non-Toxic.",
    image_urls: initialProduct?.image_urls || [
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=800&auto=format&fit=crop",
    ],
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.flat) setCategories(data.flat);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (initialProduct) {
      const catId = initialProduct.category_id || (initialProduct as any).category_slug;
      if (catId) {
        setFormData((prev) => ({ ...prev, category_id: catId }));
      }
    }
  }, [initialProduct]);

  const handlePriceChange = (price: number, origPrice: number) => {
    let disc = 0;
    if (origPrice > price && price > 0) {
      disc = Math.round(((origPrice - price) / origPrice) * 100);
    }
    setFormData((prev) => ({
      ...prev,
      price,
      original_price: origPrice,
      discount_percentage: disc,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const uploadedUrls: string[] = [];

      const authHeaders = await getAuthHeaders();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const form = new FormData();
        form.append("file", file);
        form.append("bucket", "products");

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: authHeaders,
          body: form,
        });

        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        } else {
          throw new Error(data.error || "Image upload failed");
        }
      }

      setFormData((prev) => ({
        ...prev,
        image_urls: [...prev.image_urls, ...uploadedUrls],
      }));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload image(s)");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }));
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= formData.image_urls.length) return;

    const updated = [...formData.image_urls];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;

    setFormData((prev) => ({ ...prev, image_urls: updated }));
  };

  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    const updated = [...formData.image_urls];
    const item = updated.splice(index, 1)[0];
    updated.unshift(item);
    setFormData((prev) => ({ ...prev, image_urls: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const url = isEditing ? `/api/products` : `/api/products`;
      const method = isEditing ? "PUT" : "POST";

      const payload = isEditing
        ? { id: initialProduct?.id, ...formData, category_slug: formData.category_id }
        : { ...formData, category_slug: formData.category_id };

      const authHeaders = await getAuthHeaders();
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      router.push("/products");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white">
              {isEditing ? `Edit Product: ${formData.title}` : "Create New Product SKU"}
            </h1>
            <p className="text-xs text-slate-400">
              Complete catalog attributes and rich detail page content
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/products"
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/10 disabled:opacity-50"
          >
            {saving ? "Saving SKU..." : isEditing ? "Update Product" : "Publish Product"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2.5 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Grid: Left Basic + Right Images/Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section 1: Basic Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Package className="w-4 h-4" />
              1. Basic Information
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Montessori Geometric Sensory Sorter Box"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Subtitle / Value Proposition
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. Fine motor skills & shape cognition for ages 2+"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Category & Subcategory *
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? `— ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Educational Type
                </label>
                <select
                  value={formData.educational_type}
                  onChange={(e) => setFormData({ ...formData, educational_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="STEM">STEM & Robotics</option>
                  <option value="Creative">Creative & Sensory</option>
                  <option value="Motor Skills">Motor Skills & Tactile</option>
                  <option value="Cognitive">Cognitive & Puzzles</option>
                  <option value="Montessori">Montessori Early Learning</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              2. Pricing & Inventory Control
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    handlePriceChange(Number(e.target.value), formData.original_price)
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Original / Strikethrough Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.original_price}
                  onChange={(e) =>
                    handlePriceChange(formData.price, Number(e.target.value))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Stock Quantity (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.stock_quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, stock_quantity: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Calculated Customer Discount:</span>
              <span className="font-bold text-emerald-400">
                {formData.discount_percentage}% OFF
              </span>
            </div>
          </div>

          {/* Section 3: Dedicated "Product Detail Page Content" Editor */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                3. Dedicated Mobile Detail Page Rich Content
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Controls the descriptive copy, safety credentials, and specs displayed to parents on the Product Detail screen.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Comprehensive Description
              </label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed explanation of product benefits, developmental milestones targeted, and usage..."
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Safety & Certification Compliance Text
              </label>
              <input
                type="text"
                value={formData.safety_certification}
                onChange={(e) =>
                  setFormData({ ...formData, safety_certification: e.target.value })
                }
                placeholder="e.g. BIS IS-9873, ASTM F963 & EN-71 Non-Toxic Certified"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Primary Materials Breakdown
                </label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="e.g. Solid Beechwood & Food-Grade Silicone"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Min Age (Yrs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    value={formData.min_age}
                    onChange={(e) =>
                      setFormData({ ...formData, min_age: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Max Age (Yrs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={formData.max_age}
                    onChange={(e) =>
                      setFormData({ ...formData, max_age: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Multi-Image Manager & Badges */}
        <div className="space-y-5">
          {/* Multi-Image Storage Manager */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Multi-Image Assets
              </h2>
              <label className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold cursor-pointer flex items-center gap-1 shadow-sm">
                <Upload className="w-3 h-3" />
                <span>{uploading ? "Uploading..." : "Add Images"}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={uploading}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-[11px] text-slate-400">
              Drag or use arrows to reorder gallery. First image acts as the primary catalog thumbnail.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {formData.image_urls.map((url, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={url}
                      alt={`Product image ${idx + 1}`}
                      className="w-12 h-12 object-cover rounded border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        {idx === 0 ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase border border-amber-500/30">
                            Primary
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => setAsPrimary(idx)}
                        title="Make Primary Image"
                        className="p-1 text-slate-400 hover:text-amber-400"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => moveImage(idx, "left")}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(idx, "right")}
                      disabled={idx === formData.image_urls.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges & Merchandising Flags */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Merchandising Badges
            </h2>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_trending}
                  onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-slate-200">Trending Now 🔥</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_best_seller}
                  onChange={(e) => setFormData({ ...formData, is_best_seller: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-slate-200">Best Seller ⭐</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-slate-200">Featured on Home Spotlight ✨</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_limited_edition}
                  onChange={(e) =>
                    setFormData({ ...formData, is_limited_edition: e.target.checked })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-red-500 focus:ring-red-500"
                />
                <span className="text-slate-200">Limited Edition / Collector 🏷️</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
