import api from './api'

export const getEmpresaConfig = () =>
  api.get('/configuracion/empresa').then(r => r.data)

export const updateEmpresaConfig = (dto: any) =>
  api.patch('/configuracion/empresa', dto).then(r => r.data)
