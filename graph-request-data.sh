#!/bin/sh

graphfile="request-stats.png"

request_data="request-stat-data.csv"
min_request_data_timestamp=$( tail -n +2 "$request_data" | cut -d "," -f 1 | sort -g -S 10M | head -1 | xargs -I {} echo "{} / 1000" | bc )
max_request_date_timestamp=$( tail -n +2 "$request_data" | cut -d "," -f 1 | sort -r -g -S 10M | head -1 | xargs -I {} echo "{} / 1000" | bc )
num_requests=$( tail -n +2 "$request_data" | wc -l )
skip_request_durations=$(( num_requests * 25 / 1000 ))
max_request_duration_secs=$( tail -n +2 "$request_data" | cut -d "," -f 2 | sort -r -g -S 10M | tail -n +"$skip_request_durations" | head -1 | xargs -I {} echo "{} / 1000" | bc )

node_process_data="node-process-stats.csv"
min_node_process_data_timestamp=$( cat "$node_process_data" | cut -d "," -f 1 | sort -g -S 1M | head -1 )
max_node_process_data_timestamp=$( cat "$node_process_data" | cut -d "," -f 1 | sort -r -g -S 1M | head -1 )

uniq_node_process_pcpu=$( cat "$node_process_data" | cut -d "," -f 2  | cut -d "." -f 1 | uniq | wc -l )
skip_node_process_pcpu=$(( uniq_node_process_pcpu / 25 ))
max_node_process_pcpu=$( cat "$node_process_data" | cut -d "," -f 2  | cut -d "." -f 1 | uniq | sort -r -g -S 1M | tail -n +"$skip_node_process_pcpu" | head -1 )

heap_stats_data="heap-stat-data.csv"
min_heap_stats_data_timestamp=$( cat "$heap_stats_data" | cut -d "," -f 1 | sort -g -S 1M | head -1 )
max_heap_stats_data_timestamp=$( cat "$heap_stats_data" | cut -d "," -f 1 | sort -r -g -S 1M | head -1 )
max_heap_stats_total_heap=$( cat "$heap_stats_data" | cut -d "," -f 3 | sort -r -g -S 1M | head -1 )
max_heap_stats_used_heap=$( cat "$heap_stats_data" | cut -d "," -f 7 | sort -r -g -S 1M | head -1 )

gc_stats_data="gc-stat-data.csv"
min_gc_stats_data_timestamp=$( cat "$gc_stats_data" | cut -d "," -f 1 | sort -g -S 1M | head -1 | xargs -I {} echo "{} / 1000" | bc )
max_gc_stats_data_timestamp=$( cat "$gc_stats_data" | cut -d "," -f 1 | sort -r -g -S 1M | head -1 | xargs -I {} echo "{} / 1000" | bc )
num_gcs=$( cat "$gc_stats_data" | wc -l )
max_gc_pause=$( cat "$gc_stats_data" | cut -d "," -f 3 | cut -d "." -f 1 | sort -r -g -S 1M | head -1 )

all_min_timestamps="\
$min_request_data_timestamp
$min_node_process_data_timestamp
$min_heap_stats_data_timestamp
$min_gc_stats_data_timestamp"

all_max_timestamps="\
$max_request_data_timestamp
$max_node_process_data_timestamp
$max_heap_stats_data_timestamp
$max_gc_stats_data_timestamp"

requests_per_second=$(( num_requests / ( max_request_date_timestamp - min_request_data_timestamp ) ))
gcs_per_minute=$(( num_gcs / ( ( max_gc_stats_data_timestamp - min_gc_stats_data_timestamp ) / 60 ) ))

min_timestamp=$( echo "$all_min_timestamps" | sort -g | head -1 )
max_timestamp=$( echo "$all_max_timestamps" | sort -r -g | head -1 )

x_range_max=$(( ( ( ( max_timestamp - min_timestamp ) / 100 ) + 1 ) * 100 ))
x_tics=$(( x_range_max / 50 ))

