#!/bin/sh

ps -aef | grep grunt | grep -v grep | tr -s " " | cut -d " " -f 3 | while read pid
do
  kill $pid
done

ps -aef | grep collect-node-process-data | grep -v grep | tr -s " " | cut -d " " -f 3 | while read pid
do
  kill $pid
done

rm *csv

nohup ./collect-node-process-data.sh &

node app.js
