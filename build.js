const shell = require("shelljs");
const axios = require("axios");
// ει
// shell.exec(
//   "git clone ssh://git@gitlab.idatatlas.com:9522/new-datamap/frontend-config.git"
// );

// θΏε₯
// shell.cd("./frontend-config");
// shell.exec("git branch -a");

axios
  .get(
    "https://gitlab.idatatlas.com/new-datamap/mdt-design/-/pipelines.json?scope=all&page=1"
  )
  .then((response) => {
    console.log(response.data);
  });
