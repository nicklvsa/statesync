#!/usr/bin/env bash

sleep 10
./scripts/wait.sh redis:7000 &&
./scripts/wait.sh redis:7001 &&
./scripts/wait.sh redis:7002 &&
./scripts/wait.sh redis:7003 &&
./scripts/wait.sh redis:7004 &&
./scripts/wait.sh redis:7005 -- /bin/sh -c "go run tests/tests.go"