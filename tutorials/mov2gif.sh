#!/bin/zsh

ffmpeg -i $1 -pix_fmt rgb8 -r 10 $2 && gifsicle -O3 $2 -o $2
