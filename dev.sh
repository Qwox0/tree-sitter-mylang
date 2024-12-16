#!/usr/bin/env bash

set -e

script_dir="$(dirname "$0")"

info() {
    echo -e "\e[92;1m+++\e[0m $1"
}

warn() {
    echo -e "\e[93;1m+++ WARN:\e[0m $1"
}

error() {
    echo -e "\e[91;1m+++ ERROR:\e[0m $1" >&2
    if [ $2 -ne 0 ]; then exit $2; fi
}

#find ../mylang/ -name "*.mylang" | xargs cat > ./build/my_tmp_dev_file.mylang
#cat ../aoc2024/day1.mylang > ./build/my_tmp_dev_file.mylang

tree-sitter generate
tree-sitter highlight ./build/my_tmp_dev_file.mylang
tree-sitter parse ./build/my_tmp_dev_file.mylang
