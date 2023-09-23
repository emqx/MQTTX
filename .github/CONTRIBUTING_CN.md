# 贡献指南

您好, 非常感谢您对 [MQTTX](https://mqttx.app/zh) 的支持。

如果您在使用过程中发现了问题 🐛 或有更好的意见和建议 💡，都可以参考以下方法修改项目代码并参与到项目中。

1. Fork 这个仓库

2. 如下运行项目

    ``` shell
    # 安装依赖
    cd MQTTX
    yarn install

    # 编译和热加载以进行开发
    yarn run electron:serve

    # 编译并压缩代码打包成安装包
    yarn run electron:build
    ```

3. 添加 Git 的 upstream remote

    ```shell
    git remote add upstream git@github.com:emqx/MQTTX.git`
    ```

4. 可以参考以下项目结构来进行源码修改:

    ```shell
    src
      ├── App.vue       # 主视图组件
      ├── api           # 请求数据的 API 集合
      ├── assets        # 资源
      │   ├── font
      │   ├── images
      │   └── scss
      ├── background.ts # 主进程文件
      ├── components    # 公用组件的集合
      ├── database      # 数据库的配置文件
      ├── lang          # 国际化配置文件
      ├── main          # 操作主进程的代码
      ├── main.ts       # 主渲染进程的文件
      ├── plugins       # 扩展 Vue 的插件
      ├── router        # 视图路由的配置集合
      ├── store         # Vuex 状态管理的配置集合
      ├── types         # 类型定义的集合
      ├── utils         # 通用工具的集合
      └── views         # 视图代码的集合
          ├── Home.vue
          ├── about
          ├── connections
          ├── log
          ├── script
          ├── settings
          └── window
    ```

5. 在新分支上添加一个 commit，并将其推送。请参阅以下说明来编写提交时 commit 信息的规范：

    - 基础格式

    `<type>(<scope>): <subject>`

    `type` 表示提交的类型, `scope` 表示提交修改的范围，`subject` 表示主要描述内容。

    例子:

    ```shell
    git commit -m "fix(index.vue): fix the mqtt connect bug"
    ```

    - 类型
      - feat: 新功能 (feature)
      - fix: 修补 bug
      - refactor: 重构 既不是修补 bug 也不是新功能
      - style: 修改样式 代码格式
      - docs: 文档
      - perf: 性能
      - revert: 恢复原状
      - test: 增加测试
      - ci: 持续集成
      - build || chore: 构建过程或辅助工具的变动

6. 最后，向上游仓库中的 `main` 分支发起一个 pull request 请求，我们将对其进行认真的审查。

    > 注意：main 分支为不稳定代码分支，新的代码都会 merge 到 main，如果您需要使用稳定代码，可以切换到对应的 tag。git checkout ${tag_name}

7. 发版流程，拉下最新的主分支 `main`，使用下面这个命令行产生一个新的 commit，最后使用 rebase merge 合并到主分支 `main`。

    ```shell
    npm version [patch | minor | major] -m '${Commit message}'
    ```

谢谢您的耐心阅读！并感谢您对 MQTTX 的贡献！:)

## 数据库迁移

如果数据库模型发生变化，请仔细阅读本节内容。

以下命令可以安全使用

```shell
# 展示运行 db:sync 后将要执行的 SQL 命令
yarn run db:log

# 展示当前哪些迁移任务需要运行或是还未运行
yarn run db:migration:show

# 根据当前的模型定义，自动生成新数据库模型的迁移文件
yarn run db:migration:generate -n ${migration_name}

# 生成数据模型 ER 图
yarn run db:diagram
```

以下是危险的命令，将会影响数据库数据

```shell
# 危险，只可以在开发环境下使用！
# 直接同步当前的数据模型到数据库
yarn run db:migration:sync

# 执行或者回滚当前的数据库迁移文件
yarn run db:migration:[run|revert]
```

如果你正处于开发模式，并且在数据库中没有实际的数据，那么你可以放心地按照以下步骤同步

1. `yarn run db:migration:drop` (可选的) 删除所有表格
2. `yarn run db:log` (可选的) 用于确定当前迁移将会执行的 SQL 语句
3. `db:migration:sync` 同步数据模型到数据库
4. `yarn run db:diagram` (可选的) 生成一个最新的 ER 关系图

否则，你应该遵循以下步骤，并且知道你正在做的每一步在干什么，否则将会有失去数据库的风险。

1. `yarn run db:log` (可选的) 用于确定当前迁移将会执行的 SQL 语句
2. `db:migration:generate -n {migration_name}` 自动生成迁移脚本
3. `db:migration:run` 运行迁移脚本。在版本更新时应该本地运行该迁移脚本
4. `db:diagram` (可选的) 生成一个最新的 ER 关系图

请使用 `db:migration:revert` 命令撤回上一次迁移, 执行 `db:migration:drop`, `db:migration:sync` 命令时请当心.

参考:

- [typeorm migrations](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md#creating-a-new-migration)
- [typeorm CLI](https://github.com/typeorm/typeorm/blob/master/docs/using-cli.md#installing-cli)
