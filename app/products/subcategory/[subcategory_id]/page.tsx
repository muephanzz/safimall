// /app/products/subcategory/[subcategory_id]/page.tsx
import { supabase } from "@/lib/supabaseClient";

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
      <h1 className="text-3xl font-bold mb-6">
        Products in Subcategory {subcategory_id}
      </h1>

      {products?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.product_id} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
              <h2 className="font-semibold text-lg mb-2">{product.name}</h2>
              {/* Show product image if available */}
              {product.image_urls?.[0] && (
                <img
                  src={product.image_urls[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded"
                  loading="lazy"
                />
              )}
              <p className="mt-2 font-bold text-indigo-700">${product.price}</p>
              {/* Add more product details or a link to product page */}
            </div>
          ))}
        </div>
      ) : (
        <p>No products found in this subcategory.</p>
      )}
    </main>
  );
}
