import ProductCard from "./ProductCard";

export default function ProductList({ products, loading, onEdit, onDelete }) {
  if (loading) return <div>Loading products...</div>;
  if (!products.length) return <div>No products found.</div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {products.map(product => (
        <ProductCard
          key={product.product_id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
