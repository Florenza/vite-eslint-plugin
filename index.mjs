import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Worker } from 'worker_threads'
// import debug0 from "debug";
import { normalizePath } from 'vite'
import { createFilter } from '@rollup/pluginutils'

// const debug = debug0("eslint");

export default function eslintPlugin(options = {}) {
  const { eslintOptions = {}, formatter } = options
  options.exclude = options.exclude
    ? [...options.exclude, '**/node_modules/**']
    : ['**/node_modules/**']
  options.formatter = options.formatter || 'stylish'
  let worker // Don't initialize worker for builds
  const errors = []
  let filter
  return {
    name: 'vite-plugin-eslint',
    buildStart() {
      filter = createFilter(options.include, options.exclude)
    },
    async transform(_code, id) {
      const path = normalizePath(id)
      if (!worker) {
        const customFormatter = typeof formatter === 'function'
        worker = new Worker(
          resolve(dirname(fileURLToPath(import.meta.url)), './worker.cjs'),
          {
            workerData: {
              options: { cache: true, ...eslintOptions },
              formatter: typeof formatter === 'string' ? formatter : undefined,
              customFormatter
            }
          }
        )
        worker.on('message', async (error) => {
          errors.push(error)
        })
      }
      if (filter(path)) {
        worker.postMessage(path)
      }

      // await worker.terminate()
      return null
    },
    async buildEnd() {
      console.log('buildEnd', errors.length)
      await worker.terminate()
      if (errors.length) {
        this.error('eslint 报错')
      }
    }
  }
}
