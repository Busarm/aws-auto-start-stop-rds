'use strict';



module.exports.run = (event, context, callback) => {

  const AWS = require('aws-sdk');
  const rds = new AWS.RDS();

  const start = event.start || false;
  const stop = event.stop || false;

  const START_UP_TAG = "AUTO-START";
  const SHUT_DOWN_TAG = "AUTO-STOP";

  // Result of operation
  var result = [];

  // Get List of RDS Instances
  rds.describeDBInstances(null, function (rdserr, rdsdata) {

    // An error occurred
    if (rdserr) return callback(rdserr, null)

    // Loop through instance list
    rdsdata.DBInstances.forEach(function (dbInstance) {

      var rdstagParams = {
        ResourceName: dbInstance.DBInstanceArn
      }

      // If status is available
      if (dbInstance.DBInstanceStatus === 'available' || dbInstance.DBInstanceStatus === 'stopped') {

        // Get List of tags for instance
        rds.listTagsForResource(rdstagParams, function (tagerr, tagdata) {

          var toStartup = false;
          var toShutdown = false
          var response = {
            autoStart: false,
            autoStop: false
          };

          // An error occurred
          if (tagerr) return callback(tagerr, null);

          // Get and loop through tag list to find required tags
          var tags = tagdata.TagList || []
          tags.forEach(function (tag) {

            // Check if Start up tag exist
            if (tag.Key && tag.Key.toUpperCase() === START_UP_TAG) {
              if (tag.Value !== '0' && tag.Value !== 'false' && tag.Value !== false) {
                toStartup = start;
              }
            }

            // Check if Shut down tag exist
            if (stop && tag.Key && tag.Key.toUpperCase() === SHUT_DOWN_TAG) {
              if (tag.Value !== '0' && tag.Value !== 'false' && tag.Value !== false) {
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
              // An error occurred
              if (starterr) return callback(starterr, null);
              response.autoStart = true;
              response.autoStartData = startdata;
            })
          } else {
            response.autoStart = false;
          }

          // Process Stop request
          if (toShutdown) {
            var shutdownparams = {
              DBInstanceIdentifier: dbInstance.DBInstanceIdentifier
            }
            rds.stopDBInstance(shutdownparams, function (stoperr, stopdata) {
              // An error occurred
              if (stoperr) return callback(stoperr, null);
              response.autoStop = true;
              response.autoStopData = stopdata;
            })
          } else {
            response.autoStop = false;
          }

          // Add response for id
          result.push({ id: dbInstance.DBInstanceIdentifier, result: response});
        })
      }
    })
  })

  // Send response
  callback(null, result);
}