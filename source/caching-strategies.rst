Caching strategies
======================

Making the database do less work by not asking it the same question twice.

.. _caching-patterns:

The main patterns
---------------------

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Pattern
     - How it works
     - Trade off
   * - **Cache aside**
     - App checks cache first, on a miss reads the database and fills the
       cache
     - Simple, but the first request after any miss is always slow
   * - **Write through**
     - Every write goes to the cache and the database together
     - Cache stays fresh, but every write is now two operations
   * - **Write behind**
     - Writes go to the cache immediately, database gets updated
       asynchronously
     - Fast writes, but a crash before the async write can lose data

Cache aside is the default most teams reach for first, it's the easiest to
reason about and to remove later if it's not helping.

.. _cache-aside-example:

Cache aside in practice
----------------------------

.. code-block:: python

   def get_user(id):
       cached = redis.get(f"user:{id}")
       if cached:
           return cached

       user = db.query("SELECT * FROM users WHERE id = ?", id)
       redis.set(f"user:{id}", user, expire=300)
       return user

The ``expire=300`` matters as much as the caching itself. Without it, a cache
never forgets, and you'll be debugging "why is this data six months stale"
instead of a slow query.

.. _invalidation:

Cache invalidation
-----------------------

The famously hard part. Two honest approaches:

- **Time based (TTL)** - just let entries expire after a fixed window. Simple,
  and wrong for at most that window of time.
- **Event based** - explicitly delete or update the cache entry whenever the
  underlying data changes. Correct, but easy to miss a code path that writes
  to the database without touching the cache.

.. note::
   Most production systems use both. TTL as a safety net in case an
   invalidation gets missed, event based invalidation for anything that needs
   to feel instant.

.. _what-not-to-cache:

What not to cache
-----------------------

A few things that usually don't belong in a cache

- Anything where a stale read causes real harm, account balances,
     inventory counts right before checkout
- Data that changes on almost every read anyway, caching buys you nothing
     if the cache would miss most of the time
- Anything already fast. Caching a query that takes 2ms adds complexity
     for a saving nobody will notice

Caching is a trade of correctness for speed. Reach for it once you know
exactly which queries are slow and how stale a response can safely be, not as
a first move.

.. _read-through:

Read through caching
-------------------------

Similar to cache aside, but the cache itself, not the app, is responsible
for fetching from the database on a miss. The app only ever talks to the
cache. Less code in the app, but means the cache layer needs to know how to
query the database, which not every caching tool supports out of the box.

.. _cache-stampede:

Cache stampede
-------------------

A popular cache entry expires, and a burst of simultaneous requests all miss
at once and all hit the database at the same time trying to refill it,
sometimes bringing it down.

A common fix
--------------------------------------

Have only the first request that misses actually query the database,
while the rest wait briefly for that result instead of also querying.
Often called request coalescing or a "single flight" pattern.

.. _local-vs-distributed:

Local cache vs distributed cache
--------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 25 35 40

   * - Type
     - Where it lives
     - Trade off
   * - **Local**
     - In each app server's own memory
     - Fastest possible reads, but every server has its own copy, so
       invalidation has to reach all of them
   * - **Distributed**
     - A separate service like Redis, shared by all app servers
     - One copy to invalidate, but every read is a network call

Many production systems use both, a small local cache for extremely hot
data, backed by a distributed cache for everything else.

.. _cache-warming:

Cache warming
------------------

Starting with an empty cache means the first wave of requests after a
deploy or restart all miss at once. Warming pre-loads known hot data before
traffic arrives, avoiding that cold start slowdown.

.. _eviction-policies:

Eviction policies
----------------------

When a cache fills up, something has to be removed to make room.

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Policy
     - Removes
     - Good for
   * - **LRU**
     - Least recently used
     - General purpose, the sensible default
   * - **LFU**
     - Least frequently used
     - Data with a stable set of hot items over time
   * - **TTL only**
     - Whatever's oldest by time, regardless of use
     - Data with a natural, known freshness window

.. _multi-layer-caching:

Caching at multiple layers
--------------------------------

A CDN can cache full responses at the edge, the app can cache query results,
and the database itself caches data in memory. Each layer removes work from
everything behind it. The earliest layer that can safely serve a request is
almost always the cheapest place to serve it from.

.. _caching-aggregates:

Caching computed and aggregated data
-------------------------------------------

Some of the best caching targets aren't raw rows, they're the result of an
expensive aggregation, like a dashboard total or a leaderboard, that's
genuinely slow to compute and doesn't need to be perfectly real time.

.. _cache-key-design:

Designing cache keys
-------------------------

.. code-block:: text

   user:1234:profile
   user:1234:orders:page:2
   product:5678:price:region:us

A clear, consistent key pattern makes it possible to invalidate related
groups of keys together, and avoids accidental collisions between unrelated
data that happen to hash similarly.

.. _cache-effectiveness:

Measuring whether the cache is actually helping
--------------------------------------------------------

Track hit rate, the percentage of reads served from cache instead of the
database. A cache with a low hit rate is adding complexity and a network
hop for very little benefit, and is worth reconsidering, not just tuning.

.. _caching-consistency:

Caching and consistency trade offs
------------------------------------------

Every cache is a bet that slightly stale data is an acceptable price for
speed. That bet is fine for a product listing, and a bad idea for a bank
balance. Decide this deliberately per piece of data, not as a blanket rule
across the whole app.
