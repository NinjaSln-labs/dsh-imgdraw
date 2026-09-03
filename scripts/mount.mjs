/**
 * dsh-imgdraw — mount smoke test.
 *
 * Mounts the built plugin the way the harness LOADER does (cordis-plugin-loader
 * unwrapExports: `module.default ?? module`, then `ctx.plugin(...)`) and
 * verifies the wiring: the draw_image tool registers, and the two routes
 * (prefix /imgdraw, exact /imgdraw-rpc) register.
 *
 * Regression guard: the plugin default export MUST be an object with `apply`
 * (loader pitfall — a factory function default is called as the plugin body
 * and its returned `{ apply }` is silently ignored: no error, entry ACTIVE,
 * apply never runs). If apply does not run, the registrations below stay
 * empty → this test fails.
 *
 *   npm run build && node scripts/mount.mjs
 */
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'

const registrations = { tools: [], routes: [] }

const ctx = new Context()
ctx.provide('tools', {
  register: tool => {
    registrations.tools.push(tool)
    return () => {}
  },
  get: name => registrations.tools.find(tool => tool.name === name),
})
ctx.provide('webServer', {
  register: route => {
    registrations.routes.push(route)
    return () => {}
  },
})

// Apply the plugin with await for full loading.
const plugin = (await import('../lib/index.js')).default
assert.equal(typeof plugin, 'object', 'plugin must be an OBJECT, not a factory function')
assert.equal(typeof plugin.apply, 'function', 'plugin object must carry apply')

await ctx.plugin(plugin, {}).await()
// Let the ctx.inject children settle.
await new Promise(resolve => setTimeout(resolve, 50))

// Verify tool registration.
const drawImg = registrations.tools.find(t => t.name === 'draw_image')
assert.ok(drawImg, 'draw_image tool must be registered')
assert.equal(typeof drawImg.description, 'string', 'draw_image must have a description')
assert.ok(drawImg.description.length > 0, 'draw_image description must be non-empty')
assert.equal(typeof drawImg.execute, 'function', 'draw_image must have an execute function')

// Verify route registrations.
const prefixRoute = registrations.routes.find(r => r.kind === 'prefix' && r.path === '/imgdraw')
assert.ok(prefixRoute, 'prefix route /imgdraw must be registered')
assert.equal(typeof prefixRoute.handler, 'function', 'prefix route must have a handler')

const rpcRoute = registrations.routes.find(r => r.kind === 'exact' && r.path === '/imgdraw-rpc')
assert.ok(rpcRoute, 'exact route /imgdraw-rpc must be registered')
assert.equal(typeof rpcRoute.handler, 'function', 'rpc route must have a handler')

console.log('✓ mount smoke test: draw_image tool + 2 routes (prefix /imgdraw, exact /imgdraw-rpc) all registered')