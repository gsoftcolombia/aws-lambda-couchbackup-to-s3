

* This function works only for CouchDB 2.x servers with SSL (https and port 6984).
* This function has been tested with CouchDB 2.x nodes.


1. Create a lambda function from scratch called 'list-couchdbs-call-backup' with NodeJS 8
2. In the form, choose create a custom role for such function with the default policy.
3. Copy and paste the function in the index.js, check if the region defined is your region.
4. Increase the timeout to 30 secs at least.
5. Save it and create the 'execute-couch-backup' function, please see the readme in the package.