request_duration_max=$(( ( ( max_request_duration_secs / 10 ) + 1 ) * 10000 ))
request_duration_tics=$(( request_duration_max / 10 ))

process_pcpu_max=$(( ( ( max_node_process_pcpu / 100 ) + 1 ) * 100 ))
process_pcpu_tics=$(( process_pcpu_max / 10 ))

all_max_heap="\
$max_heap_stats_total_heap
$max_heap_stats_used_heap"

max_heap=$( echo "$all_max_heap" | sort -r -g | head -1 )
heap_max=$( echo " ( ( ( $max_heap + 500 ) / 1000 ) + 1 ) * 1000 " | bc )
heap_tics=$(( heap_max / 10 ))

gc_pause_max=$(( ( ( ( max_gc_pause / 1000 ) / 1000 ) + 1 ) * 1000 ))
gc_pause_tics=$(( gc_pause_max / 10 ))

green="#008800"
purple="#AA44AA"
orange="#BEA330"
blue="#0000CC"
red="#EE3333"
black="#000000"

gnuplot <<ENDOFPLOT
set datafile separator comma
set terminal png font "/Library/Fonts/Arial.ttf" 12 size 2000,1000
set output "$graphfile"

set size 1,1

set multiplot
set title "node app performance analysis"
set lmargin screen 0.25

set label "{/:Bold $requests_per_second requests/second}" at screen 0.26, screen 0.90 font ",24" tc rgb "$blue"
set label "{/:Bold $gcs_per_minute gcs/minute}" at screen 0.26, screen 0.85 font ",24" tc rgb "$orange"

set xrange[0:$x_range_max]
set format x "%.0f"
set xtics $x_tics rotate by -45 font ",10"
set xlabel "elapsed time (s)"

set yrange[0:$request_duration_max]
set ytics $request_duration_tics
set mytics 5
set grid ytics
set ylabel "{/:Bold Response time (ms)}" font ",18" tc rgb "$blue"
set samples 25

plot \
  "$request_data" every ::2 using (\$1 / 1000 - $min_timestamp):2 notitle with points pointtype 5 ps .5 lc rgb "$blue",\
  "$request_data" every ::2 using (\$1 / 1000 - $min_timestamp):2:((column(0)+1) / $num_requests) smooth acsplines notitle with lines lc rgb "$black" lw 3

set yrange[0:$process_pcpu_max]
set ytics $process_pcpu_tics offset -10, 0
set ylabel "{/:Bold Percent CPU}" offset -10, 0 font ",18" tc rgb "$red"
set samples 100

plot \
  "$node_process_data" every ::1 using (\$1 - $min_timestamp):2 notitle with points pointtype 6 ps 1.5 lc rgb "$red" lw 2,\
  "$node_process_data" every ::1 using (\$1 - $min_timestamp):2 smooth sbezier notitle with lines lc rgb "$red" lw 3

set yrange[0:$gc_pause_max]
set ytics $gc_pause_tics offset -20, 0
set ylabel "{/:Bold GC Pause (ms)}" offset -20, 0 font ",18" tc rgb "$orange"

plot \
  "$gc_stats_data" every ::1 using (\$1 / 1000 - $min_timestamp):(\$3 / 1000) notitle with impulse lc rgb "$orange" lw 4

set yrange[0:$heap_max]
set ytics $heap_tics offset -30, 0
set ylabel "{/:Bold Used Heap Size (MB)}" offset -30, 0 font ",18" tc rgb "$purple"

plot \
  "$heap_stats_data" every ::1 using (\$1 - $min_timestamp):7 notitle with lines lw 3 lc rgb "$purple"

set yrange[0:$heap_max]
set ytics $heap_tics offset -40, 0
set ylabel "{/:Bold Total Heap Size (MB)}" offset -40, 0 font ",18" tc rgb "$green"
set samples 50

plot \
  "$heap_stats_data" every ::1 using (\$1 - $min_timestamp):3 notitle smooth csplines lw 3 lc rgb "$green"

unset multiplot
ENDOFPLOT
