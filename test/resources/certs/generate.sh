#!/bin/sh
set -e

OUT=./gen
rm -rf $OUT
mkdir -p $OUT

# (Re-)Generate a self-signed root CA certificate
openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout $OUT/rootCA.key -out $OUT/rootCA.pem -subj "/C=BE/CN=Hackolade-Test-Root-CA"
openssl x509 -outform pem -in $OUT/rootCA.pem -out $OUT/rootCA.crt

# (Re-)Generate a domain name certificate
openssl req -new -nodes -newkey rsa:2048 -keyout $OUT/localhost.key -out $OUT/localhost.csr -subj "/CN=localhost"
openssl x509 -req -sha256 -days 1024 -in $OUT/localhost.csr -CA $OUT/rootCA.pem -CAkey $OUT/rootCA.key -CAcreateserial -extfile domains.ext -out $OUT/localhost.crt
