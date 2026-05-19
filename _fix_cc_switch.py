import sqlite3, json, shutil, os

src = r'C:\Users\LENOVO\.cc-switch\cc-switch.db'
tmp = r'C:\Users\LENOVO\AppData\Local\Temp\_cc_switch_fix.db'

shutil.copy2(src, tmp)

db = sqlite3.connect(tmp, timeout=30)
cur = db.cursor()

cur.execute("SELECT id, name, settings_config FROM providers WHERE id='2c6f457a-787d-45cd-8fa3-db0b198ec26c'")
row = cur.fetchone()
c = json.loads(row[2])
c['config'] = c['config'].replace('wire_api = "responses"', 'wire_api = "chat"')
cur.execute('UPDATE providers SET settings_config=? WHERE id=?', (json.dumps(c, ensure_ascii=False), row[0]))
print('1/2 Xiaomi fixed')

cur.execute('UPDATE proxy_config SET proxy_enabled=1 WHERE app_type=?', ('codex',))
print('2/2 Codex proxy enabled')

db.commit()
db.close()

shutil.copy2(tmp, src)
os.remove(tmp)
print('Done! Database updated successfully.')