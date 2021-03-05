#! /bin/bash
deno test --coverage=cov --unstable; deno coverage --unstable cov; rm -rf cov
