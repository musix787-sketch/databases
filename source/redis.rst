Redis
========

.. _redis-what-it-is:

What it is
--------------

Redis is an in-memory key-value store. It's often called a database, and
it can be configured to act like one, but its default behavior is closer
to a very fast, very flexible cache that can optionally persist to disk.

.. _redis-how-it-works:

How it works under the hood
----------------------------------

Redis is single-threaded for command execution (newer versions parallelize
I/O, but command execution is still serial), which is exactly why it's so
predictable and fast, no lock contention between commands. Data lives in
memory as native structures: strings, hashes, lists, sets, sorted sets,
streams, not rows or documents.

Why single-threaded is a feature, not a limitation
-----------------------------------

Every command runs to completion before the next one starts, so there's
no need for locks around individual operations. This makes some
operations (like ``INCR``) atomic for free, without any explicit
transaction. The trade-off is that one slow command (an unbounded
``KEYS *`` on a huge dataset) blocks everything else.

.. _redis-setup:

Setting it up
------------------

Docker

.. code-block:: bash

   docker run --name redis -p 6379:6379 -d redis:7

macOS (Homebrew)

.. code-block:: bash

   brew install redis
   brew services start redis

Ubuntu

.. code-block:: bash

   sudo apt install redis-server
   sudo systemctl enable --now redis-server

.. _redis-first-commands:

Your first commands
------------------------

.. code-block:: text

   SET session:abc123 "user:42" EX 3600
   GET session:abc123
   HSET user:42 name "Ada" plan "pro"
   HGET user:42 plan
   ZADD leaderboard 1500 "ada" 1200 "grace"
   ZREVRANGE leaderboard 0 9 WITHSCORES

.. _redis-functionality:

Notable functionality
--------------------------

.. grid:: 2

   .. grid-item-card:: Data structures

      - Strings, hashes, lists, sets, sorted sets
      - HyperLogLog for approximate cardinality counting
      - Streams, an append-only log structure similar to Kafka topics

   .. grid-item-card:: Beyond caching

      - Pub/sub messaging between processes
      - Distributed locks (with caveats, see below)
      - Rate limiting using atomic counters with expiry

.. _redis-persistence:

Persistence modes
----------------------

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Mode
     - How it works
     - Trade off
   * - **RDB**
     - Periodic point-in-time snapshots to disk
     - Fast restarts, but can lose the last few minutes of writes
   * - **AOF**
     - Every write appended to a log, replayed on restart
     - Much less data loss, larger files, slower restarts
   * - **None**
     - Pure in-memory, nothing written to disk
     - Fastest, but a restart means total data loss

.. warning::
   The default configuration on many quick-start guides doesn't enable
   persistence at all. If Redis is holding data you actually can't afford
   to lose, check this explicitly, don't assume.

.. _redis-eviction:

Eviction policies
----------------------

When memory fills up, Redis needs a policy for what to evict.

.. code-block:: text

   maxmemory 2gb
   maxmemory-policy allkeys-lru

``noeviction`` (the default) just starts rejecting writes once full, which
surprises people who expected automatic eviction like a cache.

.. _redis-in-production:

In production
-----------------

.. code-block:: text

   redis-cli --latency
   redis-cli INFO memory

.. important::
   Redis Cluster shards data automatically across nodes, but it's a
   meaningfully different operational model from a single Redis instance,
   not all commands work the same way across a sharded keyspace (no
   cross-slot multi-key operations without hash tags).

.. _redis-pros-cons:

Pros and cons
------------------

.. grid:: 2

   .. grid-item-card:: Pros

      - Extremely low latency, sub-millisecond for most operations
      - Rich data structures beyond plain key-value
      - Simple to run, simple to reason about
      - Great for caching, sessions, rate limiting, leaderboards

   .. grid-item-card:: Cons

      - Everything lives in RAM, so dataset size is bounded by memory cost
      - Persistence is opt-in and has real trade-offs either way
      - Not built for complex querying or relationships
      - Single-threaded execution means one slow command hurts everyone

.. _redis-when-to-use:

When to reach for it
-------------------------

Good fits: caching layers in front of a slower primary database, session
storage, rate limiting, real-time leaderboards, and pub/sub messaging
between services that doesn't need message durability guarantees.

.. _redis-not-fit:

When it's not the right fit
--------------------------------

- Data that must survive a crash with zero loss and no persistence tuning
- Datasets too large to reasonably fit in memory
- Anything needing rich relational queries or joins

.. seealso::
   :doc:`caching-strategies` for patterns on using Redis as a cache
   layer specifically.
