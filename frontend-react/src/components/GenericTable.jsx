import React from 'react';
import { Edit2, Trash2, Eye } from 'lucide-react';

const GenericTable = ({ columns, data, actions, onAction }) => {
    return (
        <div className="table-container">
            <table className="glass-table">
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx}>{col.label}</th>
                        ))}
                        {actions && <th>Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx}>
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="actions-cell">
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {actions.includes('view') && (
                                                <button className="btn-icon" onClick={() => onAction('view', row)}><Eye size={18} /></button>
                                            )}
                                            {actions.includes('edit') && (
                                                <button className="btn-icon" onClick={() => onAction('edit', row)}><Edit2 size={18} /></button>
                                            )}
                                            {actions.includes('delete') && (
                                                <button className="btn-icon" onClick={() => onAction('delete', row)} style={{ color: '#EF4444' }}><Trash2 size={18} /></button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '40px' }}>
                                No se encontraron registros.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default GenericTable;
