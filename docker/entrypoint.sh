#!/bin/sh
set -eu

node ./.next/standalone/scripts/validate-env.mjs
node ./.next/standalone/scripts/migrate.mjs

exec node ./.next/standalone/server.js
