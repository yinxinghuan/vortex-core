const params = new URLSearchParams( window.location.search )
const baseline = params.get( 'baseline' ) === '1'

const PROFILES = {
    low: {
        id: 'low',
        segments: 224,
        particleCount: 50625,
        particleSize: 0.033,
        maxPixelRatio: 1,
        targetFps: 30,
        antialias: false,
    },
    medium: {
        id: 'medium',
        segments: 320,
        particleCount: 103041,
        particleSize: 0.026,
        maxPixelRatio: 1.25,
        targetFps: 45,
        antialias: true,
    },
    high: {
        id: 'high',
        segments: 384,
        particleCount: 148225,
        particleSize: 0.023,
        maxPixelRatio: 1.5,
        targetFps: 60,
        antialias: true,
    },
    baseline: {
        id: 'baseline',
        segments: 512,
        particleCount: 263169,
        particleSize: 0.02,
        maxPixelRatio: 2,
        targetFps: 0,
        antialias: true,
    },
}

function selectProductProfile() {
    const override = params.get( 'quality' )
    if ( override && PROFILES[ override ] ) return PROFILES[ override ]

    const minDimension = Math.min( window.innerWidth, window.innerHeight )
    const coarsePointer = window.matchMedia( '(pointer: coarse)' ).matches
    const memory = navigator.deviceMemory || 8
    const cores = navigator.hardwareConcurrency || 8

    if ( ( coarsePointer || minDimension <= 430 ) && ( minDimension <= 360 || memory <= 4 || cores <= 4 ) ) {
        return PROFILES.low
    }

    if ( coarsePointer || minDimension <= 600 || memory <= 8 || cores <= 8 ) {
        return PROFILES.medium
    }

    return PROFILES.high
}

const selected = baseline ? PROFILES.baseline : selectProductProfile()
const profile = Object.freeze( {
    ...selected,
    baseline,
    pixelRatio: Math.min( window.devicePixelRatio || 1, selected.maxPixelRatio ),
} )

window.__VORTEX_CORE_PERF__ = profile

export default profile
