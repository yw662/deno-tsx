#! /bin/bash
deno test -A --coverage=cov --unstable; deno coverage --unstable cov; rm -rf cov
