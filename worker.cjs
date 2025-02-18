const { workerData, parentPort } = require('worker_threads')
const fs = require('fs').promises
const {
  FlatESLint,
  LegacyESLint,
  shouldUseFlatConfig
} = require('eslint/use-at-your-own-risk')

let eslint

const initPromise = shouldUseFlatConfig().then((useFlatConfig) => {
  if (useFlatConfig) {
    eslint = new FlatESLint(workerData.options)
  } else {
    eslint = new LegacyESLint(workerData.options)
  }
})

const formatterPromise = workerData.formatter
  ? initPromise.then(() => eslint.loadFormatter(workerData.formatter))
  : undefined

parentPort.on('message', async (path) => {
  if (!eslint) await initPromise
  eslint
    .isPathIgnored(path)
    .then(async (ignored) => {
      if (ignored) return
      const [report] = await eslint.lintFiles(path)
      if (!report) return // Can be empty with errorOnUnmatchedPattern: false
      if (report.output !== undefined) await fs.writeFile(path, report.output)
      if (report.messages.length === 0) return
      if (formatterPromise) {
        const formatter = await formatterPromise
        parentPort.postMessage(await formatter.format([report]))
        console.log(await formatter.format([report]))
      } else if (workerData.customFormatter) {
        parentPort.postMessage(report)
      } else {
        report.messages.forEach((m) => {
          const prettyPath = path.slice(path.indexOf('/src/') + 1)
          const location = `${prettyPath}(${m.line},${m.column})`
          const rule = m.ruleId ? ` ${m.ruleId}` : ''
          const error = `
            ${location}: ${prettyPath},
            rule: ${rule},
          `
          parentPort.postMessage(error)
        })
      }
    })
    .catch((e) => {
      if (e.messageTemplate === 'file-not-found' && e.messageData?.pattern) {
        // Can happen when the file is deleted or moved
      } else {
        // Otherwise log the full error
        console.log(e, '------------------------error------------')
      }
    })
})
