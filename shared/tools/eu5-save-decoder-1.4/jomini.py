import re,mmap,json,os,pickle
TOK=re.compile(r'"(?:[^"\\]|\\.)*"|[{}=]|[^\s{}="]+')
def parse(text):
    toks=TOK.findall(text); i=0
    def val(tk):
        if tk.startswith('"'): return tk[1:-1]
        return tk
    def block():
        nonlocal i
        items=[]  # list of (key,val) or (None,val)
        while i<len(toks):
            t=toks[i]
            if t=='}': i+=1; return items
            if t=='{': i+=1; items.append((None,block())); continue
            if i+1<len(toks) and toks[i+1]=='=':
                k=val(t); i+=2
                if toks[i]=='{': i+=1; v=block()
                else:
                    v=val(toks[i]); i+=1
                    # rgb { } etc
                    if i<len(toks) and toks[i]=='{' and v in('rgb','hsv','hsv360','LIST','T_0243'): i+=1; v=(v,block())
                items.append((k,v))
            else:
                items.append((None,val(t))); i+=1
        return items
    return block()
def get(items,key,default=None):
    for k,v in items:
        if k==key: return v
    return default
def getall(items,key): return [v for k,v in items if k==key]
def vals(items): return [v for k,v in items if k is None]

class DB:
    """offset index of entries 'ID={' in a section file at given indentation"""
    def __init__(self,path,indent=''):
        self.path=path; fh=open(path,'rb'); self.fh=fh
        self.m=mmap.mmap(fh.fileno(),0,access=mmap.ACCESS_READ)
        ip=path+'.idx'
        if os.path.exists(ip): self.idx=pickle.load(open(ip,'rb'))
        else:
            self.idx={}
            for mt in re.finditer(rb'\n'+indent.encode()+rb'(\d+)=\{',self.m):
                self.idx[int(mt.group(1))]=mt.start()+1
            pickle.dump(self.idx,open(ip,'wb'))
    def raw(self,i):
        s=self.idx.get(int(i))
        if s is None: return None
        m=self.m; j=m.find(b'{',s); d=0; inq=False
        # fast scan via regex
        for mt in re.finditer(rb'"(?:[^"\\]|\\.)*"|[{}]',m[j:j+5_000_000]):
            c=mt.group(0)
            if c==b'{': d+=1
            elif c==b'}':
                d-=1
                if d==0: return m[s:j+mt.end()].decode('utf8','replace')
    def get(self,i):
        r=self.raw(i)
        if r is None: return None
        return parse(r)[0][1]
