# Contributing Guide

Hi, thanks for your support to [MQTTX](https://mqttx.app).

If you find a problem 🐛 or have a better idea 💡 during use, you can modify the project code by following ways and participate in the project contribution.

1. Fork this repository

2. Run the project as follows

   ```shell
   # Install dependencies
   cd MQTTX
   yarn install

   # Compiles and hot-reloads for development
   yarn run electron:serve

   # Compiles and minifies for production
   yarn run electron:build
   ```

3. Add upstream remote

   ```shell
   git remote add upstream git@github.com:emqx/MQTTX.git
   ```

4. The code can be modified according to the following project structure:

   ```shell
   src
     ├── App.vue # Main view component
     ├── api # API collection requesting data
     ├── assets # Resource
     │   ├── font
     │   ├── images
     │   └── scss
     ├── background.ts # Main file of the main process
     ├── components # Common components collection
     ├── database # Database configuration file
     ├── lang # I18n configuration file
     ├── main # Code to operate the main process
     ├── main.ts # The main file of the render process
     ├── plugins # Extend Vue plugins
     ├── router # View routing configuration code
     ├── store # Vuex state management configuration code
     ├── types # Type definition collection
     ├── utils # Collection of general tools
     └── views # The main code collection of the view
         ├── Home.vue
         ├── about
         ├── connections
         ├── log
         ├── script
         ├── settings
         └── window
   ```

5. Add commit on new branch, push it. Please refer to the following instructions for commit specifications

   - Basic format

   `<type>(<scope>): <subject>`

   `type` indicates the type of submission, `scope` indicates the scope of modification submitted, `subject` indicates the main description content.

   For example:

   ```shell
   git commit -m "fix(index.vue): fix the mqtt connect bug"
   ```

   - type

     - feat: New feature
     - fix: Fix bug
     - refactor: Refactor, neither fixing bugs nor new features
     - style: Modify UI style or code format
     - docs: Documentation
     - perf: Performance
     - revert: Revert
     - test: Add test cases
     - ci: Continuous integration
     - build || chore: Changes in build tools or dependent packages

6. Submit a pull request to the `master` branch of the upstream repository, and we will review it.

   > Note: The master branch is an unstable code branch, new code will be merged to master, if you need to use stable code, you can switch to the tag. git checkout ${tag_name}

7. Release process, pull down the latest master branch `maste`, using this command line to generate a new commit, and finally use rebase merge to merge into The master branch `master`.

   ```shell
   npm version [patch | minor | major] -m '${Commit message}'
   ```

Thanks for your reading! Hope enjoying! :)

## Database Migration

Please read this section If your database models has changed.

Commands which you could use safety.

```shell
# To Show Migration SQL queries
# Check what sql queries db:sync is going to run use
yarn run db:log

# To show all migrations and whether they've been run or not
yarn run db:migration:show

# Automatic migration generation creates a new migration file and writes all sql queries that must be executed to update the database.
yarn run db:migration:generate -n ${migration_name}

# Generate a ER database diagram
yarn run db:diagram
```

Dangerous Commands, which do some effect in database.

```shell
# Dangerous, Development Only!
# Sync current models to database
yarn run db:migration:sync

# To execute all pending migrations | To revert the most recently executed migration
yarn run db:migration:[run|revert]
```

If your table models is not stable, and there are development mode without any data. you could just use:

1. `yarn run db:migration:drop` (optional) drop all DDL schema includes its entities
2. `yarn run db:log` (optional) check CLI sync execute SQL queries
3. `db:migration:sync` sync models to database
4. `yarn run db:diagram` (optional) get a latest ER diagram

Otherwise, Please follow bellow steps and know clearly what you do. Or there is a high risk to lost data.

1. `yarn run db:log` (optional) check CLI sync execute SQL queries
2. `db:migration:generate -n {migration_name}` Automatic migration generate
3. `db:migration:run` make pending migrations executed. NOTICE: you should execute this code before the APP open since the table model changed.
4. `db:diagram` (optional) get a latest ER diagram.

Please use `db:migration:revert` to revert changes, and executing `db:migration:drop`, `db:migration:sync` carefully.

Reference:

- [typeorm migrations](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md#creating-a-new-migration)
- [typeorm CLI](https://github.com/typeorm/typeorm/blob/master/docs/using-cli.md#installing-cli)
