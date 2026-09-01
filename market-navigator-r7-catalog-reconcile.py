#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

CATALOG=Path('data/market-backend/data-catalog.json')
DERIVED=Path('data/market-backend/derived-index-definition.json')
H=['1D','5D','MTD','YTD','1YR','3YR','5YR']

def load(p): return json.loads(p.read_text())
def write(p,o): p.write_text(json.dumps(o,indent=2,ensure_ascii=False,sort_keys=True)+'\n')

def series(id,name,short,description,domain,category,provider,pid,url,unit,cadence,transform='none'):
    return {
      'id':id,'name':name,'short_name':short,'description':description,
      'domain':domain,'category':category,'role':'objective market evidence' if domain=='market' else 'objective economic evidence',
      'provider':provider,'provider_identifier':pid,'source_reference_url':url,
      'native_unit':unit,'native_cadence':cadence,'canonical_storage_cadence':'daily' if cadence in ('daily','trading-day') else cadence,
      'check_on_daily_run':True,'transformation':transform,'required':True,'enabled':True,'supported_horizons':H[:]
    }

def main():
    c=load(CATALOG)
    c['version']='1.2.0'
    c['status']='authoritative-r7-reconciled'
    c['canonical_horizons']=H[:]
    c['horizon_policy']={
      '1D':'Latest valid observation versus the immediately preceding applicable observation/session.',
      '5D':'Latest valid observation versus the nearest valid observation five applicable observation/trading days earlier.',
      'MTD':'Month-to-date from the last valid observation at or before the beginning of the current calendar month to the common market anchor.',
      'YTD':'Year-to-date from the last valid observation at or before the beginning of the current calendar year to the common market anchor.',
      '1YR':'Latest valid observation versus the nearest valid observation on or before one calendar year earlier.',
      '3YR':'Latest valid observation versus the nearest valid observation on or before three calendar years earlier.',
      '5YR':'Latest valid observation versus the nearest valid observation on or before five calendar years earlier.',
      'low_frequency_rule':'Do not fabricate daily observations for weekly, monthly or quarterly series. Use actual published observations and expose no-new-release state when appropriate.'
    }
    existing={x['id']:x for x in c['series']}
    additions=[
      series('hyg','iShares iBoxx High Yield Corporate Bond ETF','HYG','Liquid high-yield bond price proxy used as a risk-appetite component.','market','credit','Yahoo Finance','HYG','https://finance.yahoo.com/quote/HYG/','USD','trading-day'),
      series('move','ICE BofA MOVE Index','MOVE','Treasury-market implied volatility index used as a rates-volatility stress component.','market','volatility','Yahoo Finance','^MOVE','https://finance.yahoo.com/quote/%5EMOVE/','index','trading-day'),
      series('copper','Copper Futures','COP','COMEX copper futures used as a cyclical growth/industrial-demand market proxy.','market','commodities','Yahoo Finance','HG=F','https://finance.yahoo.com/quote/HG%3DF/','USD per pound','trading-day'),
      series('smallCaps','Russell 2000 ETF','IWM','iShares Russell 2000 ETF used as a small-cap growth/risk proxy.','market','equities','Yahoo Finance','IWM','https://finance.yahoo.com/quote/IWM/','USD','trading-day'),
      series('pmi','ISM Manufacturing PMI','PMI','ISM manufacturing purchasing managers index used as a monthly growth-cycle measure.','macro','growth','FRED','NAPM','https://fred.stlouisfed.org/series/NAPM','index','monthly'),
      series('unemployment','Unemployment Rate','UNE','U.S. civilian unemployment rate used as an inverse growth/labor component.','macro','labor','FRED','UNRATE','https://fred.stlouisfed.org/series/UNRATE','percent','monthly'),
      series('curve10y3m','10-Year minus 3-Month Treasury Spread','3M','10-year Treasury yield minus 3-month Treasury yield spread.','macro','rates','FRED','T10Y3M','https://fred.stlouisfed.org/series/T10Y3M','percent','daily')
    ]
    for x in additions:
        if x['id'] in existing:
            existing[x['id']].update(x)
        else:
            c['series'].append(x); existing[x['id']]=x
    for x in c['series']:
        x['supported_horizons']=H[:]
    # Accepted components are required; do not silently substitute missing data.
    required={'spy','vix','hySpread','hyg','dxy','move','nfci','qqq','copper','smallCaps','pmi','wti','unemployment','payrolls','tenYear','twoYear','curve10y2y','curve10y3m','cpi','corePce','fedFunds'}
    for x in c['series']:
        if x['id'] in required: x['required']=True; x['enabled']=True
    write(CATALOG,c)
    d={
      'schema':'market-navigator-derived-index-definition-v1','version':'2.0.0','status':'canonical-r7-reconciled','effective_date':'2026-08-31',
      'purpose':'Accepted Market Navigator Risk/Growth/Macro definitions. Equal-weight, direction-adjusted, rebased 100.',
      'display_contract':{
        'v1':'Risk, Growth and Macro are displayed together in NOW from a common baseline of 100.',
        'v2':'The selected index reference plus all components are displayed below V1 from a common baseline of 100.',
        'baseline':100,'weighting':'equal',
        'component_formula':'oriented_index_t = 100 + direction * ((value_t / value_t0) - 1) * 100',
        'index_formula':'index_t = arithmetic mean of available oriented_index_t component values',
        'mixed_frequency_rule':'Derived composites may carry each component most recent real observation internally; source observation dates remain traceable and no synthetic source observation is written.',
        'interpretation_rule':'Derived indices are transparent comparative analytical products, not causal or predictive verdicts.'
      },
      'indices':{
        'risk':{'name':'Risk','higher_means':'more market and financial stress','components':[
          {'id':'spy','direction':-1,'role':'broad equity risk appetite'},
          {'id':'vix','direction':1,'role':'equity volatility'},
          {'id':'hySpread','direction':1,'role':'credit spread'},
          {'id':'hyg','direction':-1,'role':'high-yield bond price/risk appetite'},
          {'id':'dxy','direction':1,'role':'dollar/global financial-conditions pressure'},
          {'id':'move','direction':1,'role':'Treasury volatility'},
          {'id':'nfci','direction':1,'role':'financial conditions restriction'}]},
        'growth':{'name':'Growth','higher_means':'stronger growth momentum','components':[
          {'id':'qqq','direction':1,'role':'Nasdaq/growth leadership'},
          {'id':'copper','direction':1,'role':'industrial/cyclical demand'},
          {'id':'smallCaps','direction':1,'role':'small-cap growth/risk appetite'},
          {'id':'pmi','direction':1,'role':'manufacturing cycle'},
          {'id':'wti','direction':1,'role':'cyclical demand context'},
          {'id':'unemployment','direction':-1,'role':'labor deterioration'},
          {'id':'payrolls','direction':1,'role':'employment activity'}]},
        'macro':{'name':'Macro','higher_means':'greater inflation and monetary-policy pressure','components':[
          {'id':'tenYear','direction':1,'role':'10-year nominal rate'},
          {'id':'twoYear','direction':1,'role':'2-year nominal rate'},
          {'id':'curve10y2y','direction':1,'role':'10Y-2Y curve'},
          {'id':'curve10y3m','direction':1,'role':'10Y-3M curve'},
          {'id':'cpi','direction':1,'role':'headline inflation'},
          {'id':'corePce','direction':1,'role':'core PCE inflation'},
          {'id':'fedFunds','direction':1,'role':'policy rate'}]}
      }
    }
    write(DERIVED,d)
    print('Reconciled catalog',c['version'],'series',len(c['series']))

if __name__=='__main__': main()
