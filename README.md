# bs-layer

A lightweight sliding layer system for jQuery and Bootstrap 5.  
Supports stacking multiple layers, custom AJAX content, animation, and full keyboard support.

![](demo/img.png)
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

Install with Composer (Bootstrap 5, Bootstrap-Icons & jQuery must be present):

```
composer require twbs/bootstrap twbs/bootstrap-icons components/jquery
```

**Or include JS/CSS manually:**

```html

<link href="vendor/twbs/bootstrap-icons/font/bootstrap-icons.min.css" rel="stylesheet">
<link rel="stylesheet" href="vendor/twbs/bootstrap/dist/css/bootstrap.min.css">


<script src="vendor/components/jquery/jquery.min.js"></script>
<script src="vendor/twbs/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
<script src="dist/bs-layer.js"></script>
```

---

## Getting Started

**HTML Example:**

```html
<a id="layerLogin" data-url="login.html" href="#" class="btn btn-primary">
    Open layer
</a>
```

**JavaScript Usage:**

```javascript
// Initialize a layer trigger
const layerLogin = $('#layerLogin').bsLayer({
    name: 'login-layer',
    // url: 'login.html',
    onPostBody: function ($content) {
        // Callback after content loaded
    }
});

// You can send your own events to the layer
$.bsLayer.customEvent('login-layer', 'event-name', ...params);

// oder schließe alle Schichten mit einmal
$.bsLayer.closeAll();

```

---

## API

### Global Configuration

Global configuration options control the technical behavior and default appearance of **all** layers.  
They are set on the `$.bsLayer.config` object and can be changed at runtime using `$.bsLayer.setConfig()`.

These settings affect AJAX requests, default breakpoints, animation speed, stacking order, and icon classes.  
Changes to the global config apply to all subsequently created layers unless overridden per-layer.

See the table below for all available global configuration options:

| Option                  | Type     | Default / Example                                  | Description                                                                        |
|-------------------------|----------|----------------------------------------------------|------------------------------------------------------------------------------------|
| ajax.method             | string   | 'GET'                                              | HTTP method used for AJAX requests (usually 'GET' or 'POST')                       |
| ajax.contentType        | string   | 'application/x-www-form-urlencoded; charset=UTF-8' | Content-Type for AJAX submissions                                                  |
| fullWidthBreakpoint     | number   | 576                                                | Below this window width (px), layers use 100% of width (Bootstrap 'sm' breakpoint) |
| firstLayerWithInPercent | number   | 0.80                                               | Percentage (e.g. 0.8 = 80%) of window width for first layer                        |
| distanceBetweenLayers   | number   | 100                                                | Distance in px between stacked layers                                              |
| animationDuration       | number   | 600                                                | Show/hide animation duration in milliseconds                                       |
| zIndexStart             | number   | 1050                                               | z-index for bottom-most layer; each additional layer is placed higher              |
| parent                  | string   | 'body'                                             | CSS selector: Where layers are appended in the DOM                                 |
| icons.close             | string   | 'bi bi-x-lg'                                       | Icon class for the close (X) button (Bootstrap Icons)                              |
| icons.refresh           | string   | 'bi bi-arrow-clockwise'                            | Icon class for refresh button                                                      |
| icons.maximize          | string   | 'bi bi-arrows-angle-expand'                        | Icon class for maximize button                                                     |
| icons.minimize          | string   | 'bi bi-arrows-angle-contract'                      | Icon class for minimize button                                                     |
| onError                 | function | `function($message) {}`                            | Global error handler; called on AJAX or layer errors                               |

**Usage Example:**

```javascript
// Example: Centrally adjust global configuration for all layers
$.bsLayer.setConfig({
    fullWidthBreakpoint: 768,    // Default is 576, here changed to 768 px
    animationDuration: 400,      // Layer animation now lasts 400 ms
    icons: {
        close: 'bi bi-x',        // Different icon for "Close"
        maximize: 'bi bi-fullscreen',
        minimize: 'bi bi-fullscreen-exit'
    }
});

// Optional: Overwrite the global onError callback function
$.bsLayer.config.onError = function ($msg) {
    // Custom error handling
    alert('Layer error: ' + $msg);
};
```

---

### Layer Settings

Layer settings define the configuration and behavior of **individual layers**.  
They can be passed when initializing a layer via `$(selector).bsLayer(options)` or set as `data-` attributes on the
layer trigger element.

These settings control properties such as title, width, styles, AJAX URL, refreshability, closing/maximizing, and all
event callbacks.  
Any setting not explicitly defined will fall back to the global defaults.

See the table below for all available settings you can use per layer:

