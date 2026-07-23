import EventEmitter from './EventEmitter.js'
import performanceProfile from './PerformanceProfile.js'

export default class Sizes extends EventEmitter {

    static _instance = null

    static getInstance() {
        return Sizes._instance || new Sizes()
    }

    constructor() {
        // Singleton
        if ( Sizes._instance ) {
            return Sizes._instance
        }

        super()

        Sizes._instance = this

        // Setup
        this.pixelRatio = performanceProfile.pixelRatio
        this.width = window.innerWidth
        this.height = window.innerHeight

        this.width_DPR = this.width * this.pixelRatio
        this.height_DPR = this.height * this.pixelRatio

        // Resize event
        window.addEventListener( 'resize', () => {
            this.pixelRatio = performanceProfile.pixelRatio
            this.width = window.innerWidth
            this.height = window.innerHeight

            this.width_DPR = this.width * this.pixelRatio
            this.height_DPR = this.height * this.pixelRatio

            this.trigger( 'resize' )
        } )
    }

}
