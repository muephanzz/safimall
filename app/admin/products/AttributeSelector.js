export default function AttributeSelector({ attributes, selected, onChange }) {
    return (
      <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Attributes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {attributes.map(attr => (
            <div key={attr.id}>
              <label className="block text-sm font-medium">{attr.name}</label>
              <input
                type="text"
                value={selected[attr.name] || ""}
                onChange={e => onChange(attr.name, e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder={attr.name}
              />
            </div>
          ))}
        </div>
      </section>
    );
  }
  