const shell = require("shelljs");
const fs = require("fs");

shell.exec("git co test");
fs.writeFileSync("config/test", "test1");
shell.exec("git add .");
shell.exec('git commit -m"test"');
shell.exec("git push");

// 废弃
