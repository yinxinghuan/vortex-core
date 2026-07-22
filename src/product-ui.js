const COPY = {
    zh: { gesture: '双指按住涡核' },
    en: { gesture: 'TWO FINGERS ON THE CORE' },
}

function detectLocale() {
    const saved = localStorage.getItem( 'game_locale' )
    if ( saved === 'zh' || saved === 'en' ) return saved
    return navigator.language.toLowerCase().startsWith( 'zh' ) ? 'zh' : 'en'
}

function lerp( a, b, t ) { return a + ( b - a ) * t }
function easeOut( t ) { return 1 - Math.pow( 1 - t, 3 ) }
function easeInOut( t ) { return t < .5 ? 4 * t * t * t : 1 - Math.pow( -2 * t + 2, 3 ) / 2 }

class VortexTone {
    context = null

    unlock() {
        if ( !this.context ) this.context = new AudioContext()
        if ( this.context.state === 'suspended' ) this.context.resume()
    }

    play( from, to, duration, type = 'sine', volume = .012, delay = 0 ) {
        if ( !this.context ) return
        const now = this.context.currentTime + delay
        const oscillator = this.context.createOscillator()
        const gain = this.context.createGain()
        oscillator.type = type
        oscillator.frequency.setValueAtTime( from, now )
        oscillator.frequency.exponentialRampToValueAtTime( Math.max( 1, to ), now + duration )
        gain.gain.setValueAtTime( .0001, now )
        gain.gain.exponentialRampToValueAtTime( volume, now + .025 )
        gain.gain.exponentialRampToValueAtTime( .0001, now + duration )
        oscillator.connect( gain ).connect( this.context.destination )
        oscillator.start( now )
        oscillator.stop( now + duration + .04 )
    }
}

export default class VortexCoreExperience {
    constructor( experience ) {
        this.experience = experience
        this.copy = COPY[ detectLocale() ]
        this.hint = document.querySelector( '[data-vc-hint]' )
        this.guide = document.querySelector( '[data-vc-guide]' )
        this.ring = document.querySelector( '[data-vc-ring]' )
        this.ringCircle = this.ring.querySelector( 'circle' )
        this.state = 'loading'
        this.pointerId = null
        this.touchPoints = new Map()
        this.effectTouchIds = new Set()
        this.defaultTwoTouchAction = null
        this.synthetic = false
        this.reduced = matchMedia( '(prefers-reduced-motion: reduce)' ).matches
        this.tone = new VortexTone()
        this.demoTimer = null
        this.raf = null
        this.onReady = () => this.ready()
        window.addEventListener( '3d-app:classes-ready', this.onReady, { once: true } )
    }

    ready() {
        const world = this.experience.worlds.mainWorld
        this.galaxy = world.galaxy
        this.sphere = world.sphere
        this.controls = world.camera.controls
        this.controls.enabled = true
        this.defaultTwoTouchAction = this.controls.touches.TWO
        this.original = { radius: 1, speed: .1, frequency: 1.4, emission: .4, dispersion: 5 }
        this.chargeTarget = { radius: 1.82, speed: .025, frequency: 1.54, emission: .14, dispersion: 5.5 }
        this.releaseTarget = { radius: .94, speed: .38, frequency: 1.36, emission: .58, dispersion: 5.6 }
        this.bind()
        this.setState( 'idle' )
        this.raf = requestAnimationFrame( now => this.update( now ) )
    }

    bind() {
        window.addEventListener( 'pointerdown', event => this.onTouchDown( event ), { capture: true } )
        window.addEventListener( 'pointermove', event => this.onTouchMove( event ), { capture: true } )
        const end = event => {
            if ( event.pointerType === 'touch' ) this.onTouchEnd( event )
        }
        window.addEventListener( 'pointerup', end, { capture: true } )
        window.addEventListener( 'pointercancel', end, { capture: true } )
        window.addEventListener( 'keydown', event => {
            if ( event.code !== 'Space' || event.repeat || this.state !== 'idle' ) return
            event.preventDefault()
            this.cancelDemo()
            this.pointerId = 'keyboard'
            this.tone.unlock()
            this.tone.play( 58, 46, .12, 'sine', .012 )
            this.begin( false )
        } )
        window.addEventListener( 'keyup', event => {
            if ( event.code !== 'Space' || this.pointerId !== 'keyboard' ) return
            event.preventDefault()
            this.pointerId = null
            this.release()
        } )
    }

    onTouchDown( event ) {
        if ( event.pointerType !== 'touch' ) return
        this.touchPoints.set( event.pointerId, { x: event.clientX, y: event.clientY } )
        if ( this.touchPoints.size !== 2 || this.state !== 'idle' ) return

        const radius = Math.min( innerWidth, innerHeight ) * .32
        const points = [ ...this.touchPoints.values() ]
        const onCore = points.every( point => Math.hypot( point.x - innerWidth * .5, point.y - innerHeight * .5 ) <= radius )
        if ( !onCore ) return

        this.controls.touches.TWO = -1
        this.effectTouchIds = new Set( this.touchPoints.keys() )
        this.pointerId = 'touch-pair'
        this.tone.unlock()
        this.tone.play( 58, 46, .12, 'sine', .012 )
        this.begin( false )
    }

    onTouchMove( event ) {
        if ( !this.touchPoints.has( event.pointerId ) ) return
        this.touchPoints.set( event.pointerId, { x: event.clientX, y: event.clientY } )
    }

