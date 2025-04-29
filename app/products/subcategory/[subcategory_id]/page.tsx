import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";

interface Props {
  params: {
    subcategory_id: string;
  };
}

export default async function SubcategoryPage({ params }: Props) {
  const { subcategory_id } = params;

  // Fetch products for the given subcategory
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("subcategory_id", subcategory_id);

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Error loading products</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-8">
      {products?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.product_id} product={product} loading={false} />
          ))}
        </div>
      ) : (
        <p>No products found in this subcategory.</p>
      )}
    </main>
  );
}
