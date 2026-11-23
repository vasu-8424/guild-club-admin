"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/header";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  CheckSquare, 
  Square,
  Sparkles,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Tag,
  CheckCircle2,
  X
} from "lucide-react";
import Link from "next/link";
import { Product, Category } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk Modal state
  const [bulkModal, setBulkModal] = useState<"stock" | "category" | null>(null);
  const [bulkStockVal, setBulkStockVal] = useState<number>(50);
  const [bulkCategoryVal, setBulkCategoryVal] = useState<string>("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory) params.append("category_id", selectedCategory);
      if (lowStockOnly) params.append("low_stock", "true");

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.flat) {
        setCategories(data.flat);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!confirm(`Delete product "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const handleBulkSubmit = async () => {
    if (selectedIds.length === 0) return;
    setBulkSubmitting(true);
    try {
      const payload: any = {
        action: bulkModal === "stock" ? "update_stock" : "reassign_category",
        productIds: selectedIds,
      };

      if (bulkModal === "stock") {
        payload.stockQuantity = bulkStockVal;
      } else {
        payload.categoryId = bulkCategoryVal;
      }

      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setBulkModal(null);
        setSelectedIds([]);
        fetchProducts();
      } else {
        const d = await res.json();
        alert(d.error || "Bulk update failed");
      }
    } catch (err: any) {
      alert("Bulk error: " + err.message);
    } finally {
      setBulkSubmitting(false);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const targetProducts =
      selectedIds.length > 0 ? products.filter((p) => selectedIds.includes(p.id)) : products;

    if (targetProducts.length === 0) {
      alert("No products to export.");
      return;
    }

    const headers = [
      "ID",
      "Title",
      "Price",
      "Original Price",
      "Discount %",
      "Stock",
      "Educational Type",
      "Min Age",
      "Max Age",
      "Material",
    ];

    const rows = targetProducts.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      p.price,
      p.original_price || "",
      p.discount_percentage || 0,
      p.stock_quantity,
      p.educational_type || "",
      p.min_age || "",
      p.max_age || "",
      `"${(p.material || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `guildclub_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert("CSV file must have a header row and at least one data row.");
          return;
        }

        const dataRows = lines.slice(1);
        const parsedProducts = dataRows.map((line) => {
          // Basic CSV quote-aware regex split
          const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
          const cleanParts = parts.map((p) => p.replace(/^"|"$/g, "").trim());
          return {
            id: cleanParts[0] || undefined,
            title: cleanParts[1] || "Untitled Product",
            price: Number(cleanParts[2]) || 0,
            original_price: cleanParts[3] ? Number(cleanParts[3]) : undefined,
            discount_percentage: cleanParts[4] ? Number(cleanParts[4]) : 0,
            stock_quantity: Number(cleanParts[5]) || 0,
            educational_type: cleanParts[6] || "STEM",
            min_age: Number(cleanParts[7]) || 3,
            max_age: Number(cleanParts[8]) || 12,
            material: cleanParts[9] || "Eco Wood & BPA-Free Polymer",
          };
        });

        const res = await fetch("/api/products/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: parsedProducts }),
        });

        const d = await res.json();
        if (res.ok) {
          alert(`Successfully imported/updated ${d.importedCount} products!`);
          fetchProducts();
        } else {
          alert("Import error: " + (d.error || "Failed to import"));
        }
      } catch (err: any) {
        alert("Failed to parse CSV file: " + err.message);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  return (
    <div className="flex flex-col min-h-full">
      <AdminHeader
        title="Products Catalog & Inventory"
        subtitle="Manage store SKUs, safety certifications, stock levels & multi-image assets"
        actionButton={{
          label: "New Product",
          href: "/products/new",
          icon: Plus,
        }}
      />

      <div className="p-6 space-y-4">
        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </form>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent_id ? `— ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Low Stock Toggle */}
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                lowStockOnly
                  ? "bg-red-500/15 border-red-500/30 text-red-400"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock (≤ 10)</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </label>
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Bulk Action Bar (When items selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-2.5 px-4 rounded-lg text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{selectedIds.length} products selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkModal("stock")}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-semibold transition-colors"
              >
                Bulk Stock Update
              </button>
              <button
                onClick={() => setBulkModal("category")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
              >
                Bulk Reassign Category
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <button onClick={toggleSelectAll} className="p-0.5 text-slate-400">
                      {selectedIds.length > 0 && selectedIds.length === products.length ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-4">Product Details</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Price & Discount</th>
                  <th className="py-2.5 px-4">Stock Level</th>
                  <th className="py-2.5 px-4">Badges / Flags</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {loading ? "Loading products..." : "No matching products found."}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const isSelected = selectedIds.includes(product.id);
                    const isLow = (product.stock_quantity ?? 0) <= 10;
                    const catIdentifier = (product as any).category_id || (product as any).category_slug;
                    const matchedCat =
                      (product as any).category ||
                      (product as any).categories ||
                      categories.find((c) => c.id === catIdentifier || c.slug === catIdentifier);
                    const catName = matchedCat?.name || "Unassigned";

                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isSelected ? "bg-amber-500/5" : ""
                        }`}
                      >
                        <td className="py-3 px-3">
                          <button
                            onClick={() => toggleSelectOne(product.id)}
                            className="p-0.5 text-slate-400 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Title & Thumbnail */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                              <Package className="w-5 h-5 text-slate-600" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/products/${product.id}`}
                                className="font-semibold text-slate-100 hover:text-amber-400 truncate block max-w-sm"
                              >
                                {product.title}
                              </Link>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>Ages {product.min_age}-{product.max_age} Yrs</span>
                                <span>•</span>
                                <span className="font-mono text-slate-400">ID: {product.id.slice(0, 8)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                              catName === "Unassigned"
                                ? "bg-slate-800/80 border-slate-700 text-slate-400"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                            }`}
                          >
                            <Layers className="w-3 h-3 text-amber-400" />
                            {catName}
                          </span>
                        </td>

                        {/* Price & Discount */}
                        <td className="py-3 px-4">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-white">
                              {formatCurrency(product.price)}
                            </span>
                            {product.original_price && product.original_price > product.price && (
                              <span className="text-[11px] text-slate-500 line-through">
                                {formatCurrency(product.original_price)}
                              </span>
                            )}
                          </div>
                          {product.discount_percentage ? (
                            <span className="text-[10px] font-semibold text-emerald-400">
                              {product.discount_percentage}% OFF
                            </span>
                          ) : null}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              isLow
                                ? "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isLow ? "bg-red-500" : "bg-emerald-500"}`} />
                            {product.stock_quantity} units
                          </span>
                        </td>

                        {/* Badges */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {product.is_trending && (
                              <span className="px-1.5 py-0.2 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded text-[9px] font-semibold">
                                Trending
                              </span>
                            )}
                            {product.is_best_seller && (
                              <span className="px-1.5 py-0.2 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded text-[9px] font-semibold">
                                Best Seller
                              </span>
                            )}
                            {product.educational_type && (
                              <span className="px-1.5 py-0.2 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded text-[9px] font-semibold">
                                {product.educational_type}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/products/${product.id}`}
                              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                              title="Edit & Detail Page Content"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.title)}
                              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bulk Stock / Category Modal */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              {bulkModal === "stock" ? "Bulk Update Stock Quantity" : "Bulk Reassign Category"}
            </h3>
            <p className="text-xs text-slate-400">
              Applying change to {selectedIds.length} selected products.
            </p>

            {bulkModal === "stock" ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={bulkStockVal}
                  onChange={(e) => setBulkStockVal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Category
                </label>
                <select
                  value={bulkCategoryVal}
                  onChange={(e) => setBulkCategoryVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setBulkModal(null)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={bulkSubmitting}
                className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                {bulkSubmitting ? "Applying..." : "Apply to Selected"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
