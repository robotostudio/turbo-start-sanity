import {
  PortableText,
  type PortableTextBlock,
  type PortableTextReactComponents,
} from "next-sanity";

export interface TableCellValue {
  value?: PortableTextBlock[] | null;
}

export interface TableRowValue {
  cells?: TableCellValue[] | null;
}

export interface TableBlockValue {
  headerRows?: number | null;
  rows?: TableRowValue[] | null;
}

function TableCell({
  cell,
  isHeader,
  cellComponents,
}: Readonly<{
  cell: TableCellValue;
  isHeader: boolean;
  cellComponents: Partial<PortableTextReactComponents>;
}>) {
  const CellTag = isHeader ? "th" : "td";
  return (
    <CellTag
      className="border border-border px-3 py-2 text-left align-top"
      scope={isHeader ? "col" : undefined}
    >
      {Array.isArray(cell.value) ? (
        <PortableText components={cellComponents} value={cell.value} />
      ) : null}
    </CellTag>
  );
}

function TableRow({
  row,
  isHeader,
  cellComponents,
}: Readonly<{
  row: TableRowValue;
  isHeader: boolean;
  cellComponents: Partial<PortableTextReactComponents>;
}>) {
  return (
    <tr>
      {(row.cells ?? []).map((cell, cellIndex) => (
        <TableCell
          cell={cell}
          cellComponents={cellComponents}
          isHeader={isHeader}
          key={cellIndex}
        />
      ))}
    </tr>
  );
}

export function TableBlock({
  headerRows,
  rows,
  cellComponents,
}: Readonly<
  TableBlockValue & {
    cellComponents: Partial<PortableTextReactComponents>;
  }
>) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const headerRowCount = Math.max(0, headerRows ?? 0);
  const headRows = rows.slice(0, headerRowCount);
  const bodyRows = rows.slice(headerRowCount);

  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {headRows.length > 0 ? (
          <thead>
            {headRows.map((row, rowIndex) => (
              <TableRow
                cellComponents={cellComponents}
                isHeader
                row={row}
                key={rowIndex}
              />
            ))}
          </thead>
        ) : null}
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <TableRow
              cellComponents={cellComponents}
              isHeader={false}
              row={row}
              key={rowIndex}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
