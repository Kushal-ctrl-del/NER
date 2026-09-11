import json
import re
import sys

try:
    with open('data.json', encoding='utf-8') as f:
        data = f.read()
    
    # Just split by " and keep long ones
    parts = data.split('"')
    long_parts = [p for p in parts if len(p) > 100 and not p.startswith('http') and not p.startswith('[[') and '{' not in p and '\\u' not in p]
    
    with open('parsed.txt', 'w', encoding='utf-8') as f:
        f.write('\n\n====\n\n'.join(long_parts))
except Exception as e:
    print(e)
