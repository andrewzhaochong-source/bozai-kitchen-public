from pathlib import Path
import base64
import json
import mimetypes
import re
import subprocess
import sys


def build_offline_base(root: Path) -> str:
    """Assemble the self-contained HTML used by the finalized homepage build."""
    site = root / 'outputs/cookbook-site/dist'
    html = (root / 'work/kitchen_base.html').read_text()
    for font in sorted((site / 'assets/fonts').glob('*.woff2')):
        encoded_font = base64.b64encode(font.read_bytes()).decode()
        html = html.replace(f'assets/fonts/{font.name}', f'data:font/woff2;base64,{encoded_font}')

    data_text = (site / 'data.js').read_text()
    dishes = json.loads(data_text.removeprefix('const dishes = ').strip().removesuffix(';'))
    app = (site / 'app.js').read_text()
    manifest = json.loads((site / 'asset-map.json').read_text())
    app = app.replace('assets/book-cover.png', manifest['assets/book-cover.png:1280:85'])
    paths = {
        path
        for dish in dishes
        for path in [dish['cover'], dish['image'], *(attempt['photo'] for attempt in dish['attempts'])]
    }
    cover_paths = set(re.findall(r'src="(assets/media/[^"\s]+)"', app))
    paths.update(cover_paths)
    assets = {}
    for path in sorted(paths):
        media_type = mimetypes.guess_type(path)[0]
        encoded_image = base64.b64encode((site / path).read_bytes()).decode()
        assets[path] = f'data:{media_type};base64,{encoded_image}'

    # Store every optimized image exactly once and share it across records.
    bootstrap = 'const embeddedAssets = ' + json.dumps(assets, separators=(',', ':')) + ';\n' + data_text + '''
for(const d of dishes){
 d.cover=embeddedAssets[d.cover]; d.image=embeddedAssets[d.image];
 for(const a of d.attempts)a.photo=embeddedAssets[a.photo];
}
'''
    for path in cover_paths:
        app = app.replace(f'src="{path}"', 'src="${embeddedAssets[' + json.dumps(path) + ']}"')
    for filename, code in [('taxonomy.js', (site / 'taxonomy.js').read_text()), ('data.js', bootstrap), ('app.js', app)]:
        inline_script = '<script>' + code.replace('</script', '<\\/script') + '</script>'
        html = html.replace(f'<script src="{filename}"></script>', inline_script)
    assert '<script src=' not in html and '<base ' not in html
    return html


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    for script in ('optimize_cookbook_assets.py', 'build_kitchen_redesign.py'):
        subprocess.run([sys.executable, str(root / 'work' / script)], cwd=root, check=True)
