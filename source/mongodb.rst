MongoDB
==========

:bdg-primary:`Document` :bdg-warning:`Tunable consistency` :bdg-info:`Schema-flexible`

The database that made "just store the JSON" a legitimate architecture choice.

.. _mongo-what-it-is:

What it is
--------------

MongoDB is a document database: instead of rows in tables, it stores
JSON-like documents (BSON, a binary superset of JSON) in collections.
There's no required schema, related data is usually embedded in one
document rather than joined across tables.

.. _mongo-how-it-works:

How it works under the hood
----------------------------------

Documents live in collections, collections live in databases. Internally,
MongoDB stores BSON on disk via the WiredTiger storage engine, which
handles MVCC-style concurrency and compression. Replication happens via
replica sets: one primary takes writes, secondaries replicate
asynchronously via an operation log (the oplog), and can take over
automatically if the primary goes down.

Embedding vs referencing
---------------------------------

The core modeling decision in MongoDB. Embed related data in one
document when it's read together and doesn't grow unbounded (an order
and its line items). Reference by ID when data is shared across many
parents or grows without limit (a user referenced by thousands of
posts). Getting this wrong is the most common source of MongoDB
performance problems.

.. _mongo-setup:

Setting it up
------------------

Docker

.. code-block:: bash

   docker run --name mongo -p 27017:27017 -d mongo:7

macOS (Homebrew)

.. code-block:: bash

   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community

Atlas (managed)

1. Create a free cluster at mongodb.com/atlas

2. Add your IP to the network access list

3. Grab the connection string and use it directly

.. _mongo-first-queries:

Your first queries
-----------------------

.. code-block:: javascript

   db.users.insertOne({ email: "ada@example.com", createdAt: new Date() });

   db.orders.find({ customerId: 42 }).sort({ createdAt: -1 }).limit(10);

   db.orders.aggregate([
     { $match: { status: "paid" } },
     { $group: { _id: "$customerId", total: { $sum: "$amount" } } }
   ]);

.. _mongo-functionality:

Notable functionality
--------------------------

Aggregation pipeline

- Multi-stage data processing, similar in spirit to SQL's GROUP BY but far more composable

- Runs inside the database, close to the data

- Can replace a surprising amount of application-side data munging

Flexible schema

- Documents in the same collection can have different shapes

- Schema validation rules are optional, not mandatory

- Great for evolving data models early in a product's life

.. _mongo-consistency:

Tunable consistency
------------------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Read/write concern
     - What it means
   * - ``majority``
     - Waits for acknowledgment from a majority of replica set members;
       strong durability, more latency
   * - ``local``
     - Acknowledged by the node handling the request only; fastest, least
       durable
   * - ``linearizable``
     - Strongest guarantee, reads reflect all previously completed writes

.. note::
   This is a per-query decision, not a database-wide setting, which is
   both the power and the danger of MongoDB. Pick loose consistency
   without noticing, and you can get surprising results under load.

.. _mongo-in-production:

In production
-----------------

.. code-block:: javascript

   // See what's actually slow right now
   db.currentOp({ "secs_running": { "$gt": 3 } });

Sharding distributes collections across multiple replica sets by a shard
key you choose. Choosing a bad shard key (like a monotonically increasing
timestamp) creates hot shards that absorb all the write traffic while
others sit idle.

.. warning::
   Unbounded array growth inside a single document is a classic MongoDB
   production incident. A document has a 16MB hard limit, and an
   ever-growing embedded array (like "all comments on this post") will
   eventually hit it.

.. _mongo-pros-cons:

Pros and cons
------------------

Pros

- Natural fit for nested, document-shaped data

- Schema flexibility speeds up early development

- Horizontal scaling (sharding) is a first-class, built-in feature

- Aggregation pipeline is genuinely powerful

Cons

- No joins in the relational sense; denormalization is the norm

- Easy to accidentally pick a weak consistency level

- Schema flexibility can become schema chaos without discipline

- Multi-document transactions exist but are heavier than in an RDBMS

.. _mongo-when-to-use:

When to reach for it
-------------------------

Good fits: content management systems, catalogs with wildly varying
product attributes, event and log storage, and applications where the
data model is still actively evolving and a rigid schema would slow the
team down.

.. _mongo-not-fit:

When it's not the right fit
--------------------------------

- Data that's naturally relational and needs real joins across many
  entities
- Workloads requiring strict, always-on strong consistency without
  per-query tuning
- Small, stable schemas where a relational database's guarantees are
  simply better default behavior
