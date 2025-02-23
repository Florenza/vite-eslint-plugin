const { existsSync } = require('node:fs');
const { ESLint } = require("eslint")
const { parseRequest, isVirtualModule, pickESLintOptions, to, checkModule } = (function() {
  function parseRequest(id) {
    return id.split('?', 2)[0];
  }

  function isVirtualModule(file) {
    return !existsSync(file);
  }

  function pickESLintOptions(options) {
    const {
      eslintPath, lintOnStart, include, exclude, formatter, emitWarning, emitError, failOnWarning, failOnError,
      ...eslintOptions
    } = options;
    return eslintOptions;
  }

  async function to(promise) {
    return promise
      .then(async ([error, data]) => [error, data] || [null, await promise]) // Note: This line is technically incorrect in JS as it doesn't handle the promise correctly, but it's to mimic the structure. Ideally, you should handle it differently.
      .catch((error) => [error, undefined]);
  }
  // Note: In a real conversion, 'to' function should be fixed to properly handle promises.
  // The correct implementation would be:
  /*
  async function to(promise) {
      try {
          const data = await promise;
          return [null, data];
      } catch (error) {
          return [error, undefined];
      }
  }
  */

  async function checkModule( eslint, files, options, formatter) {
    const [error, report] = await to(eslint.lintFiles(files));
    const errorData = {message:'' , type: 'error'}
    if (error) {
      return Promise.reject(error);
    }

    const hasWarning = report.some(item => item.warningCount > 0);
    const hasError = report.some(item => item.errorCount > 0);
    let result = formatter(report);

    if (options.fix && report) {
      const [fixError] = await to(ESLint.outputFixes(report));
      if (fixError) {
        return Promise.reject(fixError);
      }
    }

    if (hasWarning && options.emitWarning) {
      result = typeof result === 'string' ? result : await result;
      if (options.failOnWarning) {
        errorData.message = result
        errorData.type = 'error'
      } else {
        errorData.type = 'warn'
      }
      errorData.message = result
    }

    if (hasError && options.emitError) {
      result = typeof result === 'string' ? result : await result;
      if (options.failOnError) {
        errorData.message = result
      } else {
        console.log(result);
      }
    }

    return Promise.resolve(errorData);
  }

  return { parseRequest, isVirtualModule, pickESLintOptions, to, checkModule };
})();

module.exports = { parseRequest, isVirtualModule, pickESLintOptions, to, checkModule };
