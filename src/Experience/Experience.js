import * as THREE from 'three/webgpu'
import EventEmitter from './Utils/EventEmitter.js'

import Debug from './Utils/Debug.js'
import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import Renderer from './Renderer.js'
import Worlds from './Worlds.js'
import Resources from './Utils/Resources.js'
import Sound from "./Utils/Sound.js";

import sources from './Sources.js'
import gsap from "gsap";
import MotionPathPlugin from "gsap/MotionPathPlugin";
import State from './State.js'
import PostProcess from './Utils/PostProcess.js'
import performanceProfile from './Utils/PerformanceProfile.js'

import { isMobile } from '@experience/Utils/Helpers/Global/isMobile';
import Ui from "@experience/Ui/Ui.js";

export default class Experience extends EventEmitter {

    static _instance = null

    appLoaded = false;
    firstRender = false;

    static getInstance() {
        return Experience._instance || new Experience()
    }

    constructor( _canvas ) {
        super()
        // Singleton
        if ( Experience._instance ) {
            return Experience._instance
        }
        Experience._instance = this

        // Global access
        window.experience = this

        // Html Elements
        this.html = {}
        this.html.preloader = document.getElementById( "preloader" )
        this.html.playButton = document.getElementById( "play-button" )
        this.html.main = document.getElementsByTagName( "main" )[ 0 ]

        this.isMobile = isMobile.any()
        this.performance = performanceProfile

        // Options
        this.canvas = _canvas
        THREE.ColorManagement.enabled = false

        if ( !this.canvas ) {
            console.warn( 'Missing \'Canvas\' property' )
            return
        }

        this.setDefaultCode();

        this.init()
    }

    init() {
        // Start Loading Resources
        const activeSources = this.performance.baseline
            ? sources
            : sources.filter( source => source.name === 'hdriTexture' )
        this.resources = new Resources( activeSources )

        // Setup
        this.timeline = gsap.timeline({
            paused: true,
        });
        this.debug = new Debug()
        this.sizes = new Sizes()
        this.time = new Time()
        this.ui = new Ui()
        this.renderer = new Renderer()
        this.state = new State()
        this.sound = new Sound()

        this.mainCamera = undefined
        this.mainScene = undefined

        if ( this.state.postprocessing ) {
            this.postProcess = new PostProcess( this.renderer.instance )
        }

        // Wait for resources
        this.resources.on( 'ready', () => {
            setTimeout( () => {
                window.preloader.hidePreloader()
                this.html.main.style.display = "block"
                // window.preloader.showPlayButton(() => {
                //     // start media playing
                // })
            }, 1000)

            this.time.reset()

            this.worlds = new Worlds()
            this.animationPipeline();

            this.postInit()

            this.setListeners()

            this.trigger("classesReady");
            window.dispatchEvent( new CustomEvent( "3d-app:classes-ready" ) );

            this.appLoaded = true
        } )
    }

    animationPipeline() {
        this.worlds?.animationPipeline()
    }

    postInit() {
        this.renderer.postInit()
        this.postProcess?.postInit()
        this.worlds?.postInit()
        this.debug?.postInit()
    }

    resize() {
        this.worlds.resize()
        this.renderer.resize()
        this.postProcess?.resize()
        this.debug?.resize()
        this.state?.resize()
        //this.sound.resize()
    }

    async update() {
        this.worlds.update( this.time.delta )

        if ( this.state.postprocessing ) {
            this.postProcess.update( this.time.delta )
        } else {
            await this.renderer.update( this.time.delta )
        }

        if ( this.debug.active ) {
            this.debug.update( this.time.delta )
        }

        this.postUpdate( this.time.delta )

        this.debug?.stats?.update();
    }

    _fireReady() {
        this.trigger( 'ready' )
        window.dispatchEvent( new CustomEvent( "3d-app:ready" ) );

        this.firstRender = 'done';
    }

    postUpdate( deltaTime ) {
        if ( this.firstRender === true ) {
            window.dispatchEvent( new CustomEvent( "app:first-render" ) );

            // Dispatch event
            this._fireReady();
        }

        if ( this.resources.loadedAll && this.appLoaded && this.firstRender === false ) {
            this.firstRender = true;
        }

        this.worlds.postUpdate( deltaTime )
    }

    setListeners() {
        // Resize event
        this.sizes.on( 'resize', () => {
            this.resize()
        } )

        this.renderInFlight = false
        this.renderedFrames = 0
        this.lastRenderAt = 0
        const minFrameMs = this.performance.targetFps > 0
            ? 1000 / this.performance.targetFps
            : 0

        this.renderer.instance.setAnimationLoop( timestamp => {
            if ( document.hidden || this.renderInFlight ) return
            if ( minFrameMs && timestamp - this.lastRenderAt < minFrameMs - 1 ) return

            const elapsed = timestamp - this.lastRenderAt
            this.lastRenderAt = minFrameMs
                ? timestamp - ( elapsed % minFrameMs )
                : timestamp
            this.renderInFlight = true
            Promise.resolve( this.update() )
                .then( () => { this.renderedFrames += 1 } )
                .catch( error => console.error( 'Vortex Core render failed', error ) )
                .finally( () => { this.renderInFlight = false } )
        } )

        document.addEventListener( 'visibilitychange', () => {
            if ( !document.hidden ) {
                this.lastRenderAt = performance.now() - minFrameMs
                this.time.reset()
            }
        } )

        window.__VORTEX_CORE_QA__ = {
            getState: () => ( {
                profile: this.performance,
                appLoaded: this.appLoaded,
                particleCount: this.worlds?.mainWorld?.galaxy?.particlesMesh?.count || 0,
                renderedFrames: this.renderedFrames,
                renderInFlight: this.renderInFlight,
                pixelRatio: this.renderer.instance.getPixelRatio(),
            } ),
        }
    }

    setDefaultCode() {
        document.ondblclick = function ( e ) {
            e.preventDefault()
        }

        gsap.registerPlugin( MotionPathPlugin );
    }

    startWithPreloader() {
        this.ui.playButton.classList.add( "fade-in" );
        this.ui.playButton.addEventListener( 'click', () => {

            this.ui.playButton.classList.replace( "fade-in", "fade-out" );
            //this.sound.createSounds();

            setTimeout( () => {
                this.time.reset()

                // Setup
                this.setupWorlds()

                // Remove preloader
                this.ui.preloader.classList.add( "preloaded" );
                setTimeout( () => {
                    this.ui.preloader.remove();
                    this.ui.playButton.remove();
                }, 2500 );
            }, 100 );
        }, { once: true } );
    }

    destroy() {
        this.sizes.off( 'resize' )
        this.time.off( 'tick' )

        // Traverse the whole scene
        this.scene.traverse( ( child ) => {
            // Test if it's a mesh
            if ( child instanceof THREE.Mesh ) {
                child.geometry.dispose()

                // Loop through the material properties
                for ( const key in child.material ) {
                    const value = child.material[ key ]

                    // Test if there is a dispose function
                    if ( value && typeof value.dispose === 'function' ) {
                        value.dispose()
                    }
                }
            }
        } )

        this.camera.controls.dispose()
        this.renderer.instance.dispose()

        if ( this.debug.active )
            this.debug.ui.destroy()
    }
}
