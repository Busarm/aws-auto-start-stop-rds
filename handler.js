'use strict';



module.exports.run = (event, context, callback) => {

  const AWS = require('aws-sdk');
  const rds = new AWS.RDS();

  const start = event.start || false;
  const stop = event.stop || false;

  const START_UP_TAG = "AUTO-START";
  const SHUT_DOWN_TAG = "AUTO-STOP";

  // Get List of RDS Instances
  rds.describeDBInstances(null, function (rdserr, rdsdata) {

    if (rdserr) callback(rdsdata, null)
    if (!rdsdata) callback(new Error('Failed to get Databases'), null)

    // Loop through instance list
    rdsdata.DBInstances.forEach(function (dbInstance) {
      var rdstagParams = {
        ResourceName: dbInstance.DBInstanceArn
      }

      // Get List of tags for instance
      rds.listTagsForResource(rdstagParams, function (tagerr, tagdata) {

        var toStartup = false;
        var toShutdown = false

        // An error occurred
        callback({
          error: tagerr,
          stack: tagerr.stack
        }, null)

        // Get and loop through tag list to find required tags
        var tags = tagdata.TagList || []
        tags.forEach(function (tag) {

          // Check if Start up tag exist
          if (tag.Key && tag.Key.toUpperCase() === START_UP_TAG) {
            if (tag.Value !== '0' && tag.Value !== 'false'  && tag.Value !== false) {
              toStartup = start;
            }
          }

          // Check if Shut down tag exist
          if (stop && tag.Key && tag.Key.toUpperCase() === SHUT_DOWN_TAG) {
            if (tag.Value !== '0' && tag.Value !== 'false'  && tag.Value !== false) {
              toShutdown = stop;
            }
          }
        })


        // Process Start request
        if (toStartup) {
          var startparams = {
            DBInstanceIdentifier: dbInstance.DBInstanceIdentifier /* required */
          }
          rds.startDBInstance(startparams, function (starterr, startdata) {
            if (starterr)
              callback(starterr, null)
            else
              callback(null, startdata)
          })
        }
        else {
          console.log('Nothing to start');
        }

        // Process Stop request
        if (toShutdown) {
          var shutdownparams = {
            DBInstanceIdentifier: dbInstance.DBInstanceIdentifier
          }
          rds.stopDBInstance(shutdownparams, function (stoperr, stopdata) {
            if (stoperr)
              callback(stoperr, null)
            else
              callback(null, stopdata)
          })
        }
        else {
          console.log('Nothing to stop');
        }
      })
    })
  })
}