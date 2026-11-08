import asyncio, sys
from playwright.async_api import async_playwright
U='file://./mockup.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name,(w,h) in {'d':(1280,900),'m':(390,844)}.items():
            pg = await b.new_page(viewport={'width':w,'height':h})
            errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
            for v in ['cover','threads','thread/price-of-shant-yaqub','court','verses','awaiting','checklist','margin']:
                await pg.goto(U+'#'+v); await pg.wait_for_timeout(500)
                await pg.screenshot(path=f'shot-{name}-{v.replace("/","_")}.png', full_page=(name=='d'))
            sw = await pg.evaluate('document.documentElement.scrollWidth')
            print(name, 'errors', errs, 'scrollWidth', sw)
        await b.close()
asyncio.run(main())
