import { ConfigTerceroForm } from '../configuracion/ConfigTerceroForm'

/**
 * ProveedorForm (Wrapper unificado de Terceros)
 * Delega al formulario maestro ConfigTerceroForm contextualizado para Proveedores.
 */
export function ProveedorForm() {
  return <ConfigTerceroForm defaultRole="proveedor" />
}

export default ProveedorForm
