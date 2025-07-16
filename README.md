# bs-layerSlideMenu

A lightweight sliding layer (off-canvas menu & modal) system for jQuery and Bootstrap 5.  
Supports stacking multiple layers, custom AJAX content, animation, and full keyboard support.

---

## Features

- Stackable sliding layers (like modals, but multi-level)
- Smooth open/close animations
- AJAX content loading support
- Close all layers with a single call, stacked "top-down"
- Callback support for all key events
- Full Bootstrap 5 compatibility
- Easily extensible with custom logic

---

## Installation

Install with Composer (Bootstrap 5 & jQuery must be present):

```
composer require twbs/bootstrap components/jquery
```

**Or include JS/CSS manually:**

```html
<link rel="stylesheet" href="vendor/twbs/bootstrap/dist/css/bootstrap.min.css">
<script src="vendor/components/jquery/jquery.min.js"></script>
<script src="vendor/twbs/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
<script src="dist/bs-layer.js"></script>
```

---

## Getting Started

**HTML Example:**

```html
<a data-bs-toggle="layer" data-url="login.html" href="#slide_menu" class="btn btn-primary">
    Open a layer via link
</a>
```

**JavaScript Usage:**

```javascript
// Initialize a layer trigger
$('[data-bs-toggle="layer"]').bsLayer({
    // url: 'login.html',
    onLoad: function($content) {
        // Callback after content loaded
    }
});
```

---

## API

### Open a Layer

```javascript
$('[data-bs-toggle="layer"]').bsLayer({ url: 'login.html' });
```

### Closing Layers

#### Close Top Layer

```javascript
$.bsLayer.close();
```

#### Close All Layers (Animated, from topmost downwards)

```javascript
$.bsLayer.closeAll();
```

- **All layers will close one after another, with their animation, until none are left.**

---

## Configuration

All config and defaults via `$.bsLayer.config` and `$.bsLayer.defaults`:

<details>
<summary>Click for config reference</summary>

```js
$.bsLayer = {
    config: {
        distanceBetweenLayers: 100,     // px distance offset (visually stacks)
        animationDuration: 400,         // ms, animation duration
        zIndexStart: 1050,              // base z-index
        parent: 'body'                  // where layers will be appended
    },
    defaults: {
        width: undefined,               // custom width
        backdrop: 'static',             // show backdrop
        url: null,                      // load AJAX url
        closeable: true,                // show close control
        queryParams(params) { return params; },  // param processing on AJAX
        onAll: function(eventName, ...args) {},  // global event callback
        onLoad: function($content) {},
        onShow: function($layer) {},
        onShown: function($layer) {},
        onHide: function() {},
        onHidden: function() {}
    },
    ...
};
```
</details>

---

## License

Proprietary  
See [composer.json](composer.json) for author information.# bs-layerSlideMenu
