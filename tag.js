const shell = require("shelljs");
const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 目前支持的产品
const DATLAS = "datlas";

const datlas = () => {
  const paths = [
    `config/${env}/${product}/version`,
    `config/${env}/page_sharing/version`,
    `config/${env}/page_sharing_404/version`,
    `config/${env}/personalized_login/version`,
  ];
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

const handlerWithProducts = {
  [DATLAS]: datlas,
};

const [env, product, tagName] = process.argv.slice(2);
const branchName = `${product}-${tagName}`;

const updateVersion = () => {
  // git command check
  if (!shell.which("git")) {
    //在控制台输出内容
    consoleError("Sorry, this script requires git");
    shell.exit(1);
  }
  if (!tagName) {
    consoleError(
      "----------------------\n缺少tag\n尝试执行例如：yarn tag_deploy-dev-datlas dev_all_20220202\n----------------------"
    );
    shell.exit(1);
  }
  // script
  try {
    if (shell.exec("git status").stdout.indexOf("working tree clean") === -1) {
      clearConsole();
      shell.exec("git status -s");
      rl.question(
        `如上所示, 本次改动将会合并到 ${product} 产品的tag(${tagName})中, 请检查提交文件询问是否继续（Y/N）\n`,
        function (prompt) {
          if (prompt?.toLowerCase() === "y") {
            consoleSuccess("确认提交, 脚本继续执行");
            rl.close();
          } else if (prompt?.toLowerCase() === "n") {
            consoleWarn("放弃提交，脚本结束");
            rl.close();

            execExtand("git co main");
            execExtand("git pull");
            execExtand(`git co -b ${branchName}`);
            // 执行文件修改
            handlerWithProducts[product]?.();

            execExtand("git add .");
            execExtand(`git commit -m${tagName}`);
            execExtand(`git tag ${tagName}`);
            execExtand(`git push origin ${tagName}`);
            execExtand("git co main");
            execExtand(`git branch -D ${branchName}`);

            consoleSuccess(
              `----------------------\n更新成功！\n目标产品：${product}\ntag版本：${tagName}\n----------------------`
            );
          } else {
            consoleWarn("输入异常，请重新执行脚本");
            rl.close();
          }
        }
      );
    }
  } catch (error) {
    consoleError(error);
  }
};

// -------↓↓↓ common ↓↓↓----------
// 错误console
const consoleError = (err) => console.log("\x1B[31m%s\x1B[0m", err);
// 警告console
const consoleWarn = (err) => console.log("\x1B[33m", err);
// 成功console
const consoleSuccess = (success) => console.log("\x1B[36m%s\x1B[0m", success);

/**
 * clear
 */
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

updateVersion();