    onTouchEnd( event ) {
        const wasEffectTouch = this.effectTouchIds.has( event.pointerId )
        this.touchPoints.delete( event.pointerId )
        if ( wasEffectTouch && this.pointerId === 'touch-pair' ) {
            this.pointerId = null
            this.release()
        }
        if ( this.touchPoints.size === 0 ) {
            this.controls.touches.TWO = this.defaultTwoTouchAction
            this.effectTouchIds.clear()
        }
    }

    begin( synthetic ) {
        if ( this.state !== 'idle' ) return
        this.synthetic = synthetic
        this.startedAt = performance.now()
        if ( !synthetic ) this.hint.classList.add( 'is-discovered' )
        this.guide.classList.toggle( 'is-visible', synthetic )
        this.ring.classList.add( 'is-visible' )
        this.setState( 'charging' )
        if ( synthetic ) this.demoReleaseTimer = setTimeout( () => this.release(), 900 )
    }

    release() {
        if ( this.state !== 'charging' && this.state !== 'full' ) return
        const now = performance.now()
        this.charge = Math.min( 1, ( now - this.startedAt ) / 900 )
        this.releaseFrom = this.values()
        this.releasePeak = {
            radius: lerp( this.releaseFrom.radius, this.releaseTarget.radius, .45 + this.charge * .55 ),
            speed: lerp( this.releaseFrom.speed, this.releaseTarget.speed, .45 + this.charge * .55 ),
            frequency: lerp( this.releaseFrom.frequency, this.releaseTarget.frequency, .45 + this.charge * .55 ),
            emission: lerp( this.releaseFrom.emission, this.releaseTarget.emission, .45 + this.charge * .55 ),
            dispersion: lerp( this.releaseFrom.dispersion, this.releaseTarget.dispersion, .45 + this.charge * .55 ),
        }
        this.startedAt = now
        this.guide.classList.remove( 'is-visible' )
        this.ring.classList.add( 'is-releasing' )
        this.setState( 'release' )
        if ( !this.synthetic ) {
            this.tone.play( 74, 620, .42, 'sine', .016 )
            this.tone.play( 42, 42, .26, 'sine', .018 )
        }
    }

    cancelDemo() {
        clearTimeout( this.demoTimer )
        clearTimeout( this.demoReleaseTimer )
        if ( !this.synthetic ) return
        this.synthetic = false
        this.guide.classList.remove( 'is-visible' )
        this.ring.classList.remove( 'is-visible', 'is-releasing' )
        this.apply( this.original )
        this.setState( 'idle' )
    }

    values() {
        return {
            radius: this.galaxy.uniforms.radius.value,
            speed: this.galaxy.uniforms.speed.value,
            frequency: this.galaxy.uniforms.frequency.value,
            emission: this.galaxy.uniforms.emissionMultiplier.value,
            dispersion: this.sphere.sphereMaterial.dispersion,
        }
    }

    mixValues( from, to, t ) {
        return {
            radius: lerp( from.radius, to.radius, t ),
            speed: lerp( from.speed, to.speed, t ),
            frequency: lerp( from.frequency, to.frequency, t ),
            emission: lerp( from.emission, to.emission, t ),
            dispersion: lerp( from.dispersion, to.dispersion, t ),
        }
    }

    apply( values ) {
        this.galaxy.uniforms.radius.value = values.radius
        this.galaxy.uniforms.speed.value = values.speed
        this.galaxy.uniforms.frequency.value = values.frequency
        this.galaxy.uniforms.emissionMultiplier.value = values.emission
        this.sphere.sphereMaterial.dispersion = values.dispersion
    }

    setState( state ) {
        this.state = state
        document.documentElement.dataset.phase = state
        this.hint.textContent = this.copy.gesture
    }

    update( now ) {
        if ( this.state === 'charging' || this.state === 'full' ) {
            const progress = Math.min( 1, ( now - this.startedAt ) / 900 )
            this.charge = progress
            this.apply( this.mixValues( this.original, this.chargeTarget, easeInOut( progress ) ) )
            this.ringCircle.style.strokeDashoffset = String( 201 * ( 1 - progress ) )
            if ( progress >= 1 && this.state !== 'full' ) {
                this.setState( 'full' )
                if ( !this.synthetic ) this.tone.play( 196, 196, .08, 'triangle', .008 )
            }
        } else if ( this.state === 'release' ) {
            const progress = Math.min( 1, ( now - this.startedAt ) / ( this.reduced ? 100 : 180 ) )
            this.apply( this.mixValues( this.releaseFrom, this.releasePeak, easeOut( progress ) ) )
            if ( progress >= 1 ) {
                this.startedAt = now
                this.setState( 'recover' )
            }
        } else if ( this.state === 'recover' ) {
            const duration = this.reduced ? 420 : 1450
            const progress = Math.min( 1, ( now - this.startedAt ) / duration )
            this.apply( this.mixValues( this.releasePeak, this.original, easeInOut( progress ) ) )
            if ( progress >= 1 ) {
                this.synthetic = false
                this.ring.classList.remove( 'is-visible', 'is-releasing' )
                this.ringCircle.style.strokeDashoffset = '201'
                this.setState( 'idle' )
            }
        }
        this.raf = requestAnimationFrame( time => this.update( time ) )
    }
}
