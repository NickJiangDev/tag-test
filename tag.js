const shell = require("shelljs");
const fs = require("fs");
const [product, tagName] = process.argv.slice(2);
const branchName = `update-${tagName}`;

// datlas脚本修改
const isDatlas = (product) => product === "datlas";

const datlas = () => {
  if (fs.existsSync("src/version")) {
    fs.writeFileSync("src/version", tagName, function (err) {
      if (err) {
        return console.error(err);
      }
    });
  } else {
    console.error("src/version not exist");
  }
};

const updateVersion = () => {
  shell.exec("git co main");
  shell.exec("git pull");
  shell.exec(`git co -b ${branchName}`);

  // 执行文件修改
  isDatlas(product) && datlas();

  shell.exec("git add .");
  shell.exec(`git commit -m${tagName}`);
  shell.exec(`git tag ${tagName}`);
  shell.exec(`git push origin ${tagName}`);
  shell.exec("git co main");
  shell.exec(`git branch -D ${branchName}`);
};

updateVersion();
