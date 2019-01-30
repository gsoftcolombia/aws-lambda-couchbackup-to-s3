list-couchdbs-call-backup Guide
=========

**Important**

* This function works only for CouchDB 2.x servers with SSL (https and port 6984).
* This function has been tested with CouchDB 2.x nodes.

**Guide**

1. Create a lambda function from scratch called 'list-couchdbs-call-backup' with NodeJS 8
2. In the form, choose create a custom role for such function with the default policy.
3. Create a custom role for giving permissions to invoke another lambda function and attach it to previous created role:

```json

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}

```

4. Add AWSLambdaRole Policy to previous created role (Point 2).
5. Copy and paste the function in the index.js, check if the region defined is your region.
6. Increase the timeout to 1 min at least.
7. Save it and create the 'execute-couch-backup' function, please see the readme in the package.
8. After create both lambda functions you can create a test event in 'list-couchdbs-call-backup' function using something like:

```json
{
  "host": "COUCHDB_SERVER_DNS_WITHOUT_HTTPS_PREFIX",
  "port": "6984",
  "auth": "COUCHDB_USER:COUCHDB_PASSWORD",
  "s3_bucket_name": "YOUR_S3_BUCKET_NAME"
}
```
