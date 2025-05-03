'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import { motion } from 'framer-motion';

// Define the type for a product. Adjust fields as needed.
interface Product {
  product_id: string | number;
  name: string;
  price: number;
  image_urls: string[]; // or string, depending on your actual data
  // Add any other fields your ProductCard expects
}


export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (query) {
      fetchProducts(query, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentPage]);

  const fetchProducts = async (searchTerm: string, page: number) => {
    setLoading(true);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .ilike('name', `%${searchTerm}%`)
      .range(start, end);

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data as Product[]);
      setTotalPages(count ? Math.ceil(count / itemsPerPage) : 1);
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto mt-20 sm:mt-24 mb-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-orange-100 to-yellow-50 w-full shadow-xl p-2 mb-6"
      >
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800 text-center">
          Search Results for <span className="text-orange-500">“{query}”</span>
        </h1>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-blue-500 animate-spin blur-sm"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-blue-400 animate-spin"></div>
          </div>
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col px-4 md:px-6 lg:px-8 justify-center items-center min-h-[40vh] text-gray-500 text-center"
        >
          <img
            src="/empty-box.png"
            alt="No products"
            className="w-32 h-32 mb-4 opacity-70"
          />
          <p className="text-lg sm:text-xl font-medium">No products found.</p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 px-4 md:px-6 lg:px-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
          >
            {products.map((product) => (
              <motion.div
                key={product.product_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
