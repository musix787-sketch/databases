Under the hood
===============

How a database keeps the promises it makes.

.. _acid:

ACID, unpacked
---------------

ACID gets recited like a magic word in interviews, but each letter is
answering a specific, concrete fear about what could go wrong. It helps
to think of them as promises, not features:

- **A: Atomicity** - "Deduct from account A, add to account B" happens
  as one indivisible unit. If the second half fails, the first half gets
  undone, you never end up with money vanishing between accounts.
- **C: Consistency** - Any transaction takes the database from one
  valid state to another. If you've said balances can't go negative, no
  transaction, however written, is allowed to break that.
- **I: Isolation** - Two transactions running at the same moment can't
  see each other's unfinished work. What you read looks like it happened
  before or after the other one, never halfway through.
- **D: Durability** - Once the database says "committed," that data
  survives a crash a millisecond later. It's on disk (or logged
  somewhere durable), not sitting hopefully in RAM.

Most NoSQL systems relax one or more of these on purpose, usually
isolation or consistency, in exchange for speed or the ability to keep
running when part of the system is unreachable. That trade is sometimes
exactly right, a "likes" counter can afford to be briefly wrong. A bank
balance can't.

.. _normalization:

Normal forms, without the textbook language
------------------------------------------------

Normalization is really just "don't write the same fact in two places."
If a customer's address changes, you want to update it once, not go
hunting through every order row that happened to copy it. The formal
rules build on each other:

#. **First normal form, one value per cell** - No stuffing a
   comma-separated list of phone numbers into a single column. If
   something can repeat, it gets its own table.
#. **Second normal form, depend on the whole key** - If a table's key is
   ``(order_id, product_id)``, a column like "customer_name" that only
   depends on ``order_id`` doesn't belong there, it belongs on the
   orders table.
#. **Third normal form, no chains** - If "zip_code" determines "city",
   don't store both directly on the customer table where they can drift
   apart. Store ``zip_code``, and look up the city from it.

**Note:** Fully normalized schemas are elegant and occasionally slow,
because answering a question now means joining five tables together.
Denormalizing on purpose, duplicating a bit of data to skip a join, is a
legitimate, common trade-off, not a mistake, as long as you're honest
with yourself about who's responsible for keeping the copies in sync.

.. _indexing:

Indexes: the whole reason queries aren't slow
-------------------------------------------------

Without an index, finding a row means the database checks every single
one, a full table scan. On a table with a hundred rows, nobody notices.
On a table with eighty million, that same query goes from instant to
"time to make coffee." An index is a separate, sorted structure that
lets the engine jump straight to what it needs.

The tradeoff is that every index has to be updated on every write, so
indexes speed up reads at the cost of slightly slower writes and extra
disk space. Adding an index to every column "just in case" is a common
beginner mistake that quietly tanks insert performance.

.. list-table::
   :header-rows: 1
   :widths: 25 35 40

   * - Index type
     - Good for
     - Not great for
   * - **B-tree**
     - Equality and range lookups, the default for most columns
     - Full-text search
   * - **Hash**
     - Exact-match lookups only, extremely fast
     - Anything involving "greater than" or ranges
   * - **Full-text**
     - Searching inside long text fields for words or phrases
     - Exact structured lookups
   * - **Geospatial (GiST/R-tree)**
     - "Find everything within 5 miles"
     - Non-spatial data

A quick habit worth building: before adding an index, run ``EXPLAIN`` on
the slow query first. It'll tell you exactly what the planner is doing,
and half the time the fix isn't a new index, it's rewriting the query so
the existing one actually gets used.

.. _transactions:

Transactions and what happens when two writes collide
------------------------------------------------------------

A transaction is a group of operations that either all succeed or all
fail together, you saw the "A" in ACID already, this is the mechanism
behind it. In SQL it usually looks like:

.. code-block:: sql

   BEGIN;
   UPDATE accounts SET balance = balance - 100 WHERE id = 1;
   UPDATE accounts SET balance = balance + 100 WHERE id = 2;
   COMMIT;

If the process crashes between the two updates, the whole thing rolls
back on restart, account 1 never loses money that account 2 didn't gain.
The harder problem is what happens when two transactions touch
overlapping data at the same time. Databases mostly solve this one of
two ways:

- **Locking** - A transaction takes a lock on a row before touching it,
  and anyone else who wants it has to wait in line. Simple to reason
  about, but a slow transaction holding a lock backs everyone else up
  behind it.
- **MVCC** - Multi-version concurrency control: instead of locking, the
  database keeps multiple snapshots of a row around, so readers never
  block writers. This is how Postgres avoids most locking headaches by
  default.

.. _cap:

The CAP theorem, in one paragraph
------------------------------------

Once a database is spread across more than one machine, the network
between those machines will eventually fail for a few seconds, a cable
gets unplugged, a switch hiccups. When that happens, CAP says you get to
pick exactly one of the following two, not both: keep answering every
request with the latest data (**Consistency**), or keep answering
requests at all even if some might be slightly stale (**Availability**).
Partition tolerance, surviving the network split in the first place,
isn't really optional for a distributed system, so in practice this is a
"C or A" choice, not a three-way pick.

**Note:** This only matters during an actual network partition, which
for most teams is a rare event. Don't let CAP talk you out of a
relational database for a normal-sized app that's never going to run
across five data centers.
