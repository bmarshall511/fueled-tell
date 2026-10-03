import sys
from PIL import Image, ImageDraw
out, w, cols, *fs = sys.argv[1:]; w=int(w); cols=int(cols)
ims=[]
for f in fs:
    i=Image.open('audit/'+f).convert('RGB'); i=i.resize((w,int(i.height*w/i.width)))
    if i.height>w*2.4: i=i.crop((0,0,w,int(w*2.4)))
    d=ImageDraw.Draw(i); d.rectangle((0,0,len(f)*7+8,16),fill='red'); d.text((4,2),f,fill='white'); ims.append(i)
rows=[ims[k:k+cols] for k in range(0,len(ims),cols)]
H=sum(max(i.height for i in r)+8 for r in rows)
o=Image.new('RGB',(cols*(w+8),H),(60,0,0)); y=0
for r in rows:
    x=0
    for i in r: o.paste(i,(x,y)); x+=w+8
    y+=max(i.height for i in r)+8
o.save(out)
