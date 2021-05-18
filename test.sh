#! /bin/bash
deno test -r -A --coverage=cov --unstable; deno coverage --unstable cov; rm -rf cov
