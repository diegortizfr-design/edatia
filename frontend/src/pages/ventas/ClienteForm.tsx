import { ConfigTerceroForm } from '../configuracion/ConfigTerceroForm'

/**
 * ClienteForm (Wrapper unificado de Terceros)
 * Delega al formulario maestro ConfigTerceroForm contextualizado para Clientes.
 */
export function ClienteForm() {
  return <ConfigTerceroForm defaultRole="cliente" />
}

export default ClienteForm
