import api from '@/lib/axios'
import type {
  MasterJam,
  CreateMasterJamPayload,
  UpdateMasterJamPayload,
  FilterMasterJamParams,
} from '@/types/master-jam.types'

async function getAll(params?: FilterMasterJamParams): Promise<MasterJam[]> {
  const { data } = await api.get('/master-jam', { params })
  return data
}

async function getById(id: string): Promise<MasterJam> {
  const { data } = await api.get('/master-jam/' + id)
  return data
}

async function create(payload: CreateMasterJamPayload): Promise<MasterJam> {
  const { data } = await api.post('/master-jam', payload)
  return data
}

async function update(id: string, payload: UpdateMasterJamPayload): Promise<MasterJam> {
  const { data } = await api.patch('/master-jam/' + id, payload)
  return data
}

async function remove(id: string): Promise<void> {
  await api.delete('/master-jam/' + id)
}

export const masterJamApi = { getAll, getById, create, update, remove }
