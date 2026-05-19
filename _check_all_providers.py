import sqlite3, json, sys
sys.stdout.reconfigure(encoding='utf-8')
db = sqlite3.connect(r'C:\Users\LENOVO\.cc-switch\cc-switch.db')
cur = db.cursor()

# 查看所有 providers 详情
cur.execute('SELECT id, name, provider_type, settings_config FROM providers')
for r in cur.fetchall():
    print('=== ID=%s, Name=%s, Type=%s ===' % (r[0], r[1], r[2]))
    c = json.loads(r[3])
    print(json.dumps(c, indent=2, ensure_ascii=False))
    print()

db.close()