| Option                | Type                         | Default / Example                          | Description                                                                                                                                                                       |
|-----------------------|------------------------------|--------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name                  | string                       | 'layer01'                                  | Unique layer name or identifier                                                                                                                                                   |
| title                 | string/HTML                  | undefined                                  | Optional: Layer title (can be string or HTML)                                                                                                                                     |
| width                 | number/string                | undefined                                  | Optional: Width in px or as CSS string                                                                                                                                            |
| bgStyle               | object                       | `{ classes: 'text-dark', css: {...} }`     | Style for background and text color (see below)                                                                                                                                   |
| &nbsp;&nbsp;↳ classes | string                       | 'text-dark'                                | Additional CSS classes for the layer                                                                                                                                              |
| &nbsp;&nbsp;↳ css     | object                       | `{ background: ..., boxShadow: ..., ... }` | Inline CSS styles for the layer background                                                                                                                                        |
| backdrop              | bool/string                  | true                                       | Show backdrop: `true`, `false`, or `'static'`                                                                                                                                     |
| url                   | string \| Function (Promise) | undefined                                  | URL für AJAX-Content **oder** Funktion/Promise, die asynchronen Content liefert. Die Funktion muss ein Promise zurückgeben, das aufgelöst wird, sobald der Content verfügbar ist. |
| refreshable           | bool                         | false                                      | Enable content refresh                                                                                                                                                            |
| closeable             | bool                         | true                                       | Show close (X) button in header                                                                                                                                                   |
| expandable            | bool                         | true                                       | Allow layer to be maximized                                                                                                                                                       |
| queryParams           | function                     | `(params) => params`                       | Modify AJAX query parameters                                                                                                                                                      |
| onAll                 | function                     | `function(eventName, ...args) {}`          | Callback for all triggered events                                                                                                                                                 |
| onPostBody            | function                     | `function($content) {}`                    | After content is loaded                                                                                                                                                           |
| onShow                | function                     | `function() {}`                            | Before layer is shown                                                                                                                                                             |
| onShown               | function                     | `function() {}`                            | After layer is fully visible                                                                                                                                                      |
| onHide                | function                     | `function() {}`                            | Before layer is hidden                                                                                                                                                            |
| onHidden              | function                     | `function() {}`                            | After layer is fully hidden                                                                                                                                                       |
| onRefresh             | function                     | `function($content) {}`                    | When the layer is refreshed                                                                                                                                                       |
| onCustomEvent         | function                     | `function(eventName, ...params) {}`        | For user-defined custom events                                                                                                                                                    |

**Usage Example:**

```javascript
$('#btnLayerExample').bsLayer({
    name: 'example-layer',
    title: 'My Example Layer',
    width: 600,
    backdrop: true,
    url: 'example-content.html',
    refreshable: true,
    closeable: true,
    expandable: false,
    queryParams: function (params) {
        params.userId = 123;
        return params;
    },
    onShown: function ($content) {
        console.log('Layer wurde angezeigt');
    },
    onAll: function (eventName, ...args) {
        console.log('Event:', eventName, args);
    }
});

// You can also supply a function to the `url` option that returns a Promise. This allows you to load dynamic content asynchronously, for example via an API call or any custom logic.
// The function can be defined either as an `async` function or as a regular function returning a Promise. The most important point is that the return value is a Promise that resolves with the HTML/string content.
$('#btnLayerExample').bsLayer({
    name: 'promise-layer',
    title: 'Async Content Layer',
    width: 600,
    backdrop: true,
    // `url` als Promise-Funktion: z.B. dynamisch, asynchron laden
    url: async function () {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                // Beliebige Logik: kann auch AJAX sein
                resolve('<div class="p-4"><h3>Async loaded content 🚀</h3><p>This content was loaded via Promise!</p></div>');
            }, 1000);
        });
    },
    refreshable: true,
    onShown: function ($content) {
        console.log('Async layer shown');
    }
});
```

---

### Plugin Methods

These instance methods can be called on any jQuery element that has been initialized as a layer trigger:

| Method     | Parameters     | Description                                                                           |
|------------|----------------|---------------------------------------------------------------------------------------|
| `setTitle` | `title`        | Dynamically sets the layer’s title (as string or HTML) for the current trigger.       |
| `show`     | `...args`      | Programmatically opens/displays the layer (simulates a click on the trigger element). |
| `refresh`  | `options = {}` | Reloads or refreshes the layer content, e.g. via AJAX, using supplied options if any. |
| `close`    | none           | Closes/hides the layer that belongs to the current trigger element.                   |

**Usage Example:**

```javascript
$('#myLayerBtn').bsLayer('setTitle', 'New Title');
$('#myLayerBtn').bsLayer('show');
$('#myLayerBtn').bsLayer('refresh');
$('#myLayerBtn').bsLayer('close');
```

## License

Proprietary  
See [composer.json](composer.json) for author information.# bs-layerSlideMenu
