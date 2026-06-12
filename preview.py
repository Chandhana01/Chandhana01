#!/usr/bin/env python3
"""Render a faithful static preview of the Nobel Atlas UI (topbar, left rail,
graph) using PIL. Runs the same clustered force layout the app uses so the
graph reflects real data: 117 prizes, real subfield colors, related links."""
import json, glob, math, random
from PIL import Image, ImageDraw, ImageFont

random.seed(7)
data=[]
for f in sorted(glob.glob('data/part*.json')): data+=json.load(open(f))
prizes=[e for e in data if e.get('awarded',True)]
byid={e['id']:e for e in prizes}

SUB={"Physical Chemistry":(108,197,255),"Organic Chemistry":(255,159,108),
 "Inorganic Chemistry":(199,155,255),"Biochemistry":(95,211,138),
 "Analytical Chemistry":(244,201,93),"Materials/Polymers":(255,122,168),
 "Nuclear/Radiochemistry":(255,210,74),"Theoretical/Computational":(122,240,224),
 "Spectroscopy/Instrumentation":(176,184,255),"Other":(154,167,184)}
subs=sorted({e['subfield'] for e in prizes}, key=lambda s:-sum(1 for e in prizes if e['subfield']==s))

# ---- force layout (mirrors graph.js: repulsion + springs + cluster gravity) ----
N={e['id']:{'x':random.uniform(-300,300),'y':random.uniform(-300,300),'vx':0,'vy':0,'sf':e['subfield']} for e in prizes}
cc={}
R=360
for i,s in enumerate(subs):
    a=i/len(subs)*2*math.pi - math.pi/2
    cc[s]=(math.cos(a)*R, math.sin(a)*R)
links=[]
seen=set()
for e in prizes:
    for rr in e.get('related',[]):
        if rr in byid:
            k=tuple(sorted((e['id'],rr)))
            if k in seen: continue
            seen.add(k); links.append(k)
ids=list(N)
for step in range(320):
    k=max(0.05,1-step/320)
    for i in range(len(ids)):
        a=N[ids[i]]
        for j in range(i+1,len(ids)):
            b=N[ids[j]]
            dx=a['x']-b['x']; dy=a['y']-b['y']; d2=dx*dx+dy*dy or 0.01
            if d2>90000: continue
            d=math.sqrt(d2); f=3400/d2
            fx=dx/d*f; fy=dy/d*f
            a['vx']+=fx;a['vy']+=fy;b['vx']-=fx;b['vy']-=fy
    for s,t in links:
        a=N[s];b=N[t]
        dx=b['x']-a['x'];dy=b['y']-a['y'];d=math.sqrt(dx*dx+dy*dy) or .01
        f=(d-95)*0.012; fx=dx/d*f; fy=dy/d*f
        a['vx']+=fx;a['vy']+=fy;b['vx']-=fx;b['vy']-=fy
    for nid in ids:
        n=N[nid]; cx,cy=cc[n['sf']]
        n['vx']+=(cx-n['x'])*0.009; n['vy']+=(cy-n['y'])*0.009
        n['vx']+=-n['x']*0.0012; n['vy']+=-n['y']*0.0012
    for nid in ids:
        n=N[nid]; n['vx']*=0.82; n['vy']*=0.82
        n['x']+=n['vx']*k; n['y']+=n['vy']*k

