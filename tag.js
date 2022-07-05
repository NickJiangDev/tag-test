const shell = require("shelljs");
const fs = require("fs");
const readline = require("readline");
const argv = require("yargs").argv;
const createLogger = require("progress-estimator");
const path = require("path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let _logger = null;

const logger = (task, message, estimate) => {
  if (!_logger) {
    _logger = createLogger({
      storagePath: path.join(__dirname, ".progress-estimator"),
    });
  }
  return _logger(task, message, {
    estimate,
  });
};

// 主分支名称
const CURRENT_MAIN_BRANCH = "main";

const {
  env, // 环境
  product, // 产品名
  tag: tagName, // tag名
  version = "true", // 当前是否更新version
  branch, // 自定义分支名
} = argv;

// 命中主动push分支的tag名称正则校验
const pushReg = /^(prod|staging|dev)?_[^_]*_.*/;

const _isversion = version === "true";
const _isMainBranch =
  shell
    .exec("git rev-parse --abbrev-ref HEAD")
    .stdout.indexOf(CURRENT_MAIN_BRANCH) !== -1;
const _branchName = `${product}-${branch ? branch : tagName}`;

// 支持的产品以及对应路径
const productsWithPaths = {
  datlas: [
    `config/${env}/datlas/version`,
    `config/${env}/page_sharing/version`,
    `config/${env}/page_sharing_404/version`,
    `config/${env}/personalized_login/version`,
  ],
  dataFactory: [`config/${env}/data-factory/version`],
  dataMarket: [`config/${env}/data-market/version`],
  microMdt: [`config/${env}/micro-mdt/version`],
  myData: [`config/${env}/my-data/version`],
  sso: [`config/${env}/sso/version`],
};

// 运行前检查
const checkRun = async (fn) => {
  /**  git command check */
  await logger(gitCheck(), "get check");
  /**  tag 为空检查 */
  await logger(tagNameEmptyCheck(), "tag check");
  /**  产品支持 */
  await logger(productCheck(), "产品检查");

  fn();
};

// 手动判断是否要继续脚本 更新config
const switchMotifyConfig = async () => {
  // script
  if (shell.exec("git status").stdout.indexOf("working tree clean") === -1) {
    clearConsole();
    shell.exec("git status -s");
    rl.question(
      `如上所示, 本次改动将会合并到 ${product} 产品的tag(${tagName})中, 请检查提交文件询问是否继续（Y/N）\n`,
      async (prompt) => {
        if (prompt?.toLowerCase() === "y") {
          consoleSuccess("确认提交, 脚本继续执行");
          rl.close();
          await logger(tagPush(false), "tag推送");
        } else if (prompt?.toLowerCase() === "n") {
          consoleWarn("放弃提交，脚本结束");
          rl.close();
        } else {
          consoleWarn("输入异常，请重新执行脚本");
          rl.close();
        }
      }
    );
  } else {
    await logger(tagPush(true), "tag推送");
  }
};

const init = () => {
  checkRun(switchMotifyConfig);
};

// -------↓↓↓ private function ↓↓↓----------
const tagNameEmptyCheck = () => {
  if (!tagName) {
    consoleError(
      "----------------------\n缺少tag\n尝试执行例如：yarn tag_deploy-dev-datlas dev_all_20220202\n----------------------"
    );
    shell.exit(1);
  }
};

const productCheck = () => {
  if (!product || !Object.keys(productsWithPaths).includes(product)) {
    consoleError(
      `----------------------\n不支持该产品！\n----------------------`
    );
    shell.exit(1);
  }
};

const gitCheck = () => {
  if (!shell.which("git")) {
    consoleError("Sorry, this script requires git");
    shell.exit(1);
  }
};

const _isNewBranch = () => {
  return shell.exec(`git rev-parse --verify ${_branchName}`).code !== 0;
};

// tag 提交
const tagPush = (clean) => {
  try {
    // execExtand('git pull');
    _isMainBranch && execExtand(`git checkout -b ${_branchName}`);
    // 执行文件修改
    _isversion && reWrite(productsWithPaths[product]);

    if (!_isversion && clean) {
      consoleSuccess(
        `----------------------\n执行完成\n无需更新\n----------------------`
      );
      execExtand(`git checkout ${CURRENT_MAIN_BRANCH}`);
      return;
    }
    execExtand("git add .");
    execExtand(`git commit -m${tagName}`);
    execExtand(`git tag ${tagName}`);
    execExtand(`git push origin ${tagName}`);
    if (pushReg.test(tagName)) {
      if (_isMainBranch) {
        execExtand(`git push origin ${_branchName}`);
      } else {
        const currentBranch = execExtand("git rev-parse --abbrev-ref HEAD");
        execExtand(`git push origin ${currentBranch}`);
      }
    }
    execExtand(`git checkout ${CURRENT_MAIN_BRANCH}`);

    consoleSuccess(
      `----------------------\n更新成功！\n目标产品：${product}\ntag版本：${tagName}\n分支名称：${
        shell.exec("git rev-parse --abbrev-ref HEAD").stdout
      }\n----------------------`
    );
  } catch (error) {
    consoleError(error);
    errorHandle(error);
  } finally {
    rl.close();
  }
};

// 写文件
const reWrite = (paths) => {
  paths.forEach((path) => {
    if (fs.existsSync(path)) {
      fs.writeFileSync(path, tagName);
    } else {
      consoleError(
        `----------------------\n${path} not exist\n----------------------`
      );
      throw new Error();
    }
  });
};
// -------↑↑↑ private function ↑↑↑----------

// -------↓↓↓ common ↓↓↓----------
// 错误console
const consoleError = (err) => console.log("\x1B[31m%s\x1B[0m", err);
// 警告console
const consoleWarn = (err) => console.log("\x1B[33m", err);
// 成功console
const consoleSuccess = (success) => console.log("\x1B[36m%s\x1B[0m", success);

// clear Terminal
const clearConsole = function () {
  process.stdout.cursorTo(0, 0);
  process.stdout.clearScreenDown();
};

// 统一抛出shell报错
const execExtand = (echo) => {
  if (shell.exec(echo).code !== 0) {
    throw new Error();
  }
};

// 错误处理
const errorHandle = (error) => {
  console.log(error);
  shell.exec("git checkout -- *");
  if (_isMainBranch) {
    shell.exec(`git checkout ${CURRENT_MAIN_BRANCH}`);
    _isNewBranch() && shell.exec(`git branch -D ${_branchName} -f`);
  }
};
// -------↑↑↑ common ↑↑↑----------

// 执行init
init();
