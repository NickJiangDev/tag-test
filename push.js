const shell = require("shelljs");
const fs = require("fs");

fs.writeFileSync("config/test", "test1");
shell.exec("git add .");
shell.exec('git commit -m"test"');
shell.exec("git push");
