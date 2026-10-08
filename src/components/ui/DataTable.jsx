export default function DataTable({ columns = [], rows = [], rowKey = "id" }) {
  return (
    <div className="bg-white border rounded overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left font-medium px-4 py-3 whitespace-nowrap">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[rowKey]} className="border-b last:border-b-0 hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 whitespace-nowrap">
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
