from pathlib import Path
from base64 import b64encode
import json

root = Path(__file__).parent
rear = root.parent / 'ebi-a-rear-motion-20261112'
shared = root.parent / 'ebi-a-motion-20261112'

def uri(path):
    mime = 'image/webp' if path.suffix == '.webp' else 'image/png'
    return f'data:{mime};base64,' + b64encode(path.read_bytes()).decode()

html = (root / 'index.template.html').read_text()
for token, value in {
    '__MOTION__': (rear / 'motion.cjs').read_text(),
    '__GAME__': (root / 'game.cjs').read_text(),
    '__ASSETS__': json.dumps([uri(rear / f'pose-{i}.png') for i in range(6)]),
    '__BACKGROUND__': uri(shared / 'kitchen.webp'),
    '__TRAY__': uri(shared / 'tray.png'),
}.items():
    assert token in html, f'Missing template token {token}'
    html = html.replace(token, value)
output = root.parent / 'ebi-a-playable-20261112.html'
output.write_text(html)
assert output.stat().st_size < 16_000_000
print(f'{output}: {output.stat().st_size:,} bytes')
