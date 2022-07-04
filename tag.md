## 用于快速打 tag 的脚本

### 基础脚本介绍

- 命令行单元

* 支持三个环境 dev/staging/prod

```bash
    tag_deploy-dev

    tag_deploy-staging

    tag_deploy-prod
```

- 参数介绍

| 脚本参数 | 必填/选填 | 默认值 | 描述 |
| --- | --- | --- | --- |
| product | `*必填` | -- | 支持的产品： datlas、dataFactory、dataMarket、microMdt、myData、sso |
| tag | `*必填` | -- | 任意符合产品规范的 tag |
| branch | 选填 | [product] - [tag] | 需要指定的 branch 名称 |
| version | 选填 | true | version 是否需要自动更新 |

- 组合使用

```bash
    dev:
    tag_deploy-dev --product=[product] --tag=[tag] --version=[version] --branch=[branch]

    satging:
    tag_deploy-staging --product=[product] --tag=[tag] --version=[version] --branch=[branch]

    prod:
    tag_deploy-prod --product=[product] --tag=[tag] --version=[version] --branch=[branch]
```

- 分支规范

1. 分支命名

| 分支   | 是否新开分支 | 分支名称(规范)      | 传入 branch 后     |
| ------ | ------------ | ------------------- | ------------------ |
| main   | 是           | [product]-[tagName] | [product]-[branch] |
| 子分支 | 否           | 当前分支名称        | 当前分支名称       |

2.  分支校验是否推送远端

        命中以下规则：
        dev_
        staging_
        prod_

### 规范检查(错误展示)

1.  git 命令检查

        yarn tag_deploy-dev --product=datlas --tag=dev_all_20220202

        Error: "Sorry, this script requires git"

2.  tag 值为空检查

        yarn tag_deploy-dev --product=datlas

        Error:
        ----------------------
        缺少tag
        尝试执行例如：yarn tag_deploy-dev --product=datlas --tag=dev_all_20220202
        ----------------------

3.  产品支持检查

        yarn tag_deploy-dev --product=noExistProduct --tag=dev_all_20220202

        Error:
        ----------------------
        不支持该产品！
        ----------------------

### 如何支持 config 的修改

1.  当本次提交需要修改 config，且仅是为了打 tag 的需要：

        1. 可以在main主分支或者当前子分支（建议本地pull一下）提交修改的config;

        2. 直接执行 tag_deploy-dev --product=[product] --tag=[tag] --version=[version] --branch=[branch];

        3. 脚本会触发问询操作，二次确认你修改的config;

        4. 确认后会将你的config一并打入新的tag中

2.  直接修改 main 的 config，请找`管理员`自行 mr

3.  如只需要改变 config 不需要脚本帮忙做自动 version 变更？

        执行脚本： --version=false
        eg: yarn tag_deploy-dev --product=datlas --tag=dev_all_20220202 --version=false

### 注意事项

1. 命令行只支持单个产品的 config 提交！

2. 如果是在主分支提交，则会创建一个新的分支；如果不在主分支提交，则会在原来的分支上继续提交 tag。

3. 每一次触发脚本之前 最好先检查一下分支是否需要 pull。

4. 脚本不会删除你之前的分支，除非是在主分支上检测需要创建分支操作，并且脚本异常的情况下，会删除当前创建的分支不留痕迹。

5. tag 在脚本运行完一定会被推送到远程，分支只有在 tag 命中校验规则后才会被推送到远程。

6. 脚本运行成功后，会自动帮你切回到主分支。
