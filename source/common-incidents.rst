Common production incidents
===============================

The same handful of things break, over and over, across every company.

.. _deadlocks:

Deadlocks
------------

Two transactions each hold a lock the other one needs, and both wait forever.
The database eventually notices and kills one of them for you.

.. code-block:: text

   Transaction A: locks row 1, wants row 2
   Transaction B: locks row 2, wants row 1
   Neither can proceed, database kills one

**Fix:** always lock rows in the same order across your whole codebase. If
every transaction touches accounts in ascending ID order, two transactions
can never deadlock on the same pair of rows.

.. _lock-contention:

Lock contention
-------------------

Not a deadlock, just a lot of transactions queuing up for the same row or
table. Feels like the database "randomly" got slow.

How to spot it
-------------------

Look for queries with a long time between being received and actually
   starting to run, not a long execution time once running. In Postgres,
   check ``pg_locks`` joined against ``pg_stat_activity`` for sessions
   waiting on a lock someone else is holding.

**Common cause:** a long-running transaction, often a batch job or an
accidental interactive session someone forgot to commit, holding a lock that
everything else is waiting behind.

.. _n-plus-one:

The N+1 query problem
--------------------------

Not a database problem exactly, but it shows up as one. Your app loads a list
of 50 orders, then makes a separate query for each order's customer, 51
queries where one would do.

.. tab-set::

   .. tab-item:: The N+1 way

      .. code-block:: sql

         SELECT * FROM orders LIMIT 50;
         -- then, for each order:
         SELECT * FROM customers WHERE id = ?;

   .. tab-item:: The fix

      .. code-block:: sql

         SELECT orders.*, customers.*
         FROM orders
         JOIN customers ON customers.id = orders.customer_id
         LIMIT 50;

Most ORMs make this easy to write by accident. Look for "eager loading" or
"includes" options in your ORM to fetch related data in the same query.

.. _runaway-migration:

A migration that locks the table
--------------------------------------

Covered in more depth on the migrations page, but the incident pattern is
always the same: a migration that seemed fine in staging on a small table
locks a much bigger production table for minutes, and every request touching
it times out.

**In the moment:** cancel the migration first, worry about the schema change
second. A stuck migration blocking traffic is worse than a delayed schema
change.

.. _out-of-disk:

Running out of disk
------------------------

Databases handle running out of disk very badly, writes fail, and depending
on the system, it can be difficult to even run the ``DELETE`` you need to
free up space because that itself needs disk.

.. warning::
   Alert well before you're actually full. 80 percent used should trigger a
   look, not 95 percent. Common silent culprits: old WAL files that never got
   cleaned up, and bloated indexes on tables with heavy update or delete
   traffic.

.. _replica-lag-spike:

Replica lag suddenly spikes
----------------------------------

Usually caused by a large write or batch job hitting the primary, the
replica falls behind trying to keep up. If your app reads from replicas,
users start seeing stale or missing data until lag catches back up.

**Fix:** find and slow down or batch whatever large write caused it, and
consider routing reads that need fresh data straight to the primary during
known heavy write periods.

.. _pool-exhaustion-incident:

Connection pool exhaustion
--------------------------------

Covered in depth on the connection pooling page, the incident pattern
itself: a traffic spike or a deploy that opens more connections than usual,
and suddenly requests are timing out waiting for a connection, not because
the database itself is slow.

.. _thundering-herd:

Thundering herd after an outage
--------------------------------------

Everything comes back online at once after an outage, and every client
retries at the same moment, overwhelming the database right as it's trying
to recover. Fix with jittered, randomized retry delays instead of every
client retrying on the same fixed interval.

.. _bad-query-plan:

A query plan suddenly goes bad
------------------------------------

A query that's been fast for months suddenly gets slow, with no code
change. Often caused by table statistics going stale after a lot of writes,
the query planner is working off an outdated picture of the data and picks a
bad plan.

**Fix:** run ``ANALYZE`` (Postgres) or the equivalent to refresh statistics.
Most databases do this automatically, but heavy write bursts can outpace it.

.. _corrupted-index:

A corrupted index
----------------------

Rare, but it happens, usually after a crash or a bug in the database
software itself. Symptoms are strange, queries returning wrong or
inconsistent results while the underlying data is actually fine.

**Fix:** most databases have a ``REINDEX`` command. Worth knowing it exists
before you need it at 2am.

.. _accidental-full-scan:

An accidental full table scan
------------------------------------

A query that should use an index doesn't, often because of a type mismatch,
like comparing a text column against a number, or a function wrapped around
the indexed column that stops the index from being used.

.. code-block:: sql

   -- Index on created_at won't be used here
   SELECT * FROM orders WHERE DATE(created_at) = '2025-01-01';

   -- This can use the index
   SELECT * FROM orders WHERE created_at >= '2025-01-01' AND created_at < '2025-01-02';

.. _cascading-failures:

Cascading failures across services
------------------------------------------

The database gets slow, requests pile up in every service that talks to it,
those services run out of their own resources, and the outage spreads well
past the database itself. Timeouts and circuit breakers in the app layer
exist specifically to stop this chain reaction.

.. _bad-deploy-corruption:

Data corruption from a bad deploy
----------------------------------------

A bug ships that writes wrong data, not obviously broken, just wrong, and
it's not caught for hours or days. This is the incident type backups alone
don't fully cover, since the corruption gets backed up too.

**Fix:** point-in-time recovery to just before the bad deploy, then replay
any legitimate writes that happened after it, by hand if needed.

.. _runaway-background-job:

A runaway background job
------------------------------

A batch or cron job that's supposed to touch a few thousand rows ends up
touching all of them, holding locks and generating load far beyond what
anyone expected. Add limits and dry-run modes to batch jobs before they run
against production.

.. _clock-drift:

Clock drift and timestamp bugs
------------------------------------

Rare on managed databases, more common in self-hosted or multi-region
setups, small clock differences between machines produce subtly wrong
``created_at`` orderings or break anything relying on precise timestamp
comparisons across systems. Worth ruling out early if data seems to be in
the wrong order for no obvious reason.
