import asyncio
from playwright.async_api import async_playwright
U='file://./mockup.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':390,'height':844})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(U+'#margin'); await pg.click('#who button[data-who=friend]'); await pg.wait_for_timeout(300)
        await pg.click('[data-follow="price-of-shant-yaqub"]'); await pg.wait_for_timeout(400)
        await pg.screenshot(path='shot-m-friend-follow.png')
        await pg.goto(U+'#threads'); await pg.wait_for_timeout(300); await pg.click('#tf button[data-f=tied]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shot-m-friend-tied.png')
        await pg.goto(U+'#verses'); await pg.fill('#vq','Owner of sovereignty'); await pg.wait_for_timeout(300)
        print(await pg.inner_text('#vres'))
        await pg.fill('#vq','ships like mountains'); await pg.wait_for_timeout(300); print('---',await pg.inner_text('#vres'))
        await pg.fill('#vq','2:216'); await pg.wait_for_timeout(300); print('---',await pg.inner_text('#vres'))
        await pg.fill('#vq','Indeed, Allah is with the patient'); await pg.wait_for_timeout(300); print('---',await pg.inner_text('#vres'))
        print('errs',errs); await b.close()
asyncio.run(main())
