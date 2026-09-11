At scale
=========

What changes once one machine isn't enough.

.. _replication:

Replication: copies for safety and speed
-------------------------------------------

A replica is a second copy of your database that stays in sync with the
original, usually by streaming the same write-ahead log used for crash
recovery. Two reasons to bother:

- **Failover**, if the primary machine dies, a replica can be promoted
  to take over in seconds instead of you restoring last night's backup.
- **Read scaling**, send read-only queries to replicas so the primary
  machine is free to focus on handling writes.

The catch: replicas usually lag the primary by a small amount, from
milliseconds to seconds. Read from a replica right after a write and you
might not see your own change yet, a subtle bug that tends to show up as
"I just saved this and it's gone" support tickets.

.. _sharding:

Sharding: when one machine isn't enough, period
---------------------------------------------------

Replication copies the same data everywhere. Sharding does the
opposite, it splits the data itself across machines, so each one only
holds a slice. Customer IDs 1 through 1,000,000 might live on shard A,
the rest on shard B. This is what lets a system hold more data than any
single disk could, and take more write traffic than any single machine
could process.

The cost is real: a query that needs data from two shards at once, "show
me all orders across every customer", now has to ask multiple machines
and stitch the results together, and cross-shard transactions range
from awkward to effectively impossible. Most teams should exhaust
vertical scaling (a bigger machine) and read replicas before reaching
for sharding, it solves a real problem, but it's rarely the first
problem worth solving.
