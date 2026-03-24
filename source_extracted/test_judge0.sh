curl -s -X POST "http://judge0-server:2358/submissions?base64_encoded=false&wait=true" \
-H "Content-Type: application/json" \
-d '{
  "source_code": "public class Main {\n  public static void main(String[] args) {\n    System.out.print(\"Hello world\");\n  }\n}",
  "language_id": 62
}'
