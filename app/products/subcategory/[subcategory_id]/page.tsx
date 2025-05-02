import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";

interface Props {
  params: Promise<{ subcategory_id: string }>;
}

export default async function SubcategoryPage({ params }: Props) {
  // Await params before destructuring
  const { subcategory_id } = await params;

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
        Products in Subcategory
      </h1>


      {products?.length ? (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-4 sm:gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {products.map((product) => (
            <motion.div
              key={product.product_id}
              whileHover={{ scale: 1.04, zIndex: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative"
            >
              <ProductCard product={product} loading={false} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <p>No products found in this subcategory.</p>
      )}
    </main>
  );
}
