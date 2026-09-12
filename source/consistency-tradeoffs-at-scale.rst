Consistency trade offs at scale
====================================

Every distributed database is making a bet about how stale a read is allowed to be, whether it tells you or not.

.. _strong-vs-eventual:

Strong vs eventual, the short version
--------------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 25 40 35

   * - Model
     - Guarantee
     - Cost
   * - **Strong consistency**
     - Every read sees the latest write, no matter which node answers
     - Slower, often needs coordination across nodes on every read or
       write
   * - **Eventual consistency**
     - Reads might be stale for a while, but will catch up eventually
     - Fast and available even during network issues, at the cost of
       certainty

Neither is "correct," they're a trade off between speed and certainty, and
different parts of the same app often want different points on that
spectrum.

.. _why-cant-have-both:

Why you can't have both, really
--------------------------------------

Once data lives on more than one machine, a network hiccup between them is
inevitable eventually. When that happens, the system has to choose: refuse
to answer until it can guarantee correctness, or answer anyway with
whatever it has, possibly stale. That choice is the whole trade off,
dressed up in different language by different databases.

.. _read-your-writes-consistency:

Read your own writes, at least
-------------------------------------

A lot of real systems don't need full strong consistency everywhere, they
need something narrower: a user should always see their own writes, even
if other users might see slightly stale data for a moment. This is a
common middle ground, sometimes called "read your writes" consistency.

.. _per-system-consistency:

Per system, what you actually get
----------------------------------------

Postgres (single primary)
* Strong consistency by default on the primary.
* Reads from replicas can be stale depending on replication lag.

MongoDB
* **Tunable per query:** majority read/write concern for strong guarantees, or relaxed levels for speed. Defaults have gotten stricter over time, but it's still a per-query decision.

DynamoDB
* Eventually consistent reads by default, cheaper.
* Strongly consistent reads are available, cost more and can't span multiple regions.

.. _what-eventual-means:

What "eventual" actually means in practice
--------------------------------------------------

It doesn't mean "sometimes wrong forever." It means there's a window,
usually milliseconds, occasionally longer under load, where different
nodes might disagree, and the system guarantees they'll converge once
writes stop arriving and replication catches up. The practical question is
how long that window actually gets in your specific setup, not whether it
exists.

.. _picking-level-per-data:

Picking a level per piece of data
----------------------------------------

.. tip::
   Not every table needs the same consistency level. An account balance
   probably wants strong consistency. A "like count" on a post can happily
   be eventually consistent, nobody notices if it's a few seconds behind.

.. _read-repair:

Read repair and anti-entropy
-----------------------------------

Some eventually consistent systems actively fix stale copies in the
background, comparing data between nodes during normal reads (read
repair) or on a schedule (anti-entropy), rather than waiting for the next
write to naturally propagate.

.. _quorum-reads-writes:

Quorum reads and writes
----------------------------

A common middle ground technique: require a majority of nodes to agree
before confirming a write or serving a read, instead of requiring all
nodes or just one.

.. code-block:: text

   3 replicas, write quorum = 2, read quorum = 2
   Any read and any write are guaranteed to overlap on at least one node,
   so a read always sees the latest confirmed write.

Tuning these numbers up or down trades latency against consistency
guarantees directly.

.. _multi-region-sharper:

Multi-region makes this sharper
--------------------------------------

Within one data center, network delay between nodes is small, milliseconds.
Across regions, it can be hundreds of milliseconds. Strong consistency
across regions means every write waits on that cross-region round trip,
which is often too slow for a real user-facing request. This is usually
the actual reason a system reaches for eventual consistency, not because
anyone loves the trade off, but because the speed of light makes the
alternative too slow.

.. _conflict-resolution:

Conflict resolution
------------------------

If two writes to the same piece of data happen in different regions before
they've synced, something has to decide which one wins.

- **Last write wins**, simplest, but the loser's write is just gone
- **Application-level merge**, the app decides how to combine both, more
  correct but more code
- **CRDTs**, data structures specifically designed so concurrent updates
  merge automatically without conflict, common for counters and sets

.. _testing-assumptions:

Testing your assumptions
------------------------------

.. dropdown:: A way to actually verify what your database gives you

   Write a value, immediately read it from a different node or replica
   than the one you wrote to, and check what comes back. Do this under
   load, not just once, quietly. It's easy to assume strong consistency
   because it worked in a quick manual test, and be wrong under real
   concurrent traffic.

.. _consistency-and-caching:

Consistency and caching interact
---------------------------------------

A cache sitting in front of a strongly consistent database can quietly
turn the whole system eventually consistent from the app's point of view,
since the cache itself is a stale copy until it expires or gets
invalidated. Worth remembering that your database's consistency guarantee
only covers the database, not everything sitting in front of it.

.. _decision-guide:

A rough decision guide
---------------------------

.. list-table::
   :header-rows: 1
   :widths: 50 50

   * - If this matters most
     - Lean toward
   * - Money, inventory, anything where being wrong is expensive
     - Strong consistency
   * - Speed and availability during network issues
     - Eventual consistency
   * - Users mostly caring about their own recent actions
     - Read your writes
