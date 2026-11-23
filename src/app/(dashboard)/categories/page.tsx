"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/header";
import { 
  Layers, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Edit3, 
  Trash2, 
  Upload, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw,
  FolderTree,
  ImageIcon
} from "lucide-react";
import { Category } from "@/types/database";
import { getAuthHeaders } from "@/lib/supabase/client";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon_key: "toys_rounded",
    parent_id: "",
    sort_order: 0,
    color_hex: "#1E3A8A",
    banner_url: "",
    is_active: true,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
        setFlatCategories(data.flat || []);
        // Expand all parents by default
        const initExpanded: Record<string, boolean> = {};
        data.categories.forEach((cat: Category) => {
          initExpanded[cat.id] = true;
        });
        setExpanded(initExpanded);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreate = (parentId?: string) => {
    setEditingCategory(null);
    const parent = parentId ? categories.find((c) => c.id === parentId) : null;
    const defaultSort = parent
      ? (parent.subcategories?.length || 0) + 1
      : categories.length + 1;

    setFormData({
      name: "",
      slug: "",
      icon_key: parent ? parent.icon_key : "toys_rounded",
      parent_id: parentId || "",
      sort_order: defaultSort,
      color_hex: parent?.color_hex || "#1E3A8A",
      banner_url: "",
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleParentChange = (newParentId: string) => {
    const parent = newParentId ? categories.find((c) => c.id === newParentId) : null;
    const defaultSort = parent
      ? (parent.subcategories?.length || 0) + 1
      : categories.length + 1;

    setFormData((prev) => ({
      ...prev,
      parent_id: newParentId,
      sort_order: defaultSort,
      color_hex: parent?.color_hex || prev.color_hex,
      icon_key: parent ? parent.icon_key : prev.icon_key,
    }));
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon_key: cat.icon_key,
      parent_id: cat.parent_id || "",
      sort_order: cat.sort_order,
      color_hex: cat.color_hex || "#1E3A8A",
      banner_url: cat.banner_url || "",
      is_active: cat.is_active,
    });
    setModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate slug if editing new or matching slug
      slug: !editingCategory ? name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") : prev.slug,
    }));
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const updated = !cat.is_active;
      const authHeaders = await getAuthHeaders();
      await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ id: cat.id, is_active: updated }),
      });
      fetchCategories();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleMoveOrder = async (cat: Category, direction: "up" | "down", siblings: Category[]) => {
    const currentIndex = siblings.findIndex((c) => c.id === cat.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetCat = siblings[targetIndex];
    const itemsToUpdate = [
      { id: cat.id, sort_order: targetCat.sort_order },
      { id: targetCat.id, sort_order: cat.sort_order },
    ];

    try {
      const authHeaders = await getAuthHeaders();
      await fetch("/api/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ items: itemsToUpdate }),
      });
      fetchCategories();
    } catch (err) {
      console.error("Failed to reorder:", err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete category");
        return;
      }
      fetchCategories();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bucket", "categories");

      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: authHeaders,
        body: form,
      });

      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, banner_url: data.url }));
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
      const payload = {
        ...formData,
        parent_id: formData.parent_id || null,
        sort_order: Number(formData.sort_order),
      };

      const authHeaders = await getAuthHeaders();
      if (editingCategory) {
        await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ id: editingCategory.id, ...payload }),
        });
      } else {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(payload),
        });
      }

      if (formData.parent_id) {
        setExpanded((prev) => ({ ...prev, [formData.parent_id]: true }));
      }
      setModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || "Failed to save category");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <AdminHeader
        title="Category Hierarchy Manager"
        subtitle="Manage primary store sections and child development subcategories"
        actionButton={{
          label: "Add Category",
          href: "#",
          icon: Plus,
        }}
      />

      <div className="p-6 space-y-4">
        {/* Controls Toolbar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <FolderTree className="w-4 h-4 text-amber-400" />
            <span>Category Tree Structure (Total Categories: {flatCategories.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => handleOpenCreate()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Top Category
            </button>
          </div>
        </div>

        {/* Categories Tree Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 w-12">Order</th>
                  <th className="py-2.5 px-4">Category Name & Slug</th>
                  <th className="py-2.5 px-4">Icon / Accent</th>
                  <th className="py-2.5 px-4">Banner Asset</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      {loading ? "Loading categories from Supabase..." : "No categories found."}
                    </td>
                  </tr>
                ) : (
                  categories.map((parent, pIndex) => {
                    const hasSubs = parent.subcategories && parent.subcategories.length > 0;
                    const isExp = expanded[parent.id];

                    return (
                      <div key={parent.id} className="contents">
                        {/* Parent Category Row */}
                        <tr className="bg-slate-900/90 hover:bg-slate-800/50 font-medium transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMoveOrder(parent, "up", categories)}
                                disabled={pIndex === 0}
                                className="p-0.5 rounded text-slate-400 hover:text-white disabled:opacity-20"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveOrder(parent, "down", categories)}
                                disabled={pIndex === categories.length - 1}
                                className="p-0.5 rounded text-slate-400 hover:text-white disabled:opacity-20"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-mono text-slate-500 ml-1">#{parent.sort_order}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {hasSubs ? (
                                <button
                                  onClick={() => toggleExpand(parent.id)}
                                  className="p-1 rounded hover:bg-slate-800 text-slate-400"
                                >
                                  {isExp ? (
                                    <ChevronDown className="w-4 h-4 text-amber-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-6" />
                              )}
                              <div>
                                <p className="font-bold text-slate-100 flex items-center gap-1.5">
                                  {parent.name}
                                  {hasSubs && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                                      {parent.subcategories?.length} subcategories
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] font-mono text-slate-400">/{parent.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
                                style={{ backgroundColor: parent.color_hex || "#1E3A8A" }}
                              />
                              <span className="font-mono text-[11px] text-slate-300">
                                {parent.icon_key}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {parent.banner_url ? (
                              <img
                                src={parent.banner_url}
                                alt={parent.name}
                                className="w-10 h-7 object-cover rounded border border-slate-700"
                              />
                            ) : (
                              <span className="text-slate-500 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleActive(parent)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                parent.is_active
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}
                            >
                              {parent.is_active ? (
                                <>
                                  <Check className="w-3 h-3" /> Active
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3" /> Inactive
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenCreate(parent.id)}
                                title={`Add subcategory under ${parent.name}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 font-medium text-xs border border-amber-500/30 transition-colors shadow-sm"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Subcategory</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(parent)}
                                title="Edit Category"
                                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(parent.id, parent.name)}
                                title="Delete Category"
                                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Subcategories (if expanded) */}
                        {isExp &&
                          parent.subcategories?.map((sub, sIndex) => (
                            <tr
                              key={sub.id}
                              className="bg-slate-950/40 hover:bg-slate-800/30 transition-colors border-l-2 border-amber-500/40"
                            >
                              <td className="py-2.5 px-4 pl-8">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleMoveOrder(sub, "up", parent.subcategories!)}
                                    disabled={sIndex === 0}
                                    className="p-0.5 rounded text-slate-400 hover:text-white disabled:opacity-20"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleMoveOrder(sub, "down", parent.subcategories!)
                                    }
                                    disabled={sIndex === parent.subcategories!.length - 1}
                                    className="p-0.5 rounded text-slate-400 hover:text-white disabled:opacity-20"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                  <span className="font-mono text-slate-600 text-[10px]">
                                    #{sub.sort_order}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 pl-12">
                                <p className="font-medium text-slate-200">{sub.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">/{sub.slug}</p>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full border border-slate-700"
                                    style={{ backgroundColor: sub.color_hex || "#1E3A8A" }}
                                  />
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {sub.icon_key}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4">
                                {sub.banner_url ? (
                                  <img
                                    src={sub.banner_url}
                                    alt={sub.name}
                                    className="w-8 h-6 object-cover rounded border border-slate-700"
                                  />
                                ) : (
                                  <span className="text-slate-600 text-[10px]">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                <button
                                  onClick={() => handleToggleActive(sub)}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${
                                    sub.is_active
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                      : "bg-slate-800 text-slate-400 border-slate-700"
                                  }`}
                                >
                                  {sub.is_active ? "Active" : "Inactive"}
                                </button>
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEdit(sub)}
                                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(sub.id, sub.name)}
                                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </div>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  {editingCategory
                    ? `Edit ${editingCategory.parent_id ? "Subcategory" : "Category"}: ${editingCategory.name}`
                    : formData.parent_id
                    ? `Add Subcategory under "${categories.find((c) => c.id === formData.parent_id)?.name || "Parent"}"`
                    : "Create New Top-Level Category"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {formData.parent_id
                    ? "Subcategory Level (Capped at 2 levels: Top Category → Subcategory)"
                    : "Top-Level Section (Root hierarchy)"}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Speech Therapy"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Slug Identifier *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. speech-therapy"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Parent Category {formData.parent_id && <span className="text-amber-400 font-normal">(Subcategory Mode)</span>}
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => handleParentChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">None (Top-Level Category)</option>
                    {categories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          📁 {p.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {formData.parent_id
                      ? `Nesting under "${categories.find((c) => c.id === formData.parent_id)?.name}". Capped at 2 levels.`
                      : "Creates a root-level store category."}
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Vector Icon Key</label>
                  <select
                    value={formData.icon_key}
                    onChange={(e) => setFormData({ ...formData, icon_key: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value="play_schools">play_schools (Toys)</option>
                    <option value="child_development">child_development (Psychology)</option>
                    <option value="schools">schools (Education)</option>
                    <option value="interior_designing">interior_designing (Architecture)</option>
                    <option value="speech_therapy">speech_therapy (Voice)</option>
                    <option value="occupational_therapy">occupational_therapy (Accessibility)</option>
                    <option value="behavioural_therapy">behavioural_therapy (Self-improvement)</option>
                    <option value="special_education">special_education (Stories)</option>
                    <option value="stem_robotics">stem_robotics (Robotics)</option>
                    <option value="building_blocks">building_blocks (Extension)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Heraldic Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Storage Upload for Banner / Illustration Asset */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Category Image / Banner</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.banner_url}
                    onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <label className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? "Uploading..." : "Upload File"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.banner_url && (
                  <div className="mt-2">
                    <img
                      src={formData.banner_url}
                      alt="Preview"
                      className="h-16 w-32 object-cover rounded border border-slate-800"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cat_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="cat_is_active" className="text-slate-200 font-medium select-none">
                  Active (Visible on customer mobile app)
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
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
