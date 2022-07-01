## 用于快速打tag的脚本

### 基础脚本介绍


- 命令行单元
```bash
    tag_deploy-dev
    tag_deploy-staging
    tag_deploy-prod
```
- 参数介绍

|  参数   | 支持的值  |
|  ----  | ----  |
| product  | datlas、dataFactory、dataMarket、microMdt、myData、sso |
| tag  | 任意符合产品规范的tag |

- 组合使用
```bash
    tag_deploy-dev [product] [tag]
    tag_deploy-staging [product] [tag]
    tag_deploy-prod [product] [tag]
```

### 规范检查(错误展示)
1. git命令检查

        yarn tag_deploy-dev datlas dev_all_20220202
        Error: "Sorry, this script requires git"

2. tag值为空检查

        tag_deploy-dev datlas
        Error: 
        ----------------------
        缺少tag
        尝试执行例如：yarn tag_deploy-dev-datlas dev_all_20220202
        ----------------------

3. 产品支持检查

        yarn tag_deploy-dev noExistProduct dev_all_20220202
        Error: 
        ----------------------
        不支持该产品！
        ----------------------
4. 主分支检查（必须为main）

        yarn tag_deploy-dev datlas dev_all_20220202
        ----------------------
        当前分支必须为main, 请检查
        ----------------------
### 如何支持config的修改

1. 当本次提交需要修改config，且仅是为了打tag的需要：
    
        可以在main主分支（建议本地pull一下）提交修改的config;
        直接执行 tag_deploy-dev [product] [tag];
        脚本会二次确认你修改的config;
        确认后会将你的config一并打入新的tag中
    
2. 直接修改main的config，请找`管理员`自行mr

### 注意事项
1. 命令行只支持单个产品的config提交！