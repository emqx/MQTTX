# Database Migration

```shell
# To Show Migration SQL queries
# Check what sql queries db:sync is going to run use
yarn run db:log

# To show all migrations and whether they've been run or not
yarn run db:migration:show

# Automatic migration generation creates a new migration file and writes all sql queries that must be executed to update the database.
yarn run db:migration:generate -n ${migration_name}

# generate a ER database diagram
yarn run db:diagram
```

dangerous CLI, do some effect in database.

```shell
# Dangerous, Development Only!
# sync current models to database
yarn run db:migration:sync

# To execute all pending migrations | To revert the most recently executed migration
yarn run db:migration:[run|revert]
```

If your table models is not stable, and there are development mode without any data. you could just use:

1. `yarn run db:log` check CLI sync execute SQL queries
2. `yarn run db:diagram` get a latest ER diagram
3. `db:migration:sync` sync models to database

Otherwise, Please follow bellow steps and make sure what you do. Or there is a high risk to lost data.

1. `yarn run db:log` check CLI sync execute SQL queries
2. `db:migration:generate -n {migration_name}` Automatic migration generate
3. `db:migration:run` make pending migrations executed. NOTICE: you should execute this code before the APP open since the table model changed.
4. `db:diagram` get a latest ER diagram.

Please use `db:migration:revert` to revert changes.

executing `db:migration:run`, `db:migration:sync` carefully.

Reference:

- [typeorm migrations](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md#creating-a-new-migration)
- [typeorm CLI](https://github.com/typeorm/typeorm/blob/master/docs/using-cli.md#installing-cli)
