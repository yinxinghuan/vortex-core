import './preloader.js'

import Experience from './Experience/Experience.js'
import VortexCoreExperience from './product-ui.js'

const baseline = new URLSearchParams( window.location.search ).get( 'baseline' ) === '1'
document.documentElement.classList.toggle( 'product', !baseline )
if ( !baseline ) document.title = 'Vortex Core'

const experience = new Experience(document.querySelector('canvas.webgl'))

if ( !baseline ) new VortexCoreExperience( experience )
