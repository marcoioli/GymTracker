import { createClient, type InsForgeClient } from '@insforge/sdk'

export type PublicInsForgeEnv = {
  readonly [key: string]: string | undefined
  readonly VITE_INSFORGE_URL?: string
  readonly VITE_INSFORGE_ANON_KEY?: string
}

export type InsForgeClientConfig = {
  baseUrl: string
  anonKey: string
}

export class InsForgeEnvError extends Error {
  constructor(missingVariables: string[]) {
    super(`Missing InsForge environment variable${missingVariables.length === 1 ? '' : 's'}: ${missingVariables.join(', ')}`)
    this.name = 'InsForgeEnvError'
  }
}

const readRequiredEnv = (value: string | undefined, name: string): string => {
  const normalized = value?.trim()

  if (!normalized) {
    throw new InsForgeEnvError([name])
  }

  return normalized
}

export const getInsForgeClientConfig = (env: PublicInsForgeEnv = import.meta.env): InsForgeClientConfig => {
  const requiredVariables: Array<readonly [name: string, value: string | undefined]> = [
    ['VITE_INSFORGE_URL', env.VITE_INSFORGE_URL],
    ['VITE_INSFORGE_ANON_KEY', env.VITE_INSFORGE_ANON_KEY]
  ]

  const missingVariables = requiredVariables.filter(([, value]) => !value?.trim()).map(([name]) => name)

  if (missingVariables.length > 0) {
    throw new InsForgeEnvError(missingVariables)
  }

  return {
    baseUrl: readRequiredEnv(env.VITE_INSFORGE_URL, 'VITE_INSFORGE_URL'),
    anonKey: readRequiredEnv(env.VITE_INSFORGE_ANON_KEY, 'VITE_INSFORGE_ANON_KEY')
  }
}

export const createInsForgeClient = (env: PublicInsForgeEnv = import.meta.env): InsForgeClient => {
  return createClient(getInsForgeClientConfig(env))
}
