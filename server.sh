#!/bin/bash
DIR="$(cd -P "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"
cd "$DIR"

browser-sync start --server --files "*.html,*.js,*.css,js/*.js,*.less"