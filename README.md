# lagash-dbaccess
dbaccess abstractions for node

## Usage:

- Before any usage, call `RepositoryBase.connect(connection)` with an instance of the db connection.

- To execute queries to the database, extend the RepositoryBase class and use its methods.

### Example:

```typescript
import {RepositoryBase, DBQueryParameter, DBTypes} from "lagash-dbaccess";

export default class SampleRepository extends RepositoryBase {

    async count(table: string, dateColumn: string, from: Date, to: Date): Promise<number> {

        let query = `SELECT COUNT(*) AS count FROM ${table} 
                     WHERE (${dateColumn}>=@from AND ${dateColumn}<=@to)`;

        let result = await this.execute<any>(query,
            new DBQueryParameter("from", from, DBTypes.DateTime),
            new DBQueryParameter("to", to, DBTypes.DateTime));

        if (result[0] == undefined) {
            throw new Error("Something went wrong when querying the DB.");
        }

        return result[0].count;

    }

    async getSampleEntities() {
        let query = `SELECT id, field1, field2, field3 FROM SampleEntities`;
        return this.execute<SampleEntity>(query);
    }

    async deleteSampleEntity(id: string) {
        let query = `DELETE FROM SampleEntities WHERE id = @id`;
        return this.executeNonQuery(query, new DBQueryParameter("id", id, DBTypes.NVarChar));
    }

}
```

### To execute queries inside a transaction

```typescript
let repo = new SampleRepository();

await repo.beginTransaction();

let entities = await repo.getSampleEntities();
if (entities.length > 0) {
    repo.deleteSampleEntity(entities[0].id);
}

repo.commitTransaction();
```

### To execute queries from different repositories within the same transaction

```typescript
let repo1 = new SampleRepository();
let repo2 = new SampleRepository();

await repo1.beginTransaction();
repo1.joinOtherRepositoryToCurrentTransaction(repo2);
let entities = await repo1.getSampleEntities();
if (entities.length > 0) {
    repo2.deleteSampleEntity(entities[0].id);
}

repo1.commitTransaction(); // or repo2.commitTransaction()
```


