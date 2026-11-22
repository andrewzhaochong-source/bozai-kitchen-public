from pathlib import Path
from PIL import Image,ImageOps
import json,hashlib
site=Path(__file__).resolve().parent.parent/'outputs/cookbook-site/dist'
data=json.loads((site/'data.js').read_text().removeprefix('const dishes = ').strip().removesuffix(';'))
manifest_path=site/'asset-map.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
media=site/'assets/media';media.mkdir(parents=True,exist_ok=True)
def convert(path,width,quality,source=None):
 key=f'{path}:{width}:{quality}'
 source=source or site/path
 if key in manifest and (site/manifest[key]).exists() and not source.exists():return manifest[key]
 if not source.exists():raise FileNotFoundError(source)
 digest=hashlib.sha256(source.read_bytes()).hexdigest()[:18]
 out=media/f'{digest}-{width}.webp'
 if not out.exists():
  with Image.open(source) as img:
   img=ImageOps.exif_transpose(img).convert('RGB');img.thumbnail((width,width),Image.Resampling.LANCZOS);img.save(out,'WEBP',quality=quality,method=6)
 result=out.relative_to(site).as_posix();manifest[key]=result;return result
for d in data:
 if '/media/' not in d['cover']:
  original=d['cover'];d['image']=convert(original,1280,82);d['cover']=convert(original,480,76)
 for a in d['attempts']:
  if '/media/' not in a['photo']:a['photo']=convert(a['photo'],1280,82)
archive=site.parent.parent/'cookbook'
convert('assets/book-cover.png',1280,85,archive/'design/book-cover.png')
(site/'asset-map.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(site/'data.js').write_text('const dishes = '+json.dumps(data,ensure_ascii=False)+';\n')
# Copies in dist are generated; full-resolution originals remain in cookbook/.
known={hashlib.sha256(p.read_bytes()).hexdigest() for p in archive.rglob('*') if p.suffix.lower() in ('.jpg','.jpeg','.png')}
for f in (site/'assets').iterdir():
 if f.is_file() and f.suffix.lower() in ('.png','.jpg','.jpeg') and hashlib.sha256(f.read_bytes()).hexdigest() in known:f.unlink()
print(f'优化完成：{len(data)} 道菜；浏览用图片 {sum(p.stat().st_size for p in media.iterdir())/1024/1024:.2f} MB。')
