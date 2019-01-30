// Copyright © 2019 Gsoft Colombia. All rights reserved.
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

// Small script which list databases from a CouchDB Server
// and call in async mode a AWS Lambda function for backup.

const https = require('https');
var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
var lambda = new AWS.Lambda();
var lambda_params;

function executeHttpsRequest(params, postData = false) {
    return new Promise(function(resolve, reject) {
        var req = https.request(params, function(res) {
            // reject on bad status
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            // cumulate data
            var body = [];
            res.on('data', function(chunk) {
                body.push(chunk);
            });
            // resolve on end
            res.on('end', function() {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch(e) {
                    reject(e);
                }
                resolve(body);
            });
        });
        // reject on request error
        req.on('error', function(err) {
            // This is not a "Second reject", just a different sort of failure
            reject(err);
        });
        if (postData) {
            req.write(postData);
        }
        // IMPORTANT
        req.end();
    });
}

exports.handler = function(event, context, callback) {
    var params = {
        host: event.host,
        port: event.port,
        auth: event.auth,
        method: 'GET',
        path: '/_all_dbs'
    };
    const backupBucket = event.s3_bucket_name;
    
    var invoke_payload;

    executeHttpsRequest(params)
    .then(function(databases) {
        var index;
        for (index = 0; index < databases.length; ++index) {
            console.log("Executing async backup for " + databases[index]);
            
            invoke_payload = '{'
            invoke_payload += '"couchdb_source": "https://'+event.auth+'@'+event.host+':'+event.port+'/'+databases[index]+'",';
            invoke_payload += '"s3_bucket_name": "'+backupBucket+'"}';
            
            console.info(invoke_payload);
            
            lambda_params = {
                FunctionName: 'execute-couch-backup',
                InvocationType: 'RequestResponse',
                LogType: 'Tail',
                Payload: invoke_payload
            };
            lambda.invoke(lambda_params, function(){});
        }
        
        callback(null, "Operation Terminated!");
    }) 
    .catch((reason) => {
      console.error(`Error: ${reason}`);
      callback(reason);
    });
}


