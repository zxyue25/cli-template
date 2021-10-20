import * as globby from 'globby'
import * as commander from 'commander'
import * as path from 'path'
import { error, chalk, fs, info } from './lib'
import * as pacote from 'pacote'
const { program } = commander

let commandsPath = []
let pkgVersion = ''
let pkgName = ''

// 获取src/command路径下的命令
const getCommand = () => {
  commandsPath =
    (globby as any).sync('./commands/*.*s', { cwd: __dirname, deep: 1 }) || []
  return commandsPath
}

// 获取当前包的信息
const getPkgInfo = () => {
  const jsonPath = path.join(__dirname, '../package.json')
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
  const jsonResult = JSON.parse(jsonContent)
  pkgVersion = jsonResult.version
  pkgName =  jsonResult.name
}

// 获取最新包最新版本
const getLatestVersion = async () => {
    const manifest = await pacote.manifest(`${pkgName}@latest`)
    return  manifest.version
}

function start() {
  const commandsPath = getCommand()
  commandsPath.forEach((commandPath) => {
    const commandObj = require(`./${commandPath}`)
    const { command, description, optionList, action } = commandObj.default
    const curp = program
      .command(command)
      .description(description)
      .action(action)

    optionList &&
      optionList.map((option: [string]) => {
        curp.option(...option)
      })
  })

  getPkgInfo()
  program.version(pkgVersion)

  program.on('command:*', async ([cmd]) => {
    program.outputHelp()
    error(`未知命令 command ${chalk.yellow(cmd)}.`)
    const latestVersion = await getLatestVersion() 
    if(latestVersion !== pkgVersion){
      info(`可更新版本，${chalk.green(pkgVersion)} -> ${chalk.green(latestVersion)} \n执行npm install -g ${pkgName}`)
    }
    process.exitCode = 1
  })

  program.parseAsync(process.argv)
}

start()
