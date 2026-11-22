from pathlib import Path
import json,shutil,re
root=Path(__file__).resolve().parent.parent/'outputs'
site=root/'cookbook-site/dist'
archive=root/'cookbook'
legacy_path=archive/'legacy-display.json'
legacy=json.loads(legacy_path.read_text()) if legacy_path.is_file() else {}
data=[]
for recipe in sorted((root/'cookbook/dishes').glob('dish-*/recipe.md')):
 dishdir=recipe.parent
 i=int(dishdir.name.removeprefix('dish-'))
 recipe_text=recipe.read_text()
 name=recipe_text.splitlines()[0].removeprefix('# ').strip()
 display=legacy.get(dishdir.name, {})
 if display.get('name') != name:
  display={}
 if display:
  tags,foods,time,label,sub,tips=(display[key] for key in ('tags','foods','time','label','sub','tips'))
 else:
  tags,foods=[],[]
  time,label='未记录','烹饪时长'
  reminders=re.search(r'^## 复做提醒\s*\n(.*?)(?=^## |\Z)',recipe_text,re.M|re.S)
  tips=re.findall(r'^- (.+)$',reminders[1],re.M) if reminders else []
  sub=tips[0] if tips else ''

 attempts=[]
 for p in sorted((dishdir/'attempts').iterdir()):
  if not (p/'record.md').exists(): continue
  text=(p/'record.md').read_text()
  def section(title):
   marker='## '+title+'\n\n'
   return text.split(marker,1)[1].split('\n## ',1)[0].strip() if marker in text else ''
  m=re.search(r'^- 做菜日期：[ \t]*(.*)$',text,re.M)
  cooked_at=m.group(1).strip() if m else ''
  if cooked_at in ('未记录','待补'): cooked_at=''
  photo=next(p.glob('photo.*'))
  image=f'assets/dish-{i}-{p.name}{photo.suffix}'
  shutil.copy2(photo,site/image)
  source_path=p/'source.txt'
  attempts.append(dict(key=p.name,cookedAt=cooked_at,photo=image,steps=[line.split('. ',1)[1] for line in section('本次实际做法').splitlines() if line and line[0].isdigit()],ingredients=section('食材与调味'),record=text,source=source_path.read_text() if source_path.is_file() else '',note=section('本次感受')))
 latest=attempts[-1]
 if not tips:
  tips=latest['steps'][:1] or []
  sub=next(iter(tips),'')
 cover=f'assets/dish-{i}'+Path(latest['photo']).suffix
 cover_match=re.search(r'^- 封面：`([^`]+)`',recipe_text,re.M)
 cover_source=dishdir/cover_match.group(1) if cover_match else site/latest['photo']
 shutil.copy2(cover_source,site/cover)
 cuisine_match=re.search(r'^- 菜系：(.*)$',recipe_text,re.M)
 cuisine=cuisine_match.group(1).strip() if cuisine_match else '未分类'
 method_match=re.search(r'^- 做法／形式：(.*)$',recipe_text,re.M)
 food_match=re.search(r'^- 主食材分类：(.*)$',recipe_text,re.M)
 tags=method_match.group(1).strip().split('、') if method_match else tags
 foods=food_match.group(1).strip().split('、') if food_match else foods
 flavor_match=re.search(r'^- 风味标签：(.*)$',recipe_text,re.M)
 flavor_tags=[value.strip() for value in flavor_match.group(1).split('、') if value.strip()] if flavor_match else foods
 data.append(dict(cuisine=cuisine,id=i,cover=cover,name=name,tags=tags,foods=foods,flavorTags=flavor_tags,time=time,label=label,sub=sub,tips=tips,summary=display.get('summary', next(iter(tips),'')),attempts=attempts,count=len(attempts),**{k:v for k,v in latest.items() if k not in ('key','photo')}))
registry=json.loads((root/'cookbook/classification.json').read_text())
(site/'taxonomy.js').write_text('const classification = '+json.dumps(registry,ensure_ascii=False)+';\n')
(site/'data.js').write_text('const dishes = '+json.dumps(data,ensure_ascii=False)+';\n')

