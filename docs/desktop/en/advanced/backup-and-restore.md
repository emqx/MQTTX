# Backup and restore

In **Settings > Advanced**, choose **Data Backup** to export connection settings and sent and received messages as JSON, YAML, XML, CSV, or Excel. Choose **Data Recovery** to import a backup; connections remain disconnected after recovery.

JSON preserves nested and empty connection groups, ordering, and each connection's group. A single-connection JSON export includes its ancestor groups. Other formats keep their existing connection or message layouts without groups.

<details>
<summary>JSON compatibility and import rules</summary>

## Compatibility

JSON keeps the existing top-level array. Connection records retain their existing fields. Group records use this shape:

```json
{
  "id": "collection-id",
  "name": "Production",
  "isCollection": true,
  "parentId": null,
  "orderId": 0
}
```

`parentId` names another group in the same backup, or is `null` for a root group. Connections use their existing `parentId` to refer to a group. Record order does not affect recovery.

Recovery also accepts older connection-only backups. Their connections recover at the root because those files contain no group entities. A legacy connection without an ID receives a new ID. Older MQTTX versions cannot import JSON backups containing group records; restore those files with a version that supports group backup.

## Repeated imports and conflicts

Importing an existing group or connection ID updates that entity. Message IDs update messages belonging to that connection, and supplied subscriptions replace its subscription list. Messages absent from the backup remain in the database. Preserve IDs when repeating an import to avoid creating new entities.

Recovery rejects duplicate IDs within a backup, IDs shared by a group and a connection, child IDs owned by another connection, missing group references, and cyclic group hierarchies. Any validation or database error rolls back the entire import, including group relationships, connections, wills, subscriptions, and messages.

</details>
