#!/bin/bash

# Generate SSL certificates for Kafka SSL+SASL testing
# This script creates self-signed certificates for local testing

set -e

CERT_DIR="./certs"
KEYSTORE_PASSWORD="server_keystore_password"
TRUSTSTORE_PASSWORD="server_truststore_password"

echo "Creating certificates directory..."
mkdir -p "$CERT_DIR"

echo "Generating CA private key..."
openssl genrsa -out "$CERT_DIR/ca-key.pem" 2048

echo "Generating CA certificate..."
openssl req -new -x509 -key "$CERT_DIR/ca-key.pem" -out "$CERT_DIR/ca.pem" -days 365 \
    -subj "/C=US/ST=CA/L=SF/O=Trench/OU=IT Department/CN=ca"

echo "Generating server private key..."
openssl genrsa -out "$CERT_DIR/server-key.pem" 2048

echo "Generating server certificate signing request..."
openssl req -new -key "$CERT_DIR/server-key.pem" -out "$CERT_DIR/server.csr" \
    -subj "/C=US/ST=CA/L=SF/O=Trench/OU=IT Department/CN=kafka"

echo "Signing server certificate with CA..."
openssl x509 -req -in "$CERT_DIR/server.csr" -CA "$CERT_DIR/ca.pem" -CAkey "$CERT_DIR/ca-key.pem" \
    -out "$CERT_DIR/server.pem" -days 365 -CAcreateserial

echo "Generating client private key..."
openssl genrsa -out "$CERT_DIR/client-key.pem" 2048

echo "Generating client certificate signing request..."
openssl req -new -key "$CERT_DIR/client-key.pem" -out "$CERT_DIR/client.csr" \
    -subj "/C=US/ST=CA/L=SF/O=Trench/OU=IT Department/CN=kafka-client"

echo "Signing client certificate with CA..."
openssl x509 -req -in "$CERT_DIR/client.csr" -CA "$CERT_DIR/ca.pem" -CAkey "$CERT_DIR/ca-key.pem" \
    -out "$CERT_DIR/client.pem" -days 365 -CAcreateserial

echo "Creating server keystore (JKS format for Kafka)..."
# Convert server cert to PKCS12 first
openssl pkcs12 -export -in "$CERT_DIR/server.pem" -inkey "$CERT_DIR/server-key.pem" \
    -out "$CERT_DIR/server.p12" -name kafka-server -passout pass:"$KEYSTORE_PASSWORD"

# Convert to JKS
keytool -importkeystore -srckeystore "$CERT_DIR/server.p12" -srcstoretype PKCS12 \
    -destkeystore "$CERT_DIR/kafka.keystore.jks" -deststoretype JKS \
    -srcstorepass "$KEYSTORE_PASSWORD" -deststorepass "$KEYSTORE_PASSWORD" -noprompt

echo "Creating server truststore (JKS format for Kafka)..."
keytool -import -file "$CERT_DIR/ca.pem" -alias ca -keystore "$CERT_DIR/kafka.truststore.jks" \
    -storepass "$TRUSTSTORE_PASSWORD" -noprompt

echo "Cleaning up temporary files..."
rm -f "$CERT_DIR/server.csr" "$CERT_DIR/client.csr" "$CERT_DIR/server.p12" "$CERT_DIR/ca.srl"

echo "Certificate generation complete!"
echo ""
echo "For SSL+SASL setup, set these environment variables:"
echo "export KAFKA_SSL_CA=\$(cat $CERT_DIR/ca.pem)"
echo "export KAFKA_SSL_CERT=\$(cat $CERT_DIR/client.pem)"
echo "export KAFKA_SSL_KEY=\$(cat $CERT_DIR/client.key.pem)"
echo ""
echo "Then run: docker compose -f docker-compose.ssl-sasl.yml up -d --build"