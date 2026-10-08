"""Native-period transforms; missing reference periods are never filled."""
import datetime as dt,math
UTC=dt.timezone.utc
def quarterly_transform(observations,lag):
    if lag not in (1,4):raise ValueError('Quarterly lag must be one or four quarters')
    quarters={}
    for point in observations:
        date=dt.datetime.fromtimestamp(point['t']/1000,UTC)
        if date.month not in (1,4,7,10) or date.day!=1:raise ValueError('GDP parent is not a quarterly reference series')
        value=float(point['v']);key=date.year*4+(date.month-1)//3
        if key in quarters or not math.isfinite(value) or value<=0:raise ValueError('Invalid/duplicate GDP reference period')
        quarters[key]=(point['t'],value)
    return [{'t':stamp,'v':100*(value/quarters[key-lag][1]-1)} for key,(stamp,value) in sorted(quarters.items()) if key-lag in quarters]
