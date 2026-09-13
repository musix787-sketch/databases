SQLite
=========

.. _sqlite-what-it-is:

What it is
--------------

SQLite is a relational database that runs inside your application process
as a library, not a separate server. The entire database is one file on
disk. There's no server to start, no port to open, no user accounts to
configure.

.. _sqlite-how-it-works:

How it works under the hood
----------------------------------

Because SQLite is embedded, "connecting" to it just means opening a file.
Concurrency is handled with file-level locking: historically a single
writer at a time for the whole database, though WAL mode (write-ahead
logging) allows one writer to proceed concurrently with multiple readers.

Why "one writer at a time" is rarely the problem people expect
-----------------------------------

Most applications, even fairly busy ones, spend far more time reading
than writing, and individual writes are fast. The write-serialization
limit becomes a real problem only under genuinely concurrent, sustained
write load, exactly the situation SQLite was never designed for.

.. _sqlite-setup:

Setting it up
------------------

There's no server to install for most languages, SQLite ships as a
library.

Python (built in)

.. code-block:: python

   import sqlite3
   conn = sqlite3.connect("app.db")

Node.js

.. code-block:: bash

   npm install better-sqlite3

CLI

.. code-block:: bash

   sqlite3 app.db

.. _sqlite-first-queries:

Your first queries
-----------------------

.. code-block:: sql

   CREATE TABLE notes (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       body TEXT NOT NULL,
       created_at TEXT DEFAULT (datetime('now'))
   );

   INSERT INTO notes (body) VALUES ('remember to enable WAL mode');

   SELECT * FROM notes ORDER BY created_at DESC;

.. _sqlite-functionality:

Notable functionality
--------------------------

Type flexibility

- Columns have "type affinity" rather than strict types
- You can insert text into an integer column; SQLite tries to coerce it rather than reject it
- Convenient for scripting, occasionally a footgun

Extensions

- FTS5 for full-text search, built in
- JSON1 extension for querying JSON columns
- R-Tree module for spatial indexing

.. _sqlite-wal-mode:

WAL mode
-------------

.. code-block:: sql

   PRAGMA journal_mode=WAL;

.. tip::
   Turn this on for almost every real application. It allows readers and
   a writer to work concurrently instead of blocking each other, and it's
   one line.

.. _sqlite-in-production:

In production
-----------------

.. warning::
   SQLite's biggest production failure mode isn't the database itself,
   it's putting the file on a network filesystem (NFS, some cloud file
   mounts). File locking semantics on network filesystems are unreliable,
   and SQLite depends on them being correct.

.. list-table::
   :header-rows: 1
   :widths: 50 50

   * - Good fit
     - Poor fit
   * - Local file on local disk
     - Network-mounted file share
   * - Single app process (or WAL + few readers)
     - Many processes writing concurrently
   * - Mobile and desktop apps
     - Multi-server web backend with shared state

.. _sqlite-pros-cons:

Pros and cons
------------------

Pros

- Zero operational overhead, no server to run or patch
- Extremely fast for local, single-process access
- The entire database is one portable file
- Public domain, no licensing concerns at all

Cons

- Not designed for many concurrent writers
- No built-in replication or clustering
- Network filesystems break its locking assumptions
- Limited support for concurrent connections from multiple servers

.. _sqlite-when-to-use:

When to reach for it
-------------------------

Good fits: mobile and desktop applications, embedded systems, local
caches, command-line tools, test suites that need a real database without
spinning up a server, and small to medium single-server web apps with
modest write concurrency.

.. _sqlite-not-fit:

When it's not the right fit
--------------------------------

- Multi-server applications needing a shared, centrally accessible
  database
- High write concurrency from many independent processes
- Anything requiring built-in replication for high availability

