"""Print the generated light-colour remap rules for client/src/darkTheme.css.

Scans client/src/**/*.tsx for hard-coded light background / dark text / light border utility
classes and maps each one to a readable dark-theme colour. Paste the output into the
"Generated light-colour remaps" block of client/src/darkTheme.css when new colour classes appear.
Usage: python3 scripts/generate_dark_theme_rules.py > /tmp/rules.css
"""
import re, colorsys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent / 'client' / 'src'
PATTERN = re.compile(r"(?:hover:|focus:|active:)?(?:bg|text|border)-(?:\[#[0-9a-fA-F]{3,8}\]|white|black|gray-[0-9]+|slate-[0-9]+|[a-z]+-[0-9]{2,3}|kharcha-[a-z]+)(?:/[0-9]+)?")
classes = sorted({m.group(0) for f in ROOT.rglob('*.tsx') for m in PATTERN.finditer(f.read_text(encoding='utf-8'))})
TW={'white':'#ffffff','black':'#000000'}
pal={
'gray':{50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827'},
'slate':{50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a'},
'red':{50:'#fef2f2',100:'#fee2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d'},
'green':{50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d'},
'emerald':{50:'#ecfdf5',100:'#d1fae5'},
'amber':{50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f'},
'yellow':{50:'#fefce8',100:'#fef9c3',200:'#fef08a',300:'#fde047',400:'#facc15',500:'#eab308',600:'#ca8a04',700:'#a16207',800:'#854d0e',900:'#713f12'},
'orange':{50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12'},
'blue':{50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a'},
'mint':{200:'#b3e5d8',300:'#8fd8c4'},'lilac':{200:'#d8c5e8'},'peach':{50:'#fef5f1',100:'#fde8df',200:'#fdd1bf'},
}
KH={'navy':'#18324b','cream':'#ffffff','green':'#16834b','saffron':'#e87817','line':'#d7e4dc'}
def color_of(name):
    if name.startswith('[#'): 
        h=name[2:-1]
        if len(h)==3: h=''.join(c*2 for c in h)
        return '#'+h[:6]
    if name in TW: return TW[name]
    if name.startswith('kharcha-'): return KH.get(name[8:])
    m=re.match(r'([a-z]+)-(\d+)$',name)
    if m and m.group(1) in pal: return pal[m.group(1)].get(int(m.group(2)))
    return None
def lum(h):
    r,g,b=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def family(h):
    r,g,b=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    hh,l,s=colorsys.rgb_to_hls(r,g,b)
    if s<0.18 or (max(r,g,b)-min(r,g,b))<0.06: return 'neutral'
    d=hh*360
    if d<15 or d>=340: return 'red'
    if d<50: return 'orange'
    if d<70: return 'amber'
    if d<170: return 'green'
    if d<260: return 'blue'
    return 'purple'
BG_SOFT={'neutral':'var(--kd-surface)','green':'var(--kd-green-soft)','orange':'var(--kd-orange-soft)','amber':'var(--kd-amber-soft)','blue':'var(--kd-blue-soft)','red':'var(--kd-red-soft)','purple':'var(--kd-purple-soft)'}
BG_MID={'neutral':'var(--kd-surface-3)','green':'#1f4a33','orange':'#4a3418','amber':'#4a3c16','blue':'#213a5a','red':'#552525','purple':'#3a2f4f'}
TXT={'neutral':'var(--kd-text)','green':'#6ad89a','orange':'#ffab66','amber':'#fcd34d','blue':'#9cc3ff','red':'#fca5a5','purple':'#d8b4fe'}
BORDER={'neutral':'var(--kd-line)','green':'#2f6347','orange':'#7a5226','amber':'#7a6326','blue':'#2f4f78','red':'#7a3030','purple':'#4f3f6b'}
def esc(c): return re.sub(r'([\[\]#/:.()%,])', r'\\\1', c)
rules=[]
for c in classes:
    pseudo=''
    base=c
    if ':' in c:
        pfx,base=c.split(':',1); pseudo=':'+pfx
    m=re.match(r'(bg|text|border)-(.+?)(/(\d+))?$',base)
    if not m: continue
    kind,name,_,alpha=m.groups()
    col=color_of(name)
    if not col: continue
    alpha=int(alpha) if alpha else 100
    L=lum(col); fam=family(col)
    if re.match(r'(gray|slate)-',name): fam='neutral'
    val=None
    if kind=='bg':
        if alpha<50: continue  # translucent highlights over dark gradients stay as they are
        if L>0.78: val=BG_SOFT[fam] if not (fam=='neutral' and L<0.95) else 'var(--kd-surface-2)'
        elif L>0.45: val=BG_MID[fam]
        else: continue
        if name=='white': val='var(--kd-surface)'
        prop='background-color'
    elif kind=='text':
        if name in ('white',) : continue
        if L>0.3: continue
        if fam=='neutral':
            val='var(--kd-text)' if L<0.06 else 'var(--kd-muted)'
        else:
            val=TXT[fam]
        if name in ('kharcha-navy','[#18324b]','[#023b81]','black','gray-900','gray-800','slate-900'): val='var(--kd-text)'
        if name=='[#023b81]': val='#9cc3ff'
        prop='color'
    else:
        if name=='black' or name.startswith('gray-9') or name=='[#18324b]': val='var(--kd-line)'
        elif L>0.45: val=BORDER[fam]
        else: continue
        prop='border-color'
    sel=f'html.dark .{esc(c)}{pseudo}'
    rules.append(f'  {sel} {{ {prop}: {val} !important; }}')
print('\n'.join(rules))
