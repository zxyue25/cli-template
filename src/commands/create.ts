import * as path from 'path'
import * as handlebars from 'handlebars'
import * as inquirer from 'inquirer'
import {
  cwd,
  chalk,
  execa,
  fs,
  startSpinner,
  succeedSpiner,
  failSpinner,
  warn,
  info,
} from '../lib'

// 检查是否已经存在相同名字工程
export const checkProjectExist = async (targetDir) => {
  if (fs.existsSync(targetDir)) {
    const answer = await inquirer.prompt({
      type: 'list',
      name: 'checkExist',
      message: `\n仓库路径${targetDir}已存在，请选择`,
      choices: ['覆盖', '取消'],
    })
    if (answer.checkExist === '覆盖') {
      warn(`删除${targetDir}...`)
      fs.removeSync(targetDir)
    } else {
      return true
    }
  }
  return false
}

export const getQuestions = async (projectName) => {
  return await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: `package name: (${projectName})`,
      default: projectName,
    },
    {
      type: 'input',
      name: 'description',
      message: 'description',
    },
    {
      type: 'input',
      name: 'author',
      message: 'author',
    },
  ])
}

export const cloneProject = async (targetDir, projectName, projectInfo) => {
  startSpinner(`开始创建私服仓库 ${chalk.cyan(targetDir)}`)
  // 复制'project-template'到目标路径下创建工程
  await fs.copy(
    path.join(__dirname, '..', '..', 'project-template'),
    targetDir
  )

  // handlebars模版引擎解析用户输入的信息存在package.json
  const jsonPath = `${targetDir}/package.json`
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
  const jsonResult = handlebars.compile(jsonContent)(projectInfo)
  fs.writeFileSync(jsonPath, jsonResult)

  // 新建工程装包
  execa.commandSync('npm install', {
    stdio: 'inherit',
    cwd: targetDir,
  })

  succeedSpiner(
    `私服仓库创建完成 ${chalk.yellow(projectName)}\n👉 输入以下命令开启私服:`
  )

  info(`$ cd ${projectName}\n$ sh start.sh\n`)
}

const action = async (projectName: string, cmdArgs?: any) => {
  try {
    const targetDir = path.join(
      (cmdArgs && cmdArgs.context) || cwd,
      projectName
    )
    if (!(await checkProjectExist(targetDir))) {
      const projectInfo = await getQuestions(projectName)
      await cloneProject(targetDir, projectName, projectInfo)
    }
  } catch (err) {
    failSpinner(err)
    return
  }
}

export default {
  command: 'create <registry-name>',
  description: '创建一个npm私服仓库',
  optionList: [['--context <context>', '上下文路径']],
  action,
}
