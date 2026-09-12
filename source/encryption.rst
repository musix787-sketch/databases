Encryption
=============

Three different things people mean when they say "the database is encrypted."

.. _encryption-types:

The three layers
--------------------

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Layer
     - Protects against
     - Doesn't protect against
   * - **At rest**
     - Someone stealing the physical disk or a storage snapshot
     - Anyone with valid database credentials, they see plaintext like normal
   * - **In transit**
     - Someone intercepting traffic between your app and the database
     - Data sitting on disk, or anyone who compromises the app itself
   * - **Column level**
     - Anyone with database access, including admins, from reading a specific
       sensitive field
     - Nothing if the encryption key is stored next to the data

.. note::
   These aren't alternatives, they're layers. Most production systems want
   at rest and in transit as a baseline, and add column level encryption only
   for specific fields, like SSNs or payment details, where even database
   admins shouldn't casually see plaintext.

.. _at-rest:

Encryption at rest
-----------------------

Almost every managed cloud database offers this as a checkbox, it encrypts
the actual disk. It's close to free to turn on and protects against a real,
if uncommon, threat, someone getting hold of a backup file or a decommissioned
disk.

.. _in-transit:

Encryption in transit
--------------------------

This means requiring SSL/TLS on the connection between your app and the
database, not just supporting it.

.. code-block:: text

   # Postgres connection string, requiring SSL
   postgresql://user:pass@host:5432/db?sslmode=require

``sslmode=require`` encrypts the connection but doesn't verify the server's
certificate. For anything sensitive, ``verify-full`` is the stronger option,
it also protects against someone impersonating your database.

.. _column-level:

Column level encryption
----------------------------

For fields that are sensitive enough that even a database admin, or an
attacker with valid read access, shouldn't be able to just read them.

**What this actually looks like**
----------------------------------
The application encrypts the value before it's ever sent to the database,
and decrypts it after reading it back. The database just stores
ciphertext, it has no idea what the real value is. This means you can't
run a normal ``WHERE email = ?`` query against it directly, searching
encrypted columns needs its own pattern, like a separate searchable hash
of the value.

.. warning::
   Column level encryption is only as good as where the key lives. Storing
   the encryption key in the same database, or in the same config file as the
   connection string, defeats most of the point.

.. _key-management:

Key management basics
--------------------------

Encryption is only as strong as how well the key is protected. A dedicated
key management service, separate from the database and the app, is the
usual answer, it controls who can use a key to encrypt or decrypt, without
ever exposing the raw key itself to the app.

.. _key-rotation:

Rotating encryption keys
------------------------------

Like credentials, keys shouldn't live forever. Rotation for encryption keys
is trickier than for passwords though, data encrypted with an old key
usually needs to stay decryptable with that old key, or be re-encrypted with
the new one. Most key management services handle keeping old key versions
around specifically for this.

.. _encrypting-backups-here:

Encrypting backups too
----------------------------

Worth repeating here specifically, encryption at rest on the live database
doesn't automatically cover a backup file that's been copied somewhere else.
Confirm your backup pipeline encrypts the file itself, not just the
original disk.

.. _client-vs-server-side:

Client side vs server side encryption
--------------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 25 40 35

   * - Type
     - Who does the encrypting
     - Trade off
   * - **Server side**
     - The database or storage layer
     - Simple, transparent to the app, but the server sees plaintext at
       some point
   * - **Client side**
     - The application, before data is ever sent
     - The server never sees plaintext at all, but you lose the ability to
       query or index on that data normally

.. _tokenization:

Tokenization as an alternative
------------------------------------

Instead of storing an encrypted value, some systems store a random token
that has no mathematical relationship to the real value, with the real
value kept in a separate, tightly controlled vault. Common for payment card
data, where even encrypted storage carries more compliance weight than a
token that's meaningless on its own.

.. _compliance-drivers:

What compliance actually requires
----------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Standard
     - Roughly covers
     - Typical requirement
   * - **PCI DSS**
     - Payment card data
     - Card numbers can't be stored in plaintext, tokenization is common
   * - **HIPAA**
     - Health data, in the US
     - Encryption at rest and in transit, strict access controls
   * - **GDPR**
     - Personal data, EU
     - Doesn't mandate encryption specifically, but expects "appropriate"
       protection, and encryption is the usual answer

None of these are a substitute for actually reading the specific
requirements that apply to you, this is just the rough shape.

.. _encryption-performance:

The performance cost
-------------------------

At rest encryption is close to free on modern hardware. Column level
encryption costs more, every read and write for that field means an extra
encrypt or decrypt step, and searching an encrypted column directly isn't
possible without extra work like a separate searchable hash.

.. _encrypting-exports:

Logs and exports carry data too
---------------------------------------

Encryption on the database doesn't help if a debug log prints a full row
including a sensitive field, or a CSV export sits unencrypted in someone's
downloads folder. Worth checking where sensitive fields might end up
outside the database entirely, not just how they're stored inside it.

.. _tls-cert-management:

Managing TLS certificates
--------------------------------

Certificates expire, and an expired certificate on your database connection
can cause a sudden, confusing outage where every connection attempt starts
failing at once. Automate renewal where possible, and alert well before an
expiry date, not after.

.. _testing-encryption:

Confirming it's actually working
---------------------------------------

It's worth periodically verifying encryption is doing what you think,
checking a connection is actually using TLS and not silently falling back to
plaintext, or confirming a backup file is genuinely unreadable without the
key. A misconfigured setting that quietly disables encryption is easy to
miss until someone goes looking.
