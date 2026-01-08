import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GenericTable from '../components/GenericTable';
import Modal from '../components/Modal';
import { Package, Eye, Edit, Trash2, Download, Upload, CheckCircle, Info } from 'lucide-react';

const Ecommerce = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);

    // Modals state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const resp = await api.get('/productos');
            if (resp.data.ok || resp.data.success) {
                const all = resp.data.data;
                const ecom = all.filter(p => p.mostrar_en_tienda);
                setProducts(all);
                setFilteredProducts(ecom);

                const cats = [...new Set(ecom.map(p => p.categoria).filter(c => c))];
                setCategories(cats);
            }
        } catch (err) {
            console.error('Error loading products:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (cat) => {
        setSelectedCategory(cat);
        const ecom = products.filter(p => p.mostrar_en_tienda);
        if (cat === 'all') {
            setFilteredProducts(ecom);
        } else {
            setFilteredProducts(ecom.filter(p => p.categoria === cat));
        }
    };

    const handleAction = (type, product) => {
        if (type === 'edit') {
            setCurrentProduct({ ...product });
            setIsEditModalOpen(true);
        } else if (type === 'view') {
            setCurrentProduct(product);
            setIsPreviewModalOpen(true);
        } else if (type === 'delete') {
            handleRemoveFromStore(product.id);
        }
    };

    const handleRemoveFromStore = async (id) => {
        if (!window.confirm('¿Desea quitar este producto de la tienda virtual?')) return;
        try {
            const product = products.find(p => p.id === id);
            await api.put(`/productos/${id}`, { ...product, mostrar_en_tienda: 0 });
            loadProducts();
        } catch (err) {
            console.error('Error removing product:', err);
        }
    };

    const handleSaveEcom = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/productos/${currentProduct.id}`, currentProduct);
            setIsEditModalOpen(false);
            loadProducts();
        } catch (err) {
            console.error('Error saving product:', err);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const resp = await api.post('/upload', formData);
            if (resp.data.success) {
                const currentImgs = currentProduct.ecommerce_imagenes || '';
                const newImgs = currentImgs ? `${currentImgs}, ${resp.data.url}` : resp.data.url;
                setCurrentProduct({ ...currentProduct, ecommerce_imagenes: newImgs });
            }
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const exportCatalog = () => {
        const ecom = products.filter(p => p.mostrar_en_tienda);
        const catalogData = ecom.map(p => ({
            id: p.id,
            nombre: p.nombre,
            referencia: p.referencia_fabrica,
            precio: p.precio1,
            descripcion: p.ecommerce_descripcion || p.descripcion,
            imagen_principal: p.imagen_url,
            imagenes: (p.ecommerce_imagenes || '').split(',').map(s => s.trim()).filter(s => s),
            categoria: p.categoria,
            stock_disponible: p.stock_actual,
            afecta_inventario: !!p.ecommerce_afecta_inventario,
            agotado: !!p.ecommerce_afecta_inventario && p.stock_actual <= 0
        }));

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(catalogData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "catalog.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const columns = [
        {
            label: 'Producto',
            key: 'nombre',
            render: (val, row) => {
                const imageUrl = row.imagen_url || (row.ecommerce_imagenes ? row.ecommerce_imagenes.split(',')[0].trim() : '');
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#f3f4f6', border: '1px solid #e5e7eb', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {imageUrl ? <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Package size={20} color="#9CA3AF" />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#1F2937' }}>{val}</strong>
                            <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>REF: {row.referencia_fabrica || '-'}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            label: 'Precio',
            key: 'precio1',
            render: (val) => <strong>${parseFloat(val).toLocaleString()}</strong>
        },
        {
            label: 'Estado',
            key: 'mostrar_en_tienda',
            render: () => (
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle size={14} /> En Tienda
                </span>
            )
        }
    ];

    return (
        <div className="ecommerce-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', marginBottom: '5px' }}>Catálogo E-commerce</h1>
                    <p style={{ color: 'var(--text-gray)' }}>Gestiona los productos visibles en tu tienda virtual.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={exportCatalog}>
                        <Download size={18} /> Exportar JSON
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label>Filtrar por categoría</label>
                        <select
                            className="form-control"
                            value={selectedCategory}
                            onChange={(e) => handleFilterChange(e.target.value)}
                        >
                            <option value="all">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', flex: 2 }}>
                        <Info size={20} />
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Los cambios realizados aquí afectan únicamente la visualización web (descripciones e imágenes extras).</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Cargando catálogo...</div>
            ) : (
                <GenericTable
                    columns={columns}
                    data={filteredProducts}
                    actions={['view', 'edit', 'delete']}
                    onAction={handleAction}
                />
            )}

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Editar Detalles E-commerce"
                footer={(
                    <>
                        <button className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSaveEcom}>Guardar Cambios</button>
                    </>
                )}
            >
                <form onSubmit={handleSaveEcom} className="ecommerce-form">
                    <div className="form-group">
                        <label>Nombre en Tienda</label>
                        <input
                            type="text"
                            className="form-control"
                            value={currentProduct?.nombre || ''}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, nombre: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Descripción Web (HTML Soportado)</label>
                        <textarea
                            className="form-control"
                            rows="4"
                            value={currentProduct?.ecommerce_descripcion || ''}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, ecommerce_descripcion: e.target.value })}
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label>Galería de Imágenes (URLs separadas por coma)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <textarea
                                className="form-control"
                                value={currentProduct?.ecommerce_imagenes || ''}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, ecommerce_imagenes: e.target.value })}
                                style={{ flex: 1 }}
                            ></textarea>
                            <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', alignSelf: 'flex-start' }}>
                                {isUploading ? '...' : <Upload size={18} />}
                                <input type="file" hidden onChange={handleImageUpload} disabled={isUploading} />
                            </label>
                        </div>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="afecta_inv"
                            checked={!!currentProduct?.ecommerce_afecta_inventario}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, ecommerce_afecta_inventario: e.target.checked ? 1 : 0 })}
                        />
                        <label htmlFor="afecta_inv">Afecta Inventario Real</label>
                    </div>
                </form>
            </Modal>

            {/* Preview Modal */}
            <Modal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Vista Previa de Producto"
            >
                {currentProduct && (
                    <div className="product-preview" style={{ display: 'flex', gap: '25px' }}>
                        <div className="preview-images" style={{ flex: 1 }}>
                            <div style={{
                                width: '100%',
                                height: '250px',
                                background: `url(${currentProduct.imagen_url || (currentProduct.ecommerce_imagenes ? currentProduct.ecommerce_imagenes.split(',')[0].trim() : '')}) center/cover no-repeat`,
                                borderRadius: '15px',
                                border: '1px solid #e5e7eb',
                                marginBottom: '15px'
                            }}></div>
                            <div className="thumbs" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                {(currentProduct.ecommerce_imagenes || '').split(',').map((img, i) => img.trim() && (
                                    <div key={i} style={{ width: '50px', height: '50px', background: `url(${img}) center/cover`, borderRadius: '8px', border: '1px solid #e5e7eb', flexShrink: 0 }}></div>
                                ))}
                            </div>
                        </div>
                        <div className="preview-info" style={{ flex: 1.5 }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 600, textTransform: 'uppercase' }}>{currentProduct.categoria || 'General'}</span>
                            <h2 style={{ fontSize: '1.5rem', margin: '5px 0' }}>{currentProduct.nombre}</h2>
                            <p style={{ color: '#6B7280', marginBottom: '15px' }}>Ref: {currentProduct.referencia_fabrica || '-'}</p>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', marginBottom: '20px' }}>
                                ${parseFloat(currentProduct.precio1).toLocaleString()}
                            </div>
                            <div className="description" dangerouslySetInnerHTML={{ __html: currentProduct.ecommerce_descripcion || currentProduct.descripcion }}></div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Ecommerce;
