import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePaisDto, CreateDepartamentoDto, CreateCiudadDto, CreateComunaDto, CreateBarrioDto } from './dto/geolocalizacion.dto'

@Injectable()
export class GeolocalizacionService implements OnApplicationBootstrap {
  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.seedIfNeeded()
  }

  async seedIfNeeded() {
    const count = await this.prisma.pais.count()
    if (count === 0) {
      await this.resetToDefaults()
    }
  }

  async resetToDefaults() {
    // Clean all geo tables first
    await this.prisma.barrio.deleteMany()
    await this.prisma.comuna.deleteMany()
    await this.prisma.ciudad.deleteMany()
    await this.prisma.departamento.deleteMany()
    await this.prisma.pais.deleteMany()

    // 1. Seed Countries
    const co = await this.prisma.pais.create({
      data: { codigo: 'CO', nombre: 'Colombia', codigoDianExogena: '169', indicativoTelefonico: '57' }
    })
    const es = await this.prisma.pais.create({
      data: { codigo: 'ES', nombre: 'España', codigoDianExogena: '245', indicativoTelefonico: '34' }
    })
    const us = await this.prisma.pais.create({
      data: { codigo: 'US', nombre: 'Estados Unidos', codigoDianExogena: '249', indicativoTelefonico: '1' }
    })

    // Helper map to associate dept code to DB ID
    const deptsMap = new Map<string, number>()

    // Departments for Colombia (co.id)
    const colDepts = [
      { nombre: 'Antioquia', codigo: '05' },
      { nombre: 'Atlántico', codigo: '08' },
      { nombre: 'Bogotá D.C.', codigo: '11' },
      { nombre: 'Bolívar', codigo: '13' },
      { nombre: 'Boyacá', codigo: '15' },
      { nombre: 'Caldas', codigo: '17' },
      { nombre: 'Caquetá', codigo: '18' },
      { nombre: 'Cauca', codigo: '19' },
      { nombre: 'Cesar', codigo: '20' },
      { nombre: 'Córdoba', codigo: '23' },
      { nombre: 'Cundinamarca', codigo: '25' },
      { nombre: 'Chocó', codigo: '27' },
      { nombre: 'Huila', codigo: '41' },
      { nombre: 'La Guajira', codigo: '44' },
      { nombre: 'Magdalena', codigo: '47' },
      { nombre: 'Meta', codigo: '50' },
      { nombre: 'Nariño', codigo: '52' },
      { nombre: 'Norte de Santander', codigo: '54' },
      { nombre: 'Quindío', codigo: '63' },
      { nombre: 'Risaralda', codigo: '66' },
      { nombre: 'Santander', codigo: '68' },
      { nombre: 'Sucre', codigo: '70' },
      { nombre: 'Tolima', codigo: '73' },
      { nombre: 'Valle del Cauca', codigo: '76' },
      { nombre: 'Arauca', codigo: '81' },
      { nombre: 'Casanare', codigo: '85' },
      { nombre: 'Putumayo', codigo: '86' },
      { nombre: 'San Andrés y Providencia', codigo: '88' },
      { nombre: 'Amazonas', codigo: '91' },
      { nombre: 'Guainía', codigo: '94' },
      { nombre: 'Guaviare', codigo: '95' },
      { nombre: 'Vaupés', codigo: '97' },
      { nombre: 'Vichada', codigo: '99' }
    ]

    for (const d of colDepts) {
      const created = await this.prisma.departamento.create({
        data: { nombre: d.nombre, codigo: d.codigo, paisId: co.id }
      })
      deptsMap.set(`CO_${d.nombre}`, created.id)
    }

    // Departments for Spain and USA
    const esMadrid = await this.prisma.departamento.create({
      data: { nombre: 'Madrid', codigo: 'MAD', paisId: es.id }
    })
    deptsMap.set(`ES_Madrid`, esMadrid.id)

    const usFlorida = await this.prisma.departamento.create({
      data: { nombre: 'Florida', codigo: 'FL', paisId: us.id }
    })
    deptsMap.set(`US_Florida`, usFlorida.id)

    // Helper map to associate city name to DB ID
    const citiesMap = new Map<string, number>()

    // Seed Cities
    const colCities = [
      { nombre: 'Medellín', deptKey: 'CO_Antioquia', codigoDian: '05001' },
      { nombre: 'Envigado', deptKey: 'CO_Antioquia', codigoDian: '05266' },
      { nombre: 'Sabaneta', deptKey: 'CO_Antioquia', codigoDian: '05631' },
      { nombre: 'Itagüí', deptKey: 'CO_Antioquia', codigoDian: '05360' },
      { nombre: 'Rionegro', deptKey: 'CO_Antioquia', codigoDian: '05615' },
      { nombre: 'Bello', deptKey: 'CO_Antioquia', codigoDian: '05088' },
      { nombre: 'Barranquilla', deptKey: 'CO_Atlántico', codigoDian: '08001' },
      { nombre: 'Soledad', deptKey: 'CO_Atlántico', codigoDian: '08758' },
      { nombre: 'Bogotá D.C.', deptKey: 'CO_Bogotá D.C.', codigoDian: '11001' },
      { nombre: 'Cartagena de Indias', deptKey: 'CO_Bolívar', codigoDian: '13001' },
      { nombre: 'Tunja', deptKey: 'CO_Boyacá', codigoDian: '15001' },
      { nombre: 'Manizales', deptKey: 'CO_Caldas', codigoDian: '17001' },
      { nombre: 'Florencia', deptKey: 'CO_Caquetá', codigoDian: '18001' },
      { nombre: 'Popayán', deptKey: 'CO_Cauca', codigoDian: '19001' },
      { nombre: 'Valledupar', deptKey: 'CO_Cesar', codigoDian: '20001' },
      { nombre: 'Montería', deptKey: 'CO_Córdoba', codigoDian: '23001' },
      { nombre: 'Agua de Dios', deptKey: 'CO_Cundinamarca', codigoDian: '25001' },
      { nombre: 'Soacha', deptKey: 'CO_Cundinamarca', codigoDian: '25754' },
      { nombre: 'Chía', deptKey: 'CO_Cundinamarca', codigoDian: '25175' },
      { nombre: 'Zipaquirá', deptKey: 'CO_Cundinamarca', codigoDian: '25899' },
      { nombre: 'Facatativá', deptKey: 'CO_Cundinamarca', codigoDian: '25269' },
      { nombre: 'Quibdó', deptKey: 'CO_Chocó', codigoDian: '27001' },
      { nombre: 'Neiva', deptKey: 'CO_Huila', codigoDian: '41001' },
      { nombre: 'Riohacha', deptKey: 'CO_La Guajira', codigoDian: '44001' },
      { nombre: 'Santa Marta', deptKey: 'CO_Magdalena', codigoDian: '47001' },
      { nombre: 'Villavicencio', deptKey: 'CO_Meta', codigoDian: '50001' },
      { nombre: 'Pasto', deptKey: 'CO_Nariño', codigoDian: '52001' },
      { nombre: 'Cúcuta', deptKey: 'CO_Norte de Santander', codigoDian: '54001' },
      { nombre: 'Armenia', deptKey: 'CO_Quindío', codigoDian: '63001' },
      { nombre: 'Pereira', deptKey: 'CO_Risaralda', codigoDian: '66001' },
      { nombre: 'Bucaramanga', deptKey: 'CO_Santander', codigoDian: '68001' },
      { nombre: 'Floridablanca', deptKey: 'CO_Santander', codigoDian: '68276' },
      { nombre: 'Barrancabermeja', deptKey: 'CO_Santander', codigoDian: '68081' },
      { nombre: 'Sincelejo', deptKey: 'CO_Sucre', codigoDian: '70001' },
      { nombre: 'Ibagué', deptKey: 'CO_Tolima', codigoDian: '73001' },
      { nombre: 'Cali', deptKey: 'CO_Valle del Cauca', codigoDian: '76001' },
      { nombre: 'Palmira', deptKey: 'CO_Valle del Cauca', codigoDian: '76520' },
      { nombre: 'Buenaventura', deptKey: 'CO_Valle del Cauca', codigoDian: '76109' },
      { nombre: 'Arauca', deptKey: 'CO_Arauca', codigoDian: '81001' },
      { nombre: 'Yopal', deptKey: 'CO_Casanare', codigoDian: '85001' },
      { nombre: 'Mocoa', deptKey: 'CO_Putumayo', codigoDian: '86001' },
      { nombre: 'San Andrés', deptKey: 'CO_San Andrés y Providencia', codigoDian: '88001' },
      { nombre: 'Leticia', deptKey: 'CO_Amazonas', codigoDian: '91001' },
      { nombre: 'Inírida', deptKey: 'CO_Guainía', codigoDian: '94001' },
      { nombre: 'San José del Guaviare', deptKey: 'CO_Guaviare', codigoDian: '95001' },
      { nombre: 'Mitú', deptKey: 'CO_Vaupés', codigoDian: '97001' },
      { nombre: 'Puerto Carreño', deptKey: 'CO_Vichada', codigoDian: '99001' }
    ]

    for (const c of colCities) {
      const deptId = deptsMap.get(c.deptKey)
      if (deptId) {
        const created = await this.prisma.ciudad.create({
          data: { nombre: c.nombre, codigoDian: c.codigoDian, departamentoId: deptId }
        })
        citiesMap.set(c.nombre, created.id)
      }
    }

    const cityMadrid = await this.prisma.ciudad.create({
      data: { nombre: 'Madrid', codigoDian: '28079', departamentoId: deptsMap.get('ES_Madrid')! }
    })
    citiesMap.set('Madrid', cityMadrid.id)

    const cityMiami = await this.prisma.ciudad.create({
      data: { nombre: 'Miami', codigoDian: '12086', departamentoId: deptsMap.get('US_Florida')! }
    })
    citiesMap.set('Miami', cityMiami.id)

    // Seed Medellín Comunas
    const medId = citiesMap.get('Medellín')
    if (medId) {
      const comPob = await this.prisma.comuna.create({
        data: { nombre: 'Comuna 14 - El Poblado', ciudadId: medId }
      })
      const comLau = await this.prisma.comuna.create({
        data: { nombre: 'Comuna 11 - Laureles', ciudadId: medId }
      })
      const comBel = await this.prisma.comuna.create({
        data: { nombre: 'Comuna 16 - Belén', ciudadId: medId }
      })

      // Seed Medellín Barrios
      await this.prisma.barrio.create({ data: { nombre: 'El Poblado', ciudadId: medId, comunaId: comPob.id } })
      await this.prisma.barrio.create({ data: { nombre: 'Provenza', ciudadId: medId, comunaId: comPob.id } })
      await this.prisma.barrio.create({ data: { nombre: 'Manila', ciudadId: medId, comunaId: comPob.id } })
      await this.prisma.barrio.create({ data: { nombre: 'Laureles', ciudadId: medId, comunaId: comLau.id } })
      await this.prisma.barrio.create({ data: { nombre: 'Belén', ciudadId: medId, comunaId: comBel.id } })
    }
  }

  // Get all Geolocation State at once
  async getGeolocationState() {
    const [paises, departamentos, ciudades, comunas, barrios] = await Promise.all([
      this.prisma.pais.findMany({ orderBy: { nombre: 'asc' } }),
      this.prisma.departamento.findMany({ orderBy: { nombre: 'asc' } }),
      this.prisma.ciudad.findMany({ orderBy: { nombre: 'asc' } }),
      this.prisma.comuna.findMany({ orderBy: { nombre: 'asc' } }),
      this.prisma.barrio.findMany({ orderBy: { nombre: 'asc' } })
    ])
    return { paises, departamentos, ciudades, comunas, barrios }
  }

  // Pais CRUD
  async createPais(dto: CreatePaisDto) {
    return this.prisma.pais.create({ data: dto })
  }
  async updatePais(id: number, dto: any) {
    return this.prisma.pais.update({ where: { id }, data: dto })
  }
  async deletePais(id: number) {
    return this.prisma.pais.delete({ where: { id } })
  }

  // Departamento CRUD
  async createDepartamento(dto: CreateDepartamentoDto) {
    return this.prisma.departamento.create({ data: dto })
  }
  async updateDepartamento(id: number, dto: any) {
    return this.prisma.departamento.update({ where: { id }, data: dto })
  }
  async deleteDepartamento(id: number) {
    return this.prisma.departamento.delete({ where: { id } })
  }

  // Ciudad CRUD
  async createCiudad(dto: CreateCiudadDto) {
    return this.prisma.ciudad.create({ data: dto })
  }
  async updateCiudad(id: number, dto: any) {
    return this.prisma.ciudad.update({ where: { id }, data: dto })
  }
  async deleteCiudad(id: number) {
    return this.prisma.ciudad.delete({ where: { id } })
  }

  // Comuna CRUD
  async createComuna(dto: CreateComunaDto) {
    return this.prisma.comuna.create({ data: dto })
  }
  async updateComuna(id: number, dto: any) {
    return this.prisma.comuna.update({ where: { id }, data: dto })
  }
  async deleteComuna(id: number) {
    return this.prisma.comuna.delete({ where: { id } })
  }

  // Barrio CRUD
  async createBarrio(dto: CreateBarrioDto) {
    return this.prisma.barrio.create({ data: dto })
  }
  async updateBarrio(id: number, dto: any) {
    return this.prisma.barrio.update({ where: { id }, data: dto })
  }
  async deleteBarrio(id: number) {
    return this.prisma.barrio.delete({ where: { id } })
  }
}
