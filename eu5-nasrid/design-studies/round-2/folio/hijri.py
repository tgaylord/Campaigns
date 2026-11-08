import math
def islamic_to_jd(y,m,d,epoch=1948439.5):
    return d + math.ceil(29.5*(m-1)) + (y-1)*354 + (3+11*y)//30 + epoch - 1
def jd_to_julian(jd):
    jd=jd+0.5; z=int(jd); a=z; b=a+1524; c=int((b-122.1)/365.25); d=int(365.25*c); e=int((b-d)/30.6001)
    day=b-d-int(30.6001*e); month=e-1 if e<14 else e-13; year=c-4716 if month>2 else c-4715
    return year,month,day
def julian_to_jd(y,m,d):
    if m<=2: y-=1; m+=12
    return int(365.25*(y+4716))+int(30.6001*(m+1))+d-1524.5
def jd_to_islamic(jd,epoch=1948439.5):
    jd=math.floor(jd)+0.5
    y=(30*(jd-epoch)+10646)//10631
    m=min(12, math.ceil((jd-(29+islamic_to_jd(y,1,1,epoch)))/29.5)+1)
    d=jd-islamic_to_jd(y,m,1,epoch)+1
    return int(y),int(m),int(d)
