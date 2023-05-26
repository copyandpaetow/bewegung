#!/usr/bin/env sh

# abort on errors
set -e

# build
rm -rf dist
npm run build

# navigate into the build output directory
cd dist

git init
git checkout -b main
git add -A
git commit -m 'deploy the website'

git push -f git@github.com:copyandpaetow/bewegung.git main:gh-pages

cd - 
