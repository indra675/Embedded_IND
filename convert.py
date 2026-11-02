import re, html, sys
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph

def slug(t):
    return re.sub(r'[^a-z0-9]+','-',t.lower()).strip('-')

def runs_html(p):
    out=''
    for r in p.runs:
        t=html.escape(r.text)
        if not t: continue
        mono = r.font.name and 'consolas' in r.font.name.lower()
        if mono: t=f'<code>{t}</code>'
        if r.bold: t=f'<strong>{t}</strong>'
        if r.italic: t=f'<em>{t}</em>'
        out+=t
    return out

def is_code(p):
    rs=[r for r in p.runs if r.text.strip()]
    return bool(rs) and all(r.font.name and 'consolas' in r.font.name.lower() for r in rs)

def convert(path):
    doc=Document(path); out=[]; code=[]; ul=False; used={}
    def flush_code():
        nonlocal code
        if code:
            out.append('<pre><code>'+html.escape('\n'.join(code))+'</code></pre>'); code=[]
    def close_ul():
        nonlocal ul
        if ul: out.append('</ul>'); ul=False
    for el in doc.element.body.iterchildren():
        tag=el.tag.split('}')[1]
        if tag=='p':
            p=Paragraph(el,doc); txt=p.text
            st=p.style.name if p.style is not None else ''
            if is_code(p):
                close_ul(); code.append(txt.rstrip()); continue
            flush_code()
            if not txt.strip(): continue
            m=re.match(r'Heading (\d)',st)
            if m:
                close_ul(); n=int(m.group(1)); s=slug(txt); used[s]=used.get(s,0)+1
                if used[s]>1: s+=f'-{used[s]}'
                out.append(f'<h{n} id="{s}">{html.escape(txt)}</h{n}>')
            elif el.find('.//{*}numPr') is not None:
                if not ul: out.append('<ul>'); ul=True
                out.append(f'<li>{runs_html(p)}</li>')
            else:
                close_ul(); out.append(f'<p>{runs_html(p)}</p>')
        elif tag=='tbl':
            flush_code(); close_ul(); t=Table(el,doc)
            rows=[]
            for i,row in enumerate(t.rows):
                seen=[];cells=[]
                for c in row.cells:
                    if c._tc in seen: continue
                    seen.append(c._tc)
                    inner=' '.join(runs_html(p) for p in c.paragraphs if p.text.strip())
                    cells.append(f'<{"th" if i==0 else "td"}>{inner}</{"th" if i==0 else "td"}>')
                rows.append('<tr>'+''.join(cells)+'</tr>')
            out.append('<div class="tw"><table>'+''.join(rows)+'</table></div>')
    flush_code(); close_ul()
    return '\n'.join(out)

for f,k in [('C_Programming_Guide_and_Cheat_Sheet','c'),('Embedded_C_Guide_and_Cheat_Sheet','embedded'),('Embedded_C_Programming_Handbook','handbook')]:
    h=convert(f'/mnt/user-data/uploads/{f}.docx')
    open(f'content/{k}.html','w').write(h)
    print(k,len(h),h.count('<h2'),h.count('<pre'),h.count('<table'))
