import { createRequire } from 'node:module'

const require = createRequire( import.meta.url )
const { chromium } = require( 'playwright' )

const baseUrl = process.argv[ 2 ] || 'http://127.0.0.1:5190/'
const browser = await chromium.launch( {
    headless: true,
    args: [ '--enable-unsafe-webgpu', '--use-angle=swiftshader' ],
} )

async function checkProduct( width, height, quality ) {
    const context = await browser.newContext( {
        viewport: { width, height },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
    } )
    const page = await context.newPage()
    const experienceRequests = []
    page.on( 'request', request => {
        if ( request.url().includes( '/Experience-' ) || request.url().includes( '/Experience/Experience.js' ) ) {
            experienceRequests.push( request.url() )
        }
    } )

    await page.goto( `${ baseUrl }?quality=${ quality }`, { waitUntil: 'networkidle' } )
    const dormant = await page.evaluate( () => ( {
        hasExperience: Boolean( window.experience ),
        hasPerformanceProfile: Boolean( window.__VORTEX_CORE_PERF__ ),
        hasRendererQa: Boolean( window.__VORTEX_CORE_QA__ ),
        rootClass: document.documentElement.className,
    } ) )
    const experienceRequestsBeforeClick = experienceRequests.length
    await page.screenshot( {
        path: `_qa/ui/perf-dormant-${ width }x${ height }.png`,
    } )

    await page.click( '[data-vc-start]' )
    await page.waitForFunction( () => window.__VORTEX_CORE_QA__?.getState().appLoaded, null, { timeout: 30000 } )
    await page.waitForTimeout( 2500 )
    const active = await page.evaluate( () => window.__VORTEX_CORE_QA__.getState() )
    await page.screenshot( {
        path: `_qa/ui/perf-${ quality }-${ width }x${ height }.png`,
    } )

    await context.close()
    return {
        width,
        height,
        quality,
        dormant,
        active,
        experienceRequestsBeforeClick,
        experienceRequestsAfterClick: experienceRequests.length,
    }
}

async function checkBaseline() {
    const context = await browser.newContext( {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
    } )
    const page = await context.newPage()
    await page.goto( `${ baseUrl }?baseline=1`, { waitUntil: 'networkidle' } )
    await page.waitForFunction( () => window.__VORTEX_CORE_QA__?.getState().appLoaded, null, { timeout: 30000 } )
    const state = await page.evaluate( () => window.__VORTEX_CORE_QA__.getState() )
    await context.close()
    return state
}

const results = [
    await checkProduct( 390, 844, 'medium' ),
    await checkProduct( 320, 568, 'low' ),
    { baseline: await checkBaseline() },
]

console.log( JSON.stringify( results, null, 2 ) )
await browser.close()
