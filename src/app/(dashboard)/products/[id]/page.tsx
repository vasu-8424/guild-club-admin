"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "@/components/products/product-form";
import { Product } from "@/types/database";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products?id=${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading product details from Supabase...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-12 text-center text-xs text-red-400">
        Product not found or could not be loaded.
      </div>
    );
  }

  return (
    <div className="p-6">
      <ProductForm initialProduct={product} isEditing={true} />
    </div>
  );
}
