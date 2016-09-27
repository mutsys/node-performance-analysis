#!/bin/sh

graphfile="request-stats.png"

request_data="request-stat-data.csv"
min_request_data_timestamp=$( tail -n +2 "$request_data" | cut -d "," -f 1 | sort | head -1 )
max_request_date_timestamp=$( tail -n +2 "$request_data" | cut -d "," -f 1 | sort -r | head -1 )
min_request_data_timestamp=$(( min_request_data_timestamp / 1000 ))
max_request_date_timestamp=$(( max_request_date_timestamp / 1000 ))


node_process_data="node-process-stats.csv"
min_node_process_data_timestamp=$( cat "$node_process_data" | cut -d "," -f 1 | sort | head -1 )
max_node_process_data_timestamp=$( cat "$node_process_data" | cut -d "," -f 1 | sort -r | head -1 )

heap_stats_data="heap-stat-data.csv"
min_heap_stats_data_timestamp=$( cat "$heap_stats_data" | cut -d "," -f 1 | sort | head -1 )
max_heap_stats_data_timestamp=$( cat "$heap_stats_data" | cut -d "," -f 1 | sort -r | head -1 )

all_min_timestamps="\
$min_request_data_timestamp
$min_node_process_data_timestamp
$min_heap_stats_data_timestamp"

all_max_timestamps="\
$max_request_data_timestamp
$max_node_process_data_timestamp
$max_heap_stats_data_timestamp"

min_timestamp=$( echo "$all_min_timestamps" | sort | head -1 )
max_timestamp=$( echo "$all_max_timestamps" | sort -r | head -1 )

total_duration=$(( max_timestamp - min_timestamp ))
hundreds=$(( total_duration / 100 ))
x_range_max=$(( (hundreds + 1) * 100 ))
x_tics=$(( x_range_max / 50 ))

gnuplot <<ENDOFPLOT
set datafile separator comma
set terminal png size 2000,1000
set output "$graphfile"

set size 1,1
set xrange[0:$x_range_max]
set format x "%.0f"
set xtics $x_tics
set xlabel "elapsed time (s)"

set multiplot
set title "node app performance analysis"
set lmargin screen 0.2

set yrange[0:20000]
set ytics 2000
set ylabel "response time (ms)" textcolor rgb "blue"

plot \
  "$request_data" every ::2 using (\$1 / 1000 - $min_timestamp):2 notitle with points pointtype 1 ps 1 lc rgb "blue",\
  "$request_data" every ::2 using (\$1 / 1000 - $min_timestamp):2 smooth sbezier notitle with lines lc rgb "blue" lw 2

set yrange[0:200]
set ytics 10 offset -10, 0
set ylabel "Percent CPU" offset -10, 0 textcolor rgb "red"

plot \
  "$node_process_data" every ::1 using (\$1 - $min_timestamp):2 notitle with points pointtype 3 ps 1 lc rgb "red",\
  "$node_process_data" every ::1 using (\$1 - $min_timestamp):2 smooth sbezier notitle with lines lc rgb "red" lw 2


set yrange[0:4000]
set ytics 200 offset -20, 0
set ylabel "Total Heap Size (MB)" offset -20, 0 textcolor rgb "green"

set samples 150

plot \
  "$heap_stats_data" every ::1 using (\$1 - $min_timestamp):3 notitle with points pointtype 4 ps 1 lc rgb "green",\
  "$heap_stats_data" every ::1 using (\$1 - $min_timestamp):3 smooth csplines notitle with lines lc rgb "green" lw 2


set yrange[0:4000]
set ytics 200 offset -30, 0
set ylabel "Used Heap Size (MB)" offset -30, 0 textcolor rgb "purple"

set samples 150

plot \
  "$heap_stats_data" every ::1 using (\$1 - $min_timestamp):7 notitle with points pointtype 4 ps 1 lc rgb "purple",\
  "$heap_stats_data" every ::1 using (\$1 - $min_timestamp):7 smooth csplines notitle with lines lc rgb "purple" lw 2



unset multiplot
ENDOFPLOT
