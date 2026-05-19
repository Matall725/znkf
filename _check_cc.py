import sqlite3, json, sys
sys.stdout.reconfigure(encoding='utf-8')
db = sqlite3.connect(r'C:\Users\LENOVO\.cc-switch\cc-switch.db')
cur = db.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
rows = cur.fetchall()
print('Tables:', [r[0] for r in rows])

cur.execute('SELECT id, name, provider_type FROM providers')
for r in cur.fetchall():
    print('ID=%s, Name=%s, Type=%s' % r)

cur.execute("SELECT settings_config FROM providers WHERE name LIKE '%Xiaomi%' OR name LIKE '%MiMo%'")
row = cur.fetchone()
if row:
    print()
    print('=== Xiaomi Config ===')
    c = json.loads(row[0])
    print(json.dumps(c, indent=2, ensure_ascii=False))

# Check active provider
try:
    cur.execute('SELECT * FROM active_provider')
    for r in cur.fetchall():
        print('Active:', r)
except:
    pass

# Check switch log
try:
    cur.execute('SELECT * FROM switch_log ORDER BY id DESC LIMIT 3')
    for r in cur.fetchall():
        print('SwitchLog:', r)
except:
    pass

db.close()