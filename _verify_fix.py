import sqlite3, json
db = sqlite3.connect(r'C:\Users\LENOVO\.cc-switch\cc-switch.db', timeout=30)
cur = db.cursor()

print('=== Xiaomi Provider Config ===')
cur.execute("SELECT id, name, settings_config FROM providers WHERE id='2c6f457a-787d-45cd-8fa3-db0b198ec26c'")
row = cur.fetchone()
c = json.loads(row[2])
print(c['config'])

print()
print('=== Codex Proxy Config ===')
cur.execute("SELECT app_type, proxy_enabled, enabled FROM proxy_config WHERE app_type='codex'")
row = cur.fetchone()
print('app_type=%s, proxy_enabled=%s, enabled=%s' % (row[0], row[1], row[2]))

db.close()