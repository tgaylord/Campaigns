import sys, asyncio
from playwright.async_api import async_playwright
async def main(path, out):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, w, h in [('desk', 1360, 1500), ('phone', 390, 2400)]:
            pg = await b.new_page(viewport={'width': w, 'height': h})
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('file://' + path)
            await pg.click('[data-open="a5"]')
            await pg.screenshot(path=f'{out}/{name}-chainA.png', full_page=(name=='desk'))
            await pg.click('[data-chain="B"]') if name=='desk' else await pg.click('[data-chain="B"]')
            await pg.click('[data-open="b2"]')
            await pg.screenshot(path=f'{out}/{name}-chainB.png')
            await pg.click('[data-tab="reverse"]')
            await pg.screenshot(path=f'{out}/{name}-reverse.png')
            await pg.click('[data-tab="workshop"]')
            await pg.click('.sug[data-s="s1"] [data-v="confirm"]')
            await pg.screenshot(path=f'{out}/{name}-workshop.png')
            # horizontal overflow check
            ov = await pg.evaluate('document.documentElement.scrollWidth - window.innerWidth')
            print(name, 'errors', errs, 'overflow', ov)
        await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2]))
