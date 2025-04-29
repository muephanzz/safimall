import { Edit, Trash2 } from "lucide-react";

export default function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 border flex flex-col">
      <img
        src={product.image_urls?.[0] || "/placeholder.jpg"}
        alt={product.name}
        className="w-full h-40 object-cover rounded mb-3"
      />
      <div className="flex-1">
        <h3 className="text-lg font-bold">{product.name}</h3>
        <p className="text-gray-500">{product.description}</p>
        <p className="font-bold text-indigo-700">Ksh {product.price}</p>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onEdit(product)} className="btn-secondary flex items-center gap-1">
          <Edit size={16} /> Edit
        </button>
        <button onClick={() => onDelete(product.product_id)} className="btn-danger flex items-center gap-1">
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
}
