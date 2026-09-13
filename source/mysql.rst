MySQL
========

.. _mysql-what-it-is:

What it is
--------------

MySQL is an open source relational database, owned by Oracle since 2010,
with MariaDB as its most popular community fork. It's the M in the classic
LAMP stack and still runs a huge share of the web's CMSes, e-commerce
platforms, and internal tools.

.. _mysql-how-it-works:

How it works under the hood
----------------------------------

MySQL's defining trait is pluggable storage engines: the SQL layer on top
is the same, but the actual storage and locking behavior underneath can
differ. InnoDB is the default and only one most people use today, it's
transactional, MVCC-based, and row-locking. The older MyISAM engine is
table-locking and non-transactional, mostly a historical footnote now.

Why storage engines matter today
-----------------------------------

Even though InnoDB is the default, the engine concept still shows up:
some managed MySQL offerings and specialized forks use alternative
engines for specific workloads (columnar analytics, in-memory tables).
Knowing ``SHOW ENGINES;`` exists saves confusion later.

.. _mysql-setup:

Setting it up
------------------

Docker

.. code-block:: bash

   docker run --name mysql-db -e MYSQL_ROOT_PASSWORD=secret -p 3306:3306 -d mysql:8

Ubuntu

.. code-block:: bash

   sudo apt install mysql-server
   sudo mysql_secure_installation

macOS (Homebrew)

.. code-block:: bash

   brew install mysql
   brew services start mysql

.. _mysql-first-queries:

Your first queries
-----------------------

.. code-block:: sql

   CREATE TABLE orders (
       id INT AUTO_INCREMENT PRIMARY KEY,
       customer_id INT NOT NULL,
       total DECIMAL(10,2) NOT NULL,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   ) ENGINE=InnoDB;

   INSERT INTO orders (customer_id, total) VALUES (42, 19.99);

   SELECT customer_id, SUM(total) AS spent
   FROM orders
   GROUP BY customer_id
   ORDER BY spent DESC
   LIMIT 10;

.. _mysql-functionality:

Notable functionality
--------------------------

Replication

- Classic binlog-based async replication

- Group Replication for multi-primary setups

- Widely supported by every managed cloud offering

JSON support

- Native ``JSON`` column type since 5.7

- Generated columns can index into JSON fields

- Not as deep as Postgres's JSONB, but solid for most needs

.. _mysql-indexes:

Indexing and the clustered key
-------------------------------------

.. important::
   InnoDB tables are clustered on the primary key, meaning row data is
   physically stored in primary key order. A poorly chosen primary key
   (like a random UUID) can fragment the table and hurt write performance
   far more than in databases without clustered storage.

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Index type
     - Notes
   * - **Primary key**
     - Clustered; the actual row storage order
   * - **Secondary index**
     - Stores the primary key value, not a row pointer, one extra lookup
   * - **Fulltext**
     - Basic text search, much simpler than Postgres's text search

.. _mysql-in-production:

In production
-----------------

.. code-block:: sql

   -- Find the queries eating the most time right now
   SELECT * FROM performance_schema.events_statements_summary_by_digest
   ORDER BY sum_timer_wait DESC
   LIMIT 5;

.. code-block:: text

   app -> read replica (SELECT)
   app -> primary (INSERT/UPDATE/DELETE)

.. warning::
   Auto-incrementing integer primary keys and replication don't always
   play nicely with multi-primary setups, two primaries can generate the
   same ID for different rows unless you configure ``auto_increment_offset``
   correctly.

.. _mysql-pros-cons:

Pros and cons
------------------

Pros

- Extremely well understood, huge hosting and tooling ecosystem
- Fast for simple read-heavy web workloads
- Easy replication setup for read scaling
- Free and open source (with a commercial tier from Oracle)

Cons

- Historically weaker standards compliance than Postgres
- JSON and advanced data types feel bolted on, not native
- Clustered primary key design punishes bad key choices
- Fewer extensibility options than Postgres's extension system

.. _mysql-when-to-use:

When to reach for it
-------------------------

Good fits: WordPress and other PHP-ecosystem applications, teams that
already have deep MySQL operational experience, and read-heavy web
applications where the tooling and hosting ecosystem matters as much as
the database engine itself.

.. _mysql-not-fit:

When it's not the right fit
--------------------------------

- Applications leaning heavily on advanced SQL (window functions history
  was rocky, though modern MySQL has caught up) or rich JSON querying
- Teams that want a single extensible platform instead of bolting on
  separate tools for search, geospatial, etc.

.. seealso::
   :doc:`read-write-splitting` covers the replica patterns MySQL setups
   lean on heavily.
