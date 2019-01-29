// Copyright © 2017, 2018 IBM Corp. All rights reserved.
// Modifications Copyright (C) 2019 Gsoft Colombia. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Tested in CouchDB 2.x Servers, a small script which backs up to an S3
// bucket, using an intermediary file on disk.

'use strict';

const stream = require('stream');
const fs = require('fs');
const url = require('url');

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});
const couchbackup = require('@cloudant/couchbackup');
const tmp = require('tmp');

/**
 * Return a promise that resolves if the bucket is available and
 * rejects if not.
 *
 * @param {any} s3 S3 client object
 * @param {any} bucketName Bucket name
 * @returns Promise
 */
function bucketAccessible(s3, bucketName) {
  return new Promise(function(resolve, reject) {
    var params = {
      Bucket: bucketName
    };
    s3.headBucket(params, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Use couchbackup to create a backup of the specified database to a file path.
 *
 * @param {any} sourceUrl Database URL
 * @param {any} backupTmpFilePath Path to write file
 * @returns Promise
 */
function createBackupFile(sourceUrl, backupTmpFilePath) {
  return new Promise((resolve, reject) => {
    couchbackup.backup(
      sourceUrl,
      fs.createWriteStream(backupTmpFilePath),
      (err) => {
        if (err) {
          return reject(err);
        }
        console.info('couchbackup to file done; uploading to S3');
        resolve('creating backup file complete');
      }
    );
  });
}

/**
 * Upload a backup file to an S3 bucket.
 *
 * @param {any} s3 Object store client
 * @param {any} backupTmpFilePath Path of backup file to write.
 * @param {any} bucket Object store bucket name
 * @param {any} key Object store key name
 * @returns Promise
 */
function uploadNewBackup(s3, backupTmpFilePath, bucket, key) {
  return new Promise((resolve, reject) => {
    console.info(`Uploading from ${backupTmpFilePath} to ${bucket}/${key}`);

    function uploadFromStream(s3, bucket, key) {
      const pass = new stream.PassThrough();

      const params = {
        Bucket: bucket,
        Key: key,
        Body: pass
      };
      s3.upload(params, function(err, data) {
        console.info('S3 upload done');
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        console.info('Upload succeeded');
        resolve();
      });

      return pass;
    }

    const inputStream = fs.createReadStream(backupTmpFilePath);
    const s3Stream = uploadFromStream(s3, bucket, key);
    inputStream.pipe(s3Stream);
  });
}

/**
 * Remove creds from a URL, e.g., before logging
 *
 * @param {string} url URL to safen
 */
function s(originalUrl) {
  var parts = new url.URL(originalUrl);
  return url.format(parts, { auth: false });
}

exports.handler = function(event, context, callback) {
  const sourceUrl = event.couchdb_source;
  const backupBucket = event.s3_bucket_name;
  console.info("Executing a Backup for " + sourceUrl + " and Pushing it to " + backupBucket);
  
  const backupName = new url.URL(sourceUrl).pathname.split('/').filter(function(x) { return x; }).join('-');
  const backupKey = `${backupName}.json`;
  const backupTmpFile = tmp.fileSync();
  const s3 = new AWS.S3({apiVersion: '2006-03-01'});

  bucketAccessible(s3, backupBucket)
    .then(() => {
      return createBackupFile(sourceUrl, backupTmpFile.name);
    })
    .then(() => {
      return uploadNewBackup(s3, backupTmpFile.name, backupBucket, backupKey);
    })
    .then(() => {
      console.info('Backup success!');
      backupTmpFile.removeCallback();
      console.info('done.');
      callback(null, "Backup Done!");
    })
    .catch((reason) => {
      console.error(`Error: ${reason}`);
      callback(reason);
    });
}