# ---- render ----
W,H=1600,1000
img=Image.new('RGB',(W,H),(14,17,22))
d=ImageDraw.Draw(img)
def font(sz,bold=False):
    for p in (['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'] if bold else ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']):
        try: return ImageFont.truetype(p,sz)
        except: pass
    return ImageFont.load_default()

# topbar
d.rectangle([0,0,W,64],fill=(15,19,26)); d.line([0,64,W,64],fill=(40,49,64))
d.rounded_rectangle([18,12,60,54],10,fill=(34,42,58),outline=(40,49,64))
d.text((30,20),'⚗',font=font(26),fill=(244,201,93))
d.text((72,14),'Nobel Atlas',font=font(20,True),fill=(231,236,243))
d.text((72,40),'Ultralearn chemistry through every Nobel Prize, 1901→now',font=font(12),fill=(154,167,184))
# right pills
d.rounded_rectangle([W-470,18,W-330,46],14,fill=(27,33,43),outline=(40,49,64))
d.text((W-455,24),'0/117 studied',font=font(13),fill=(154,167,184))
d.rounded_rectangle([W-320,16,W-235,48],9,fill=(27,33,43),outline=(40,49,64))
d.text((W-305,24),'🎴 Review',font=font(13,True),fill=(231,236,243))
for i,t in enumerate(['Export','Import','?']):
    x=W-220+i*60
    d.rounded_rectangle([x,16,x+ (24 if t=='?' else 52),48],9,outline=(40,49,64))
    d.text((x+10,24),t,font=font(13),fill=(154,167,184))

# left rail
RW=270
d.rectangle([0,65,RW,H],fill=(21,26,34)); d.line([RW,64,RW,H],fill=(40,49,64))
y=84
d.rounded_rectangle([14,y,RW-14,y+34],9,fill=(14,17,22),outline=(40,49,64))
d.text((26,y+9),'Search laureate, topic, tag…',font=font(13),fill=(107,120,136)); y+=58
d.text((14,y),'ENGAGEMENT',font=font(11,True),fill=(107,120,136)); y+=22
for lab,on in [('● All prizes',True),('✦ Has my notes',False),('○ Not started',False),('🎴 Cards due',False)]:
    d.text((20,y),lab,font=font(13),fill=(231,236,243) if on else (154,167,184)); y+=24
y+=14
d.text((14,y),'SUBFIELDS',font=font(11,True),fill=(107,120,136)); y+=22
for s in subs:
    c=SUB[s]; d.rectangle([20,y+3,31,y+14],fill=c)
    d.text((38,y),s,font=font(12),fill=(154,167,184))
    cnt=str(sum(1 for e in prizes if e['subfield']==s))
    d.text((RW-34,y),cnt,font=font(11),fill=(107,120,136)); y+=24
y+=10
d.text((14,y),'HOW TO READ THE GRAPH',font=font(11,True),fill=(107,120,136)); y+=22
for t in ['● Pale = not studied yet','● Bright = your notes filling in','Color = subfield · lines = related']:
    d.text((20,y),t,font=font(12),fill=(154,167,184)); y+=22

# graph area transform
gx0,gy0,gx1,gy1=RW,64,W,H
xs=[N[i]['x'] for i in ids]; ys=[N[i]['y'] for i in ids]
minx,maxx,miny,maxy=min(xs),max(xs),min(ys),max(ys)
pad=90
sx=(gx1-gx0-2*pad)/(maxx-minx); sy=(gy1-gy0-2*pad)/(maxy-miny); sc=min(sx,sy)
ox=(gx0+gx1)/2 - (minx+maxx)/2*sc; oy=(gy0+gy1)/2 - (miny+maxy)/2*sc
def P(n): return (n['x']*sc+ox, n['y']*sc+oy)
# links
for s,t in links:
    a=P(N[s]); b=P(N[t]); d.line([a,b],fill=(120,140,165),width=1)
# overlay faint to dim links
ov=Image.new('RGBA',(W,H),(0,0,0,0));
img=Image.alpha_composite(img.convert('RGBA'),ov).convert('RGB'); d=ImageDraw.Draw(img)
# redraw links subtler by drawing nodes on top
for s,t in links:
    a=P(N[s]); b=P(N[t]); d.line([a,b],fill=(45,55,68),width=1)
# nodes (all pale, since fresh state) — a few "studied" highlighted for illustration
studied={'chem-1901','chem-2024','chem-2020','chem-1911'}
labelimp={'chem-1901':"van 't Hoff '01",'chem-2024':"Baker/Hassabis '24",'chem-2020':"Doudna '20",
          'chem-1911':"Curie '11",'chem-1965':"Woodward '65",'chem-2022':"Bertozzi '22"}
for e in prizes:
    n=N[e['id']]; px,py=P(n); col=SUB[e['subfield']]
    fresh=e['id'] not in studied
    base=(58,65,80)
    if fresh:
        t=0.28; r=6
        c=tuple(int(base[i]+(col[i]-base[i])*t) for i in range(3))
    else:
        t=0.95; r=10
        c=tuple(int(base[i]+(col[i]-base[i])*t) for i in range(3))
        # glow
        for gr in range(r+10,r,-2):
            a=int(60*(1-(gr-r)/10))
            gl=Image.new('RGBA',(W,H),(0,0,0,0)); gd=ImageDraw.Draw(gl)
            gd.ellipse([px-gr,py-gr,px+gr,py+gr],fill=col+(a,))
            img=Image.alpha_composite(img.convert('RGBA'),gl).convert('RGB'); d=ImageDraw.Draw(img)
    d.ellipse([px-r,py-r,px+r,py+r],fill=c,outline=(255,255,255) if not fresh else None,width=2 if not fresh else 0)
    if e['id'] in labelimp:
        d.text((px+r+4,py-7),labelimp[e['id']],font=font(12,True),fill=(231,236,243))

# hint
hint='Click any node to enter its world →'
fw=d.textlength(hint,font=font(12))
d.rounded_rectangle([(gx0+gx1)/2-fw/2-12,76,(gx0+gx1)/2+fw/2+12,100],12,fill=(15,19,26),outline=(40,49,64))
d.text(((gx0+gx1)/2-fw/2,82),hint,font=font(12),fill=(154,167,184))
# zoom controls
for i,t in enumerate(['+','−','fit']):
    d.rounded_rectangle([RW+16,H-120+i*38,RW+16+(40 if t=='fit' else 30),H-92+i*38],8,fill=(27,33,43),outline=(40,49,64))
    d.text((RW+24,H-116+i*38),t,font=font(14),fill=(154,167,184))

img.save('preview-graph.png')
print('saved preview-graph.png')
