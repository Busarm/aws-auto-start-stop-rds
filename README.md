# Busarm Auto-Start Auto-Stop RDS

## Description

Serverless application to auto-start and auto-stop RDS database at a given time	

## Specification

- NodeJs - Version = 12.x

## Instructions
- Add cron start and stop schedule in `serverless.yml`
  - See (https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html)
- Add the following tags to the target RDS Database
  - `AUTO-START = 1` -  To Auto-start database at the scheduled time
  - `AUTO-STOP = 1` -  To Auto-stop database at the scheduled time

## Deployment 
- See (https://serverless.com)
- Run `sls deploy`