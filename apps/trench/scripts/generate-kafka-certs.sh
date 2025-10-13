#!/bin/bash

# Generate SSL certificates for Kafka SSL+SASL testing
# This script creates self-signed certificates for local testing

set -e

CERT_DIR="./certs"
KEYSTORE_PASSWORD="server_keystore_password"
TRUSTSTORE_PASSWORD="server_truststore_password"

echo "Creating certificates directory..."
mkdir -p "$CERT_DIR"

echo "Generating CA certificate..."
openssl req -new -x509 -keyout "$CERT_DIR/ca-key" -out "$CERT_DIR/ca-cert" -days 365 -nodes \
    -subj "/C=US/ST=CA/L=SF/O=Trench/OU=IT Department/CN=ca"

echo "Generating server keystore..."
keytool -keystore "$CERT_DIR/kafka.server.keystore.jks" -alias kafka-server -validity 365 -genkey -keyalg RSA \
    -dname "CN=kafka, OU=Trench, O=Trench, L=SF, S=CA, C=US" \
    -storepass "$KEYSTORE_PASSWORD" -keypass "$KEYSTORE_PASSWORD"

echo "Adding CA certificate to server keystore..."
keytool -keystore "$CERT_DIR/kafka.server.keystore.jks" -alias CARoot -import -file "$CERT_DIR/ca-cert" \
    -storepass "$KEYSTORE_PASSWORD" -noprompt

echo "Generating server certificate signing request..."
keytool -keystore "$CERT_DIR/kafka.server.keystore.jks" -alias kafka-server -certreq -file "$CERT_DIR/server.csr" \
    -storepass "$KEYSTORE_PASSWORD"

echo "Signing server certificate with CA..."
openssl x509 -req -CA "$CERT_DIR/ca-cert" -CAkey "$CERT_DIR/ca-key" -in "$CERT_DIR/server.csr" \
    -out "$CERT_DIR/server.crt" -days 365 -CAcreateserial

echo "Importing signed certificate to server keystore..."
keytool -keystore "$CERT_DIR/kafka.server.keystore.jks" -alias kafka-server -import -file "$CERT_DIR/server.crt" \
    -storepass "$KEYSTORE_PASSWORD" -noprompt

echo "Creating server truststore..."
keytool -keystore "$CERT_DIR/kafka.server.truststore.jks" -alias CARoot -import -file "$CERT_DIR/ca-cert" \
    -storepass "$TRUSTSTORE_PASSWORD" -noprompt

echo "Generating client keystore..."
keytool -keystore "$CERT_DIR/kafka.client.keystore.jks" -alias kafka-client -validity 365 -genkey -keyalg RSA \
    -dname "CN=kafka-client, OU=Trench, O=Trench, L=SF, S=CA, C=US" \
    -storepass "$KEYSTORE_PASSWORD" -keypass "$KEYSTORE_PASSWORD"

echo "Adding CA certificate to client keystore..."
keytool -keystore "$CERT_DIR/kafka.client.keystore.jks" -alias CARoot -import -file "$CERT_DIR/ca-cert" \
    -storepass "$KEYSTORE_PASSWORD" -noprompt

echo "Generating client certificate signing request..."
keytool -keystore "$CERT_DIR/kafka.client.keystore.jks" -alias kafka-client -certreq -file "$CERT_DIR/client.csr" \
    -storepass "$KEYSTORE_PASSWORD"

echo "Signing client certificate with CA..."
openssl x509 -req -CA "$CERT_DIR/ca-cert" -CAkey "$CERT_DIR/ca-key" -in "$CERT_DIR/client.csr" \
    -out "$CERT_DIR/client.crt" -days 365 -CAcreateserial

echo "Importing signed certificate to client keystore..."
keytool -keystore "$CERT_DIR/kafka.client.keystore.jks" -alias kafka-client -import -file "$CERT_DIR/client.crt" \
    -storepass "$KEYSTORE_PASSWORD" -noprompt

echo "Creating client truststore..."
keytool -keystore "$CERT_DIR/kafka.client.truststore.jks" -alias CARoot -import -file "$CERT_DIR/ca-cert" \
    -storepass "$TRUSTSTORE_PASSWORD" -noprompt

echo "Converting certificates to PEM format for environment variables..."
# Convert CA cert to PEM
keytool -keystore "$CERT_DIR/kafka.server.truststore.jks" -alias CARoot -export -rfc -file "$CERT_DIR/ca.pem" \
    -storepass "$TRUSTSTORE_PASSWORD"

# Extract client cert and key to PEM
keytool -keystore "$CERT_DIR/kafka.client.keystore.jks" -alias kafka-client -export -rfc -file "$CERT_DIR/client.pem" \
    -storepass "$KEYSTORE_PASSWORD"

# Extract private key (requires openssl)
keytool -keystore "$CERT_DIR/kafka.client.keystore.jks" -alias kafka-client -importkeystore -srckeystore "$CERT_DIR/kafka.client.keystore.jks" -destkeystore "$CERT_DIR/client.p12" -deststoretype PKCS12 -srcstorepass "$KEYSTORE_PASSWORD" -deststorepass "$KEYSTORE_PASSWORD" -noprompt
openssl pkcs12 -in "$CERT_DIR/client.p12" -nocerts -out "$CERT_DIR/client.key" -passin pass:"$KEYSTORE_PASSWORD" -passout pass:"$KEYSTORE_PASSWORD"
openssl rsa -in "$CERT_DIR/client.key" -out "$CERT_DIR/client.key" -passin pass:"$KEYSTORE_PASSWORD"

echo "Cleaning up temporary files..."
rm -f "$CERT_DIR/server.csr" "$CERT_DIR/client.csr" "$CERT_DIR/server.crt" "$CERT_DIR/client.crt" "$CERT_DIR/client.p12" "$CERT_DIR/client.key"

echo "Certificate generation complete!"
echo ""
echo "For SSL+SASL testing, set these environment variables:"
echo "export KAFKA_SSL_CA=\$(cat $CERT_DIR/ca.pem)"
echo "export KAFKA_SSL_CERT=\$(cat $CERT_DIR/client.pem)"
echo "export KAFKA_SSL_KEY=\$(cat $CERT_DIR/client.key)"
echo ""
echo "Then run: docker-compose -f docker-compose.ssl-sasl.yml up --build"
