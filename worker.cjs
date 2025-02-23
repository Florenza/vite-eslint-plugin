const { workerData, parentPort } = require('worker_threads')
const { to, checkModule } = require("./utils.js")
const { ESLint } = require("eslint")

const eslint = new ESLint()
parentPort.on('message', async (path) => {
  const data = {status:200,error:null, path, message:null}
   try {
     const [error, report] = await to(
       checkModule(
         eslint,
         path,
         workerData.options,
         workerData.formatter,
       )
     )

     if (error) {
        data.status = 500
        const formatEs = await eslint.loadFormatter(workerData.formatter)
        const errMessage = await formatEs.format([error])
        data.message = errMessage?errMessage:null
        data.error = error.messages.length?error.messages[0]:null
     }
   }catch(error) {
      console.log(error, 'catch-->')
      data.error = error.message
      data.status=500
   }
  parentPort.postMessage(data)
})
