import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Worker } from "worker_threads"
// import debug0 from "debug";
import { normalizePath } from 'vite'
import { createFilter } from '@rollup/pluginutils'
import { cpus } from "node:os"
const MAX_WORKERS = cpus().length-1; // 根据CPU核心数创建线程池
let workers = [];


function createWorker(options) {
  return new Worker(resolve(dirname(fileURLToPath(import.meta.url)), './worker.cjs'), {
    workerData: { ...options },
  });
}

function initWorkerPool(options) {
  workers = Array.from({ length: MAX_WORKERS }, createWorker.bind(this,options));

}
// const debug = debug0("eslint");
const workerPromise = (filesNumber, result)=>{
  return new Promise((resolve, reject) => {
    workers.forEach(worker => {
      worker.on('message', (data) => {
        if(result.length === filesNumber ){
          resolve(result)
        }
      });
    });
  })
}
const transFormError = (result, allResultArr, transformFiles)=>{
  return new Promise((resolve, reject) => {
    const error = []
    workers.forEach(worker => {
      worker.on('message', (data) => {
        if (result.indexOf(data.path) === -1) {
          result.push(data.path);
          allResultArr.push(data)
        }
        allResultArr.forEach(item=>{
          if(item.status===500 && item.message){
            error.push(item.message)
          }
        })
        console.log(transformFiles.length, allResultArr.length, 'transform--->')
        if(transformFiles.length === allResultArr.length){
          resolve(error)
        }
      });
    });
  })
}

export default function eslintPlugin(rawOptions = {}) {
 const options = Object.assign(
    {
      lintOnStart: false,
      include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.vue', '**/*.svelte'],
      exclude: ['**/node_modules/**'],
      // Use vite cacheDir as default
      formatter: 'stylish',
      emitWarning: true,
      emitError: true,
      failOnWarning: false,
      failOnError: true,
      errorOnUnmatchedPattern: false,
    },
      rawOptions
  )
  const transformFiles = []
  const result = []
  const allResultArr =[]
  let filter
  return {
    name: 'vite-plugin-eslint',
    buildStart() {
      filter = createFilter(options.include, options.exclude)
      initWorkerPool(options);
    },
    async transform(_code, id) {
      const path = normalizePath(id)
      const that = this;
      if (filter(path)) {
        transformFiles.push(path)
        if(transformFiles.length> MAX_WORKERS) {
          const workCpu =transformFiles.length- parseInt((transformFiles.length/MAX_WORKERS).toString())*MAX_WORKERS;
          workers[workCpu].postMessage(path)
        }else{
          workers[transformFiles.length -1].postMessage(path)
        }
      }
     const data = await transFormError(result, allResultArr, transformFiles)
      data.forEach(item=>{
        this.error(item)
      })
      // await worker.terminate()
      return null
    },
    async buildEnd() {
      console.log('buildEnd')

      workers.forEach(w => w.terminate());
    }
  }
}
