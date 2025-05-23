import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export interface Product {
  product_id: string;
  name: string;
  price: number;
  image_urls: string[];
  description?: string;
  attributes?: {
    State?: string;
    [key: string]: any;
  };
}

interface ProductCardProps {
  product: Product;
  loading: boolean;
}

export default function ProductCard({ product, loading }: ProductCardProps) {
  if (loading) {
    return (
      <div className="animate-pulse bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
        <div className="w-full h-48 bg-gray-200 rounded-xl mb-5" />
        <div className="h-5 bg-gray-300 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-5 bg-gray-300 rounded w-1/2" />
      </div>
    );
  }

  // SEO: Product structured data
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image_urls?.[0] || "/placeholder.jpg",
    "description": product.description || "",
    "sku": product.product_id,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "KES",
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "url": `https://www.smartkenya.co.ke/products/${product.product_id}`,
    },
  };

  return (
    <div
      itemScope
      itemType="https://schema.org/Product"
      className="h-full"
    >
      {/* Inline JSON-LD for this product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Link
        href={`/products/${product.product_id}`}
        className="group block h-full"
        aria-label={`View details for ${product.name}`}
        itemProp="url"
      >
        <motion.div
          className="hover:shadow-md bg-white hover:rounded-md border border-transparent transition-al pb-2 px-1 overflow-hidden relative flex flex-col h-full"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
        >
          <div className="relative w-full h-36 overflow-hidden shadow-sm">
            <Image
              src={product.image_urls?.[0] || "/placeholder.jpg"}
              alt={`Buy ${product.name} in Kenya – SmartKenya`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={false}
              itemProp="image"
            />
            {product.attributes?.State && (
              <span className="absolute top-1 bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-xs font-semibold px-1 shadow-lg z-20 select-none">
                {product.attributes?.State}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-col flex-grow">
            <h3
              className="font-semibold text-gray-900 truncate"
              title={product.name}
              itemProp="name"
            >
              {product.name}
            </h3>

            <p
              className="text-sm text-gray-500 mt- line-clamp-2"
              title={product.description || "No description available"}
              itemProp="description"
            >
              {product.description || "No description available"}
            </p>

            <p
              className="mt-auto font-extrabold text-red-500 tracking-tight"
              itemProp="offers"
              itemScope
              itemType="https://schema.org/Offer"
            >
              <meta itemProp="priceCurrency" content="KES" />
              <span itemProp="price">{Number(product.price).toLocaleString()}</span>
              <meta itemProp="availability" content="https://schema.org/InStock" />
            </p>
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
