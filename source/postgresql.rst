PostgreSQL
=============

:bdg-primary:`Relational` :bdg-success:`Strong consistency` :bdg-info:`Open source`

The default choice for most new applications, and for good reason.

.. _pg-what-it-is:

What it is
--------------

PostgreSQL is an open source, object-relational database that's been under
active development since the 1980s (as POSTGRES, then Postgres95, then
PostgreSQL). It's known for strict standards compliance, genuine
extensibility, and a reputation for not losing your data even when things
go wrong.

.. _pg-how-it-works:

How it works under the hood
----------------------------------

Postgres uses a process-per-connection model: every client connection gets
its own backend process, not a thread. It stores data in on-disk pages
grouped into tables, uses a write-ahead log (WAL) for durability and crash
recovery, and relies on MVCC (multi-version concurrency control) so readers
never block writers and writers never block readers.

.. dropdown:: What MVCC actually buys you

   Instead of locking a row for every read, Postgres keeps multiple
   versions of a row around. A transaction sees a consistent snapshot of
   the database as of when it started, regardless of what other
   transactions are doing at the same time. Old row versions get cleaned
   up later by a background process called autovacuum.

.. _pg-setup:

Setting it up
------------------

.. tab-set::

   .. tab-item:: macOS (Homebrew)

      .. code-block:: bash

         brew install postgresql@16
         brew services start postgresql@16
         createdb myapp

   .. tab-item:: Docker

      .. code-block:: bash

         docker run --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:16

   .. tab-item:: Ubuntu

      .. code-block:: bash

         sudo apt install postgresql postgresql-contrib
         sudo -u postgres createuser --interactive
         sudo -u postgres createdb myapp

.. _pg-first-queries:

Your first queries
-----------------------

.. code-block:: sql

   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       email TEXT UNIQUE NOT NULL,
       created_at TIMESTAMPTZ DEFAULT now()
   );

   INSERT INTO users (email) VALUES ('ada@example.com');

   SELECT id, email FROM users WHERE created_at > now() - interval '7 days';

.. _pg-functionality:

Functionality that sets it apart
----------------------------------------

.. grid:: 2

   .. grid-item-card:: Data types

      - ``JSONB`` for schema-flexible document data, indexable
      - ``ARRAY`` columns
      - Native ``UUID``, ``INET``, range types
      - Full-text search built in

   .. grid-item-card:: Extensibility

      - PostGIS for geospatial data
      - pgvector for embeddings and similarity search
      - Foreign data wrappers to query other databases
      - Custom functions in SQL, PL/pgSQL, or even Python

.. _pg-indexes:

Indexing options
---------------------

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Index type
     - Good for
     - Example
   * - **B-tree**
     - Default, equality and range queries
     - ``CREATE INDEX ON users(email);``
   * - **GIN**
     - JSONB, arrays, full-text search
     - ``CREATE INDEX ON docs USING gin(data);``
   * - **GiST**
     - Geometric data, ranges, nearest-neighbor
     - Used by PostGIS internally
   * - **BRIN**
     - Huge tables with naturally sorted data (timestamps)
     - Time-series tables with billions of rows

.. _pg-in-production:

In production
-----------------

.. code-block:: sql

   -- Check what autovacuum is doing right now
   SELECT relname, last_autovacuum, n_dead_tup
   FROM pg_stat_user_tables
   ORDER BY n_dead_tup DESC
   LIMIT 5;

.. warning::
   The single most common Postgres production issue isn't a bug, it's
   ``max_connections`` being exhausted because nobody put a pooler like
   PgBouncer in front of it. Postgres backends are real OS processes, and
   they aren't free.

Replication is built in via streaming WAL replication for read replicas
and failover, and logical replication for selective, cross-version
replication between databases.

.. _pg-pros-cons:

Pros and cons
------------------

.. grid:: 2

   .. grid-item-card:: Pros

      - Rock-solid ACID guarantees
      - Enormous extension ecosystem
      - Excellent JSON support without giving up SQL
      - Free, no licensing games

   .. grid-item-card:: Cons

      - Vertical scaling has a ceiling; sharding isn't built in
      - Connection overhead means pooling is mandatory at scale
      - ``VACUUM`` tuning is a real skill you have to learn
      - Replication lag can bite naive read-replica setups

.. _pg-when-to-use:

When to reach for it
-------------------------

.. tip::
   If you're not sure what database to start with, Postgres is almost
   always the right default. It scales further than people expect before
   you need anything more exotic.

Good fits: general application backends, financial data, anything where
data integrity matters more than raw write throughput, and workloads that
benefit from rich querying (joins, window functions, CTEs) over simple
key lookups.

.. _pg-not-fit:

When it's not the right fit
--------------------------------

- Extremely high write throughput with simple access patterns (consider
  Cassandra)
- Sub-millisecond cache-style lookups (consider Redis)
- Massive horizontal write scaling across regions without a lot of
  operational investment (consider a distributed SQL system)

.. seealso::
   :doc:`connection-pooling` for handling Postgres's per-connection
   process model at scale, and :doc:`caching-strategies` for offloading
   hot reads.
