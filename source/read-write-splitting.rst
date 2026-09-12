Read/write splitting in practice
====================================

Sending reads and writes to different places so one primary isn't doing all the work alone.

.. _why-split:

Why split at all
--------------------

A single database server can only take so many queries before it runs out of
CPU, memory, or disk I/O. Most apps read far more than they write, often ten
or a hundred reads for every write. Read replicas let you scale the read side
almost independently, without touching how writes work at all.

.. _basic-shape:

The basic shape
--------------------

.. code-block:: text

   writes -> primary
   reads  -> replica 1, replica 2, replica 3 (round robin or least loaded)

The primary is the only place writes are allowed. Replicas get a copy of
every write through replication, and only serve reads.

.. _routing-layer:

Where the routing decision gets made
------------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Layer
     - How it works
     - Trade off
   * - **App code**
     - App explicitly picks primary or replica per query
     - Full control, but every query site needs to get it right
   * - **ORM/driver**
     - Some ORMs support read/write splitting natively
     - Less code, but you're trusting the ORM's judgment on edge cases
   * - **Proxy**
     - A layer like ProxySQL or PgBouncer routes based on query type
     - Centralized, but adds a hop and its own failure mode

.. _staleness-problem:

The staleness problem
--------------------------

Replication isn't instant. A write to the primary takes a moment to reach a
replica, so a read right after a write can miss it entirely.

.. note::
   The classic bug: a user submits a form, gets redirected to a page that
   reads from a replica, and doesn't see their own data. Not because
   anything's broken, just because the replica hadn't caught up yet.

.. _read-your-writes:

Read your own writes
-------------------------

A few common fixes for the staleness problem above:

- Route the read that follows a write to the primary, just for that one
  request
- Wait for replication to catch up before reading, if your database
  supports checking replica lag directly
- Cache the just-written value in the app layer so the immediate read
  never has to touch the database at all

.. _picking-replica:

Picking which replica
--------------------------

With more than one replica, you need a way to choose. Round robin is
simplest and usually fine. Some setups route by least connections, or by
geographic proximity to cut latency for users far from the primary.

.. _never-replica:

What should never go to a replica
----------------------------------------

- Anything that just wrote data and needs to read it back immediately,
  unless you've solved the staleness problem
- Financial balances or inventory counts right before a critical decision,
  like a checkout
- Anything inside the same transaction as a write, transactions generally
  have to stay on one connection to one server

.. _lag-as-signal:

Replica lag as a routing signal
--------------------------------------

A smart router can check how far behind each replica is and skip ones that
are lagging too much, instead of blindly round robining traffic to a
replica that's minutes behind.

.. code-block:: sql

   -- Postgres: check replication lag in seconds
   SELECT extract(epoch from (now() - pg_last_xact_replay_timestamp()));

.. _failover:

Failover: what happens when the primary dies
------------------------------------------------

Read replicas don't help you if the primary goes down, since writes still
have nowhere to go. Most setups pair read replicas with automatic failover,
promoting one replica to become the new primary. Your app needs to detect
this and start sending writes to the new primary, usually through a
floating connection string or DNS record that gets repointed automatically.

.. _routing-during-failover:

Connection routing during failover
-----------------------------------------

.. dropdown:: What breaks if this isn't handled well

   During a failover, there's a window where the old primary is gone and the
   new one isn't ready yet. Requests that hit this window fail. Good
   failover tooling minimizes this window to seconds, bad tooling can leave
   it open for minutes. Test failover deliberately, don't wait for a real
   outage to find out how long it takes.

.. _replicas-for-reporting:

Read replicas for reporting and analytics
------------------------------------------------

A common pattern: dedicate one replica entirely to analytics or reporting
queries, which tend to be slow and scan a lot of data. Isolating them onto
their own replica means a slow report doesn't compete with your normal
application traffic for resources.

.. _scaling-writes-different:

Scaling writes is a different problem
--------------------------------------------

Read replicas don't help with write volume at all, every replica still has
to apply every write. If writes are the bottleneck, the answer is usually
sharding, not more replicas. Read scaling and write scaling are separate
problems with separate solutions.

.. _monitoring-split-setup:

Monitoring a read/write split setup
------------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Metric
     - Why it matters
   * - Replication lag per replica
     - Tells you how stale reads from that replica might be
   * - Read/write ratio actually hitting the primary
     - Confirms routing is actually working as intended
   * - Replica connection count
     - Replicas can run out of connections too, same pooling rules apply

.. _split-mistakes:

Common mistakes
--------------------

- Assuming replication lag is always near zero, it spikes under heavy
  write load exactly when you can least afford stale reads
- Forgetting that a replica can itself become a bottleneck if too much
  read traffic piles onto too few of them
- Routing an entire user session to a replica right after they write
  something, instead of just the one read that needs freshness
