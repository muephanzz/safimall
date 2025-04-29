export default function ImageUploader({ previews, onFileChange, onRemove, uploading }) {
    return (
      <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Product Images</h2>
        <input type="file" multiple accept="image/*" onChange={onFileChange} disabled={uploading} />
        <div className="flex gap-3 mt-3 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative w-24 h-24">
              <img src={src} alt="Preview" className="w-full h-full object-cover rounded" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  }
  