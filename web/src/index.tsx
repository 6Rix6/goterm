import { render } from 'solid-js/web'
import { registerSW } from 'virtual:pwa-register'
import { App, Home } from './App'
import './style.css'
import { Router, Route } from '@solidjs/router'
import { TokenManager } from './auth/tokenManager'

registerSW({ immediate: true })
render(
  () => {
    TokenManager.get();
    return (
      <Router>
        <Route path='/terminal' component={App} />
        <Route path='/' component={Home} />
      </Router>
    )
  },
  document.getElementById('app')!,
)
