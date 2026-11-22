import json, urllib.request, datetime, xml.etree.ElementTree as ET
url='https://api.openstreetmap.org/api/0.6/map?bbox=-77.019,-12.073,-77.008,-12.059'
req=urllib.request.Request(url,headers={'User-Agent':'GamarraGemeloDigital academic map (github.com/miasaavedra-gif/PC2-MIASAAVEDRA)'})
doc=ET.fromstring(urllib.request.urlopen(req,timeout=90).read())
nodes={n.get('id'):[round(float(n.get('lon')),6),round(float(n.get('lat')),6)] for n in doc.findall('node')}
ways=[]
for way in doc.findall('way'):
 tags={t.get('k'):t.get('v') for t in way.findall('tag')}
 kind='road' if tags.get('highway') in ['primary','secondary','tertiary','residential','unclassified','pedestrian','living_street','footway','service','trunk','primary_link'] else 'park' if tags.get('leisure') in ['park','garden'] else 'building' if 'building' in tags else None
 if not kind:continue
 coords=[nodes[n.get('ref')] for n in way.findall('nd') if n.get('ref') in nodes]
 if len(coords)<2:continue
 ways.append([kind,tags.get('name',''),int(way.get('id')),coords])
assert len(ways)>30
with open('damero.json','w') as f:json.dump({'source':url,'date':datetime.date.today().isoformat(),'ways':ways},f,separators=(',',':'),ensure_ascii=False)
print('WAYS',len(ways));print(sorted({w[1] for w in ways if w[0]=='road' and w[1]}))
