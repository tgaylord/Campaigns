import json,re,glob,os,sys

def entries(B):
    out=[]
    for f in sorted(glob.glob(B+'/chronicle/*.md')):
        t=open(f,encoding='utf-8').read()
        fm,body=t.split('---',2)[1],t.split('---',2)[2].strip()
        d={'file':os.path.basename(f)[:-3]}
        for line in fm.strip().split('\n'):
            k,v=line.split(':',1); v=v.strip()
            if v.startswith('['): v=[x.strip() for x in v[1:-1].split(',') if x.strip()]
            d[k]=v
        d['body']=body
        paras=[p for p in body.split('\n\n') if p.strip()]
        last=paras[-1]
        spans=re.findall(r'(?<!\*)\*([^*]+)\*(?!\*)',last)
        d['verse']=max(spans,key=len) if spans else None
        d['linked']=sorted(set(re.findall(r'\(person:([a-z0-9-]+)\)',body)))
        d['words']=len(body.split())
        out.append(d)
    return out
