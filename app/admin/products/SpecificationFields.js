export default function SpecificationFields({ specRows, onSpecChange, onAddSpecRow }) {
    return (
      <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Specifications</h2>
        {specRows.map((row, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              type="text"
              value={row.name}
              onChange={e => onSpecChange(idx, "name", e.target.value)}
              placeholder="Field Name"
              className="border rounded p-2 flex-1"
            />
            <input
              type="text"
              value={row.value}
              onChange={e => onSpecChange(idx, "value", e.target.value)}
              placeholder="Value"
              className="border rounded p-2 flex-1"
            />
          </div>
        ))}
        <button type="button" onClick={onAddSpecRow} className="btn-secondary mt-2">
          Add Row
        </button>
      </section>
    );
  }
  