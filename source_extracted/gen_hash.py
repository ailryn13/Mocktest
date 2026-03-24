#!/usr/bin/env python3
import bcrypt
h = bcrypt.hashpw(b'student123', bcrypt.gensalt(10)).decode()
print(h)

with open('/tmp/update_pwd.sql', 'w') as f:
    f.write("UPDATE users SET password_hash='" + h + "' WHERE email='dhinesh2004@gmail.com';\n")
print("SQL written to /tmp/update_pwd.sql")
