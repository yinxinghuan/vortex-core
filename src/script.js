const baseline = new URLSearchParams( window.location.search ).get( 'baseline' ) === '1'
document.documentElement.classList.toggle( 'product', !baseline )
if ( !baseline ) document.title = 'Vortex Core'

async function bootBaseline() {
    await import( './preloader.js' )
    const { default: Experience } = await import( './Experience/Experience.js' )
    new Experience( document.querySelector( 'canvas.webgl' ) )
}

function bootProduct() {
    const root = document.documentElement
    const start = document.querySelector( '[data-vc-start]' )
    const status = document.querySelector( '[data-vc-start-status]' )
    const locale = navigator.language.toLowerCase().startsWith( 'zh' ) ? 'zh' : 'en'
    const copy = locale === 'zh'
        ? { enter: '点击唤醒', loading: '正在唤醒涡核…' }
        : { enter: 'TAP TO AWAKEN', loading: 'AWAKENING THE CORE…' }

    status.textContent = copy.enter
    root.classList.add( 'vc-dormant' )

    const startExperience = async () => {
        if ( start.disabled ) return
        start.disabled = true
        start.setAttribute( 'aria-busy', 'true' )
        status.textContent = copy.loading
        root.classList.replace( 'vc-dormant', 'vc-starting' )

        window.preloader = {
            hidePreloader() {
                root.classList.replace( 'vc-starting', 'vc-running' )
                start.classList.add( 'is-leaving' )
                window.setTimeout( () => start.remove(), 620 )
            },
        }

        try {
            const [ { default: Experience }, { default: VortexCoreExperience } ] = await Promise.all( [
                import( './Experience/Experience.js' ),
                import( './product-ui.js' ),
            ] )
            const experience = new Experience( document.querySelector( 'canvas.webgl' ) )
            new VortexCoreExperience( experience )
        } catch ( error ) {
            console.error( error )
            root.classList.replace( 'vc-starting', 'vc-dormant' )
            start.disabled = false
            start.removeAttribute( 'aria-busy' )
            status.textContent = copy.enter
        }
    }

    start.addEventListener( 'click', startExperience )
}

if ( baseline ) {
    bootBaseline()
} else {
    bootProduct()
}
