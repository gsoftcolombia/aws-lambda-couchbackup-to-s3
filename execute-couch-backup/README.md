execute-couch-backup Guide
=========

**Important**

* This function works only for CouchDB 2.x servers with SSL (https and port 6984).
* This function has been tested with CouchDB 2.x nodes.

**Guide**

1. Create a lambda function from scratch called 'execute-couch-backup' with NodeJS 8
2. In the form, choose create a custom role for such function with the default policy.
3. Create a custom role for access to s3 and attach it to previous created role:

```json

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "s3:PutAccountPublicAccessBlock",
                "s3:GetAccountPublicAccessBlock",
                "s3:ListAllMyBuckets",
                "s3:HeadBucket"
            ],
            "Resource": "*"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::*/*",
                "arn:aws:s3:::YOUR_BUCKET_NAME"
            ]
        }
    ]
}

```

4. In your local machine, install node packages and generate the zip file to upload:

```bash

cd execute-couch-backup
npm install --save 
zip -r ~/Desktop/lambda_func.zip execute-couch-backup.js node_modules

```

5. Upload the zip.
6. Change the default Handler for execute-couch-backup.handler
7. Increase the timeout to 1 min at least.
8. Save it.
9. After create both lambda functions you can create a test event in this function using something like:

```json
{
  "couchdb_source": "https://COUCHDB_USER:COUCHDB_PASSWORD@COUCHDB_SERVER_DNS:6984/DATABASE_TO_BACKUP",
  "s3_bucket_name": "YOUR_S3_BUCKET_NAME"
}
```




