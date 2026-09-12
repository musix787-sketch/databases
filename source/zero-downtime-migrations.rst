Zero downtime migrations
============================

How to change a live schema without taking the site down while you do it.

.. _the-lock-problem:

The problem is locks, not the change itself
------------------------------------------------

Most schema changes are quick. The dangerous ones are the ones that lock the
whole table while they run, which on a big table can mean minutes of every
query queuing up behind the migration.

.. list-table::
   :header-rows: 1
   :widths: 35 35 30

   * - Change
     - Locking behavior
     - Safe at scale
   * - Add a nullable column
     - Brief lock, effectively instant
     - Yes
   * - Add a column with a default
     - Historically rewrote the whole table, modern Postgres (11+) does
       this instantly for constant defaults
     - Depends on version
   * - Add a ``NOT NULL`` constraint
     - Scans and locks the whole table to verify
     - No, needs a workaround
   * - Add an index
     - Locks writes for the duration, unless built concurrently
     - Only with ``CREATE INDEX CONCURRENTLY``
   * - Rename a column
     - Instant, but breaks any code still using the old name
     - No, needs a multi-step rollout

.. _expand-contract:

The expand and contract pattern
-------------------------------------

The trick for anything risky is to split one change into several small,
individually safe steps, deploying code in between.

1. **Expand:** add the new column/table, nothing reads from it yet

2. **Backfill:** copy or compute data into the new column in small batches

3. **Dual write:** app writes to both old and new, still reads from old

4. **Switch reads:** app reads from new, still writes both for safety

5. **Contract:** stop writing old, drop the old column

Each step is deployable and reversible on its own. If step 3 breaks
something, you roll back to step 2 without ever touching the schema again.

.. _not-null-workaround:

Adding NOT NULL without locking the table
-----------------------------------------------

.. tab-set::

   .. tab-item:: The slow, locking way

      .. code-block:: sql

         ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT '';

   .. tab-item:: The safe way

      .. code-block:: sql

         -- Add it nullable first
         ALTER TABLE users ADD COLUMN email TEXT;

         -- Backfill in batches, not one giant UPDATE
         UPDATE users SET email = '' WHERE email IS NULL AND id BETWEEN 1 AND 10000;

         -- Add the constraint as NOT VALID, instant
         ALTER TABLE users ADD CONSTRAINT email_not_null CHECK (email IS NOT NULL) NOT VALID;

         -- Validate separately, this scans but doesn't block writes
         ALTER TABLE users VALIDATE CONSTRAINT email_not_null;

.. _migration-tips:

A few rules that save you at 3am
--------------------------------------

- Never run a migration and a deploy at the exact same moment, give the
  schema change time to finish first
- Batch big backfills, one ``UPDATE`` touching 10 million rows holds locks
  and bloats your write-ahead log far more than the same work done in 10,000
  small batches
- Always have a rollback plan for the code, not just the schema, most
  incidents come from code assuming a column exists before the migration
  finished

.. _renaming-columns:

Renaming a column safely
------------------------------

A rename is instant on the database side, but breaks any code still using the
old name the moment it runs. Do it in steps instead:

.. code-block:: text

   1. Add the new column
   2. Dual write to both old and new
   3. Backfill the new column for existing rows
   4. Deploy code that reads from the new column
   5. Stop writing to the old column
   6. Drop the old column, later, once you're confident

.. _dropping-columns:

Dropping a column safely
------------------------------

Dropping is instant too, and just as risky if anything still reads it.
Deploy the code change that stops using the column first, wait a while,
confirm nothing broke, then drop it. Treat "nothing broke yet" and "nothing
uses it" as different claims, give it real time before the drop.

.. _changing-types:

Changing a column's type
------------------------------

Some type changes are cheap, widening a ``VARCHAR(50)`` to ``VARCHAR(100)``.
Others rewrite the entire table, changing an ``INTEGER`` to a ``BIGINT`` on a
huge table can lock it for a long time. Check what your specific database
does for the specific change before running it on production.

.. _foreign-keys-locking:

Adding a foreign key without locking writes
----------------------------------------------------

.. code-block:: sql

   -- Add the constraint without validating existing rows yet
   ALTER TABLE orders
     ADD CONSTRAINT fk_customer
     FOREIGN KEY (customer_id) REFERENCES customers(id)
     NOT VALID;

   -- Validate separately, scans but doesn't block writes
   ALTER TABLE orders VALIDATE CONSTRAINT fk_customer;

Same pattern as the ``NOT NULL`` workaround earlier, split the fast, unsafe
part from the slow, safe part.

.. _concurrent-index:

Building indexes concurrently
------------------------------------

.. code-block:: sql

   CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders (customer_id);

Slower than a normal ``CREATE INDEX``, and it can fail and leave behind an
invalid index that needs cleanup, but it doesn't block writes while it runs.
On any table that matters in production, this should be the default, not an
exception.

.. _feature-flags-migrations:

Feature flags alongside schema changes
--------------------------------------------

Pairing a migration with a feature flag lets you deploy the code that uses a
new column before turning it on, and roll the feature off instantly if
something's wrong, without needing a second deploy or touching the schema
again.

.. _migration-tooling:

Migration tooling
----------------------

Most ecosystems have a standard tool for this, Alembic for Python, Flyway or
Liquibase for Java, ActiveRecord migrations for Rails. Whichever you use, the
important properties are the same: migrations run in a known order, each one
runs exactly once, and there's a record of what's already been applied.

.. _testing-migrations:

Testing against production-sized data
--------------------------------------------

A migration that runs instantly on a staging table with 500 rows can lock
production for ten minutes on a table with 500 million. Where possible, test
risky migrations against a copy of production-sized data, not just a small
sample, timing matters more than correctness here.

.. _rolling-back:

Rolling back a migration
------------------------------

Not every migration can be cleanly reversed, dropping a column loses data
the moment it runs. Write rollback steps in advance for anything destructive,
and for anything that truly can't be undone, make sure there's a tested
backup from right before it ran.

.. _coordinating-across-services:

Coordinating migrations across services
----------------------------------------------

If more than one service reads the same database, a migration needs to be
safe for whichever version of each service happens to be running at the
same time, since deploys rarely line up perfectly. This is the real reason
the expand and contract pattern exists, it keeps every step safe regardless
of deploy order.
