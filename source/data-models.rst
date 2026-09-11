Data models
============

Picking the shape that matches how your data actually connects.

.. _models:

The five shapes data can take
-------------------------------

Picking a data model is picking which questions will be easy to ask
later and which will be painful. There's no universally "best" one, only
the one that matches how your data actually connects.

- **Relational** — Rows and columns, tied together by keys instead of by
  nesting. Good when your data has a clear shape and you'll ask lots of
  different, unpredictable questions of it. *Postgres, MySQL, SQL
  Server*
- **Document** — Each record is a self-contained blob, usually JSON.
  Great for data that's naturally nested and doesn't have to line up
  perfectly record to record. *MongoDB, Couchbase*
- **Graph** — Relationships are stored as first-class citizens, not
  reconstructed with joins. Traversing "friends of friends of friends"
  stays fast no matter how deep you go. *Neo4j, Amazon Neptune*
- **Key-value** — A giant, extremely fast dictionary. You give it a key,
  it hands back a value. No querying by content, no joins, and that's
  the whole point. *Redis, DynamoDB, etcd*
- **Columnar** — Storage is organized by column instead of by row, which
  makes "average this one column across a billion rows" absurdly fast.
  Terrible for fetching a single record. *ClickHouse, BigQuery,
  Redshift*
- **Time-series** — Built around the assumption that every record has a
  timestamp and you'll mostly query recent ranges. Old data gets
  compressed or rolled up automatically. *InfluxDB, TimescaleDB*

.. _sql-vs-nosql:

"SQL vs. NoSQL" isn't really the question
--------------------------------------------

This gets framed as a rivalry, but it's closer to comparing a
screwdriver to a whole toolbox labeled "not a screwdriver." NoSQL isn't
one thing, it covers document, key-value, graph, and columnar stores,
which have very little in common with each other beyond "not relational
tables."

The actual decision usually comes down to two questions: does your data
have a shape that holds still, and do you need transactions across
multiple pieces of it at once? If both answers are yes, reach for
something relational first, it's a boring, well-understood choice, and
boring is usually what you want in the part of your stack holding your
users' money.

**Warning:** "We're using MongoDB because it scales better" is one of
the more common pieces of received wisdom in this space, and it's
usually wrong, Postgres scales to a genuinely enormous size for the vast
majority of applications that will ever be built. Pick the model that
fits your data, not the one you heard was faster.
