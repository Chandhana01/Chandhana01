#!/usr/bin/env python3
"""Inline styles.css + all JS + data into one self-contained HTML file
so the app can be opened directly with no separate files / server."""
import os, re
HERE=os.path.dirname(os.path.abspath(__file__))
def r(p): return open(os.path.join(HERE,p),encoding='utf-8').read()
html=r('index.html')
css=r('src/styles.css')
data=r('data/prizes.js'); trails=r('data/trails.js'); store=r('src/store.js'); graph=r('src/graph.js'); app=r('src/app.js')
html=html.replace('<link rel="stylesheet" href="src/styles.css" />', '<style>\n'+css+'\n</style>')
for tag in ['<script src="data/prizes.js"></script>','<script src="data/trails.js"></script>',
            '<script src="src/store.js"></script>',
            '<script src="src/graph.js"></script>','<script src="src/app.js"></script>']:
    html=html.replace(tag,'')
bundle='<script>\n'+data+'\n'+trails+'\n'+store+'\n'+graph+'\n'+app+'\n</script>'
html=html.replace('</body>', bundle+'\n</body>')
out=os.path.join(HERE,'nobel-atlas.html')
open(out,'w',encoding='utf-8').write(html)
print('wrote nobel-atlas.html', len(html), 'bytes')
