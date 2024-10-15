yes | cp -rf ../trench/swagger-spec.json ./swagger-spec.json
# Generate mintlify docs
#npx @mintlify/scraping@latest openapi-file swagger-spec.json -o api-reference
echo 'openapi.sh: Done!'
