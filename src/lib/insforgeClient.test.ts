import { createClient } from '@insforge/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createInsForgeClient, getInsForgeClientConfig, InsForgeEnvError, type PublicInsForgeEnv } from './insforgeClient'

vi.mock('@insforge/sdk', () => ({
  createClient: vi.fn((config: unknown) => ({ config }))
}))

const validEnv: PublicInsForgeEnv = {
  VITE_INSFORGE_URL: 'https://gymtracker.insforge.app',
  VITE_INSFORGE_ANON_KEY: 'public-anon-key'
}

describe('insforgeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an InsForge client from the Vite public env vars', () => {
    const client = createInsForgeClient(validEnv)

    expect(createClient).toHaveBeenCalledWith({
      baseUrl: 'https://gymtracker.insforge.app',
      anonKey: 'public-anon-key'
    })
    expect(client).toEqual({
      config: {
        baseUrl: 'https://gymtracker.insforge.app',
        anonKey: 'public-anon-key'
      }
    })
  })

  it('trims configured values before passing them to the SDK', () => {
    expect(
      getInsForgeClientConfig({
        VITE_INSFORGE_URL: '  https://gymtracker.insforge.app  ',
        VITE_INSFORGE_ANON_KEY: '  public-anon-key  '
      })
    ).toEqual({
      baseUrl: 'https://gymtracker.insforge.app',
      anonKey: 'public-anon-key'
    })
  })

  it('fails safely when required public env vars are missing', () => {
    expect(() => createInsForgeClient({})).toThrow(InsForgeEnvError)
    expect(() => createInsForgeClient({})).toThrow(
      'Missing InsForge environment variables: VITE_INSFORGE_URL, VITE_INSFORGE_ANON_KEY'
    )
    expect(createClient).not.toHaveBeenCalled()
  })

  it('ignores non-public InsForge key-shaped values from the env object', () => {
    const envWithPrivateDecoys = {
      ...validEnv,
      INSFORGE_API_KEY: 'server-only-value',
      INSFORGE_ADMIN_KEY: 'server-only-value',
      INSFORGE_SERVICE_ROLE_KEY: 'server-only-value',
      VITE_INSFORGE_ADMIN_KEY: 'do-not-pass-this-to-the-sdk'
    }

    createInsForgeClient(envWithPrivateDecoys)

    expect(createClient).toHaveBeenCalledWith({
      baseUrl: 'https://gymtracker.insforge.app',
      anonKey: 'public-anon-key'
    })
  })
})
