const shell = require("shelljs");
const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const [env, product, tagName] = process.argv.slice(2);
const _branchName = `${product}-${tagName}-${new Date().getTime()}`;

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
const checkRun = (fn) => {
  gitCheck();
  tagNameCheck();
  productCheck();
  branchCheck();

  fn();
};

// 手动判断是否要继续脚本 更新config
const switchMotifyConfig = () => {
  // script
  if (shell.exec("git status").stdout.indexOf("working tree clean") === -1) {
    clearConsole();
    shell.exec("git status -s");
    rl.question(
      `如上所示, 本次改动将会合并到 ${product} 产品的tag(${tagName})中, 请检查提交文件询问是否继续（Y/N）\n`,
      function (prompt) {
        if (prompt?.toLowerCase() === "y") {
          consoleSuccess("确认提交, 脚本继续执行");
          rl.close();
          tagPush();
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
    tagPush();
  }
};

const init = () => {
  checkRun(switchMotifyConfig);
};

// -------↓↓↓ private function ↓↓↓----------
const tagNameCheck = () => {
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

const branchCheck = () => {
  // 检查是否为主分支
  if (
    shell.exec("git rev-parse --abbrev-ref HEAD").stdout.indexOf("main") === -1
  ) {
    consoleError(
      "----------------------\n当前分支必须为main, 请检查\n----------------------"
    );
    shell.exit(1);
  }
};
const gitCheck = () => {
  // git command check
  if (!shell.which("git")) {
    //在控制台输出内容
    consoleError("Sorry, this script requires git");
    shell.exit(1);
  }
};

const tagPush = () => {
  try {
    execExtand("git pull");
    execExtand(`git co -b ${_branchName}`);
    // 执行文件修改
    reWrite(productsWithPaths[product]);

    execExtand("git add .");
    execExtand(`git commit -m${tagName}`);
    execExtand(`git tag ${tagName}`);
    execExtand(`git push origin ${tagName}`);
    execExtand("git co main");
    execExtand(`git branch -D ${_branchName}`);

    consoleSuccess(
      `----------------------\n更新成功！\n目标产品：${product}\ntag版本：${tagName}\n----------------------`
    );
  } catch (error) {
    consoleError(error);
    shell.exec("git clean -xdf");
    shell.exec("git co main");
  } finally {
    rl.close();
    shell.exit(1);
  }
};

const reWrite = (paths) => {
  paths.forEach((path) => {
    if (fs.existsSync(path)) {
      fs.writeFileSync(path, tagName, function (err) {
        if (err) {
          throw new Error(err);
        }
      });
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
// -------↑↑↑ common ↑↑↑----------

// 执行init
init();
