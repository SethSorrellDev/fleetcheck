import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { registerWithIdentity } from './tokens'

function res(status: number) {
  return { ok: status >= 200 && status < 300, status, headers: new Headers(), json: async () => ({}) }
}

describe('registerWithIdentity', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  it('posts the trimmed email and password to /auth/register', async () => {
    ;(fetch as any).mockResolvedValue(res(201))

    await registerWithIdentity('  new@example.com ', 'pw12345678', ' Ada ', 'Lovelace')

    const [url, init] = (fetch as any).mock.calls[0]
    expect(url).toContain('/auth/register')
    expect(JSON.parse(init.body)).toEqual({
      email: 'new@example.com',
      password: 'pw12345678',
      firstName: 'Ada',
      lastName: 'Lovelace',
    })
  })

  it('reports an existing account on 409', async () => {
    ;(fetch as any).mockResolvedValue(res(409))
    await expect(registerWithIdentity('a@b.co', 'x', 'A', 'B')).rejects.toThrow('already exists')
  })

  it('reports a rejected email or password on 400', async () => {
    ;(fetch as any).mockResolvedValue(res(400))
    await expect(registerWithIdentity('a@b.co', 'x', 'A', 'B')).rejects.toThrow('rejected')
  })

  it('reports an unreachable service when fetch throws', async () => {
    ;(fetch as any).mockRejectedValue(new Error('network'))
    await expect(registerWithIdentity('a@b.co', 'x', 'A', 'B')).rejects.toThrow('Could not reach')
  })
})
