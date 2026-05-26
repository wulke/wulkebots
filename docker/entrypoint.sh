#!/bin/sh
set -eu

node ./scripts/validate-env.mjs
node ./scripts/migrate.mjs

exec node server.js
