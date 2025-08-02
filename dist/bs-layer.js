(function ($) {
    'use strict';

    const namespace = '.bs.layer';
    const backdropId = 'layerBackdrop';

    const pluginMethods = {
        setTitle: function (title) {
            const $layerButton = $(this);
            const $layer = $(getLayerByButton($layerButton));
            $layer.find('.layer-title').html(title);
            const settings = getSettings($layerButton);
            settings.title = title || '';
            setSettings($layerButton, settings);
        },
        show: function (options = {}) {
            const $layerButton = $(this);
            refreshSettings($layerButton, options);
            $layerButton.trigger('click' + namespace); // Event auslösen
        },
        refresh: function (options = {}) {
            const $layerButton = $(this);
            refresh($layerButton, options); // Existierende Funktion verwenden
        },
        close: function () {
            const $layerButton = $(this);
            const $layer = getLayerByButton($layerButton);
            close($layer); // Existierende Schließen-Funktion verwenden
        }
    };

    // noinspection JSUnusedGlobalSymbols
    $.bsLayer = {
        version: '1.0.6',
        onDebug($message, ...params) {
            if ($.bsLayer.config.debug) {
                console.log('[debug][bsLayer]: ', $message, ...params);
            }
        },
        onError($message, ...params) {
            console.error('[error][bsLayer]: ', $message, ...params);
        },
        getDefaults() {
            return this.defaults;
        },
        getConfig() {
            return this.config;
        },
        setConfig(config = {}) {
            if (!this.utils.isValueEmpty(config)) {
                this.config = $.extend(true, {}, this.config, config);
            }
        },
        config: {
            debug: true,
            ajax: {
                method: 'GET',
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            fullWidthBreakpoint: 576, // bootstrap sm, under what width the layers should be displayed in full width.
            firstLayerWithInPercent: .80, // The first layer should take the percentage of the window
            distanceBetweenLayers: 100, // Each further layer should have how many pixels from the layer lying above
            animationDuration: 600, // The time in milliseconds, which is to be encouraged for a layer for the full Window width
            zIndexStart: 1050, // The lowest layer gets this zIndex, each further layer a value higher.
            parent: 'body', // Where should the layers be inserted?
            icons: {
                close: 'bi bi-x-lg', // The close button
                refresh: 'bi bi-arrow-clockwise', // the refresh button
                maximize: 'bi bi-arrows-angle-expand', // maximize the window
                minimize: 'bi bi-arrows-angle-contract', // minimize the window
            }
        },
        defaults: {
            ajax: {
                method: 'GET',
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            name: undefined,
            title: undefined,
            width: undefined,
            bgStyle: {
                classes: 'text-dark',
                css: {
                    background: 'rgba(255, 255, 255, 0.74)',
                    boxShadow: '0 16px 80px rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(9.1px)',
                    WebkitBackdropFilter: 'blur(9.1px)',
                }
            },
            backdrop: true,
            url: undefined,
            refreshable: false,
            closeable: true,
            expandable: true,
            queryParams(params) {
                return params;
            },
            onAll: function (_eventName, ..._args) {
            },
            onPostBody: function (_$content) {
            },
            onShow: function () {
            },
            onShown: function () {
            },
            onHide: function () {
            },
            onHidden: function () {
            },
            onRefresh: function (_$content) {
            },
            onCustomEvent: function (_eventName, ...params) {
                console.log('onCustomEvent', _eventName, params);
            },
        },
        setAnimated(animated) {
            this.vars.isAnimating = animated;
        },
        vars: {
            isAnimating: false,
            registerGlobalLayerEvents: false,
            immediate: false,
            openLayers: []
        },
        customEvent: function (name, eventName, ...params) {
            if (!name) {
                this.onError('Layer name is required for customEvent!');
                return;
            }
            const cleanName = this.utils.toCamelCase(name);
            const $layer = $(`.bs-layer[data-name="${cleanName}"]`);
            if (!$layer.length) {
                this.onError('Layer with name "' + name + '" not found!');
                return;
            }
            const $layerBtn = $(getButtonByLayer($layer));
            if (!$layerBtn.length) {
                this.onError('Layer button for layer with name "' + name + '" not found!');
                return;
            }
            triggerEvent($layerBtn, 'custom-event', eventName, ...params);

        },
        // close: close,
        closeAll: closeAll,
        getLayerByName: function (name) {
            const cleanName = this.utils.toCamelCase(name);
            const $layer = $(`.bs-layer[data-name="${cleanName}"]`);
            return $layer ?? null;
        },
        utils: {
            toCamelCase(string, firstLetterCapitalized = false) {
                const result = string
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join('');
                return firstLetterCapitalized
                    ? result.charAt(0).toUpperCase() + result.slice(1)
                    : result.charAt(0).toLowerCase() + result.slice(1);
            },
            getUniqueId(prefix = "bs_layer_") {
                const randomId = Math.random().toString(36).substring(2, 10);
                return prefix + randomId;
            },
            isValueEmpty(value) {
                if (value === null || typeof value === 'undefined') {
                    return true; // Null oder undefined
                }
                if (Array.isArray(value)) {
                    return value.length === 0; // Leeres Array
                }
                if (typeof value === 'string') {
                    return value.trim().length === 0; // Leerstring
                }
                if (typeof value === 'object') {
                    return Object.keys(value).length === 0; // Leeres Objekt
                }
                return false; // Alles andere gilt als nicht leer
            },
            executeFunction(functionOrName, ...args) {
                if (!functionOrName) {
                    return undefined;
                }

                let func;

                if (typeof functionOrName === 'function') {
                    func = functionOrName;
                } else if (typeof functionOrName === 'string') {
                    if (typeof window !== 'undefined' && typeof window[functionOrName] === 'function') {
                        func = window[functionOrName];
                    } else {
                        console.error(`Die Funktion "${functionOrName}" konnte nicht im globalen Kontext gefunden werden.`);
                        return undefined;
                    }
                }

                if (!func) {
                    console.error(`Ungültige Funktion oder Name: "${functionOrName}"`);
                    return undefined;
                }

                return func(...args);
            },
        }
    };



    $.fn.bsLayer = function (optionsOrMethod, ...args) {
        if ($(this).length === 0) {
            $.bsLayer.onError('No layer button found!');
            return;
        }

        const $layerButton = $(this);

        if (typeof optionsOrMethod === 'string') {
            $.bsLayer.onDebug(`Method "${optionsOrMethod}" called on bsLayer.`);
            if (pluginMethods[optionsOrMethod]) {
                $.bsLayer.onDebug(`Method "${optionsOrMethod}" found on bsLayer.`);
                return pluginMethods[optionsOrMethod].apply(this, args);
            } else {
                $.bsLayer.onDebug(`Method "${optionsOrMethod}" does not exist on bsLayer.`);
                $.bsLayer.onError(`Method "${optionsOrMethod}" does not exist on bsLayer.`);
            }
        } else {
            $.bsLayer.onDebug(`Method "init" called on bsLayer.`);
            // Use initialization method (existing code)
            if (!$layerButton.data('layerConfig')) {
                $.bsLayer.onDebug(`Layer button has no data-layer-config attribute.`);
                const options = typeof optionsOrMethod === 'object' ? optionsOrMethod : {};
                $layerButton.attr('aria-controls', $.bsLayer.utils.getUniqueId('layer_'));
                $layerButton.addClass('btn-layer');
                const settings = $.extend(
                    true,
                    {},
                    $.bsLayer.getDefaults(),
                    $layerButton.data(),
                    options
                );
                $.bsLayer.onDebug(`Layer settings:`, settings);

                const layerConfig = {
                    settings: settings,
                };

                $layerButton.data('layerConfig', layerConfig);
                btnEvents($layerButton);
                $.bsLayer.onDebug(`Layer button has been initialized.`);
            }

            if (!$.bsLayer.vars.registerGlobalLayerEvents) {
                globalEvents();
                $.bsLayer.vars.registerGlobalLayerEvents = true;
            }
        }

        return $layerButton;
    };

    function refreshSettings($layerBtn, options = {}) {

        delete options.name;

        // Default: hole aktuelle Settings
        // console.log('refresh', 'getSetting');
        const settings = getSettings($layerBtn);
        const newSettings = $.extend(true, {}, settings, options || {});

        setSettings($layerBtn, newSettings);
    }
    function refresh($layerBtn, options = {}) {
        const $layer = $(getLayerByButton($layerBtn));
        if (!$layer.length) {
            $.bsLayer.onError('Layer with name "' + name + '" not found!');
            return;
        }

        refreshSettings($layerBtn, options);

        fetchContent($layerBtn, $layer).then(function ({content, btn}) {
            $.bsLayer.onDebug('refresh', 'content', content);
            triggerEvent(btn, 'post-body', content);
            triggerEvent(btn, 'refresh');
        });
    }

    /**
     * Triggers a custom event on the specified button layer and handles associated settings and global event listeners.
     *
     * @param {jQuery} $btnLayer - The button layer target where the event will be triggered.
     * @param {string} eventName - The name of the event to be triggered.
     * @param {...any} args - Additional arguments to pass along with the event.
     * @return {void} This method does not return any value.
     */
    function triggerEvent($btnLayer, eventName, ...args) {
        const $btn = $($btnLayer);
        if (!$btn.data('layerConfig')) {
            $.bsLayer.onDebug('Layer button not found!');
            $.bsLayer.onError('Layer button in triggerEvent not found!');
            return;
        }
        // console.log('triggerEvent', 'getSetting', eventName);
        // Retrieve the current bsTable settings for this table
        const settings = getSettings($btn);

        // Compose event-specific table data for event consumers


        // Create a jQuery event object with namespace and attach table context
        const event = $.Event(eventName + namespace);

        // Trigger the event on the table with any extra arguments
        $.bsLayer.onDebug('triggerEvent', eventName + namespace, args);
        $btn.trigger(event, args);

        // Prevent the event from bubbling up the DOM
        event.stopPropagation();

        // Unless this is the generic 'all' event, fire 'all' for global event listeners too
        if (eventName !== 'all') {
            $.bsLayer.onDebug('triggerEvent', 'all' + namespace, args);
            const allEvent = $.Event(`all${namespace}`);
            $btn.trigger(allEvent, [eventName + namespace, ...args]);

            $.bsLayer.utils.executeFunction(settings.onAll, eventName + namespace, ...args);
            allEvent.stopPropagation();

            // Automatically map the event name to a settings handler and execute it
            // Converts event name to CamelCase + add "on" prefix (e.g., "show-info-window" -> "onShowInfoWindow")
            const eventFunctionName = `on` + $.bsLayer.utils.toCamelCase(eventName, true);
            $.bsLayer.utils.executeFunction(settings[eventFunctionName], ...args);
        }
    }

    /**
     * Retrieves the settings configuration associated with the given button layer.
     *
     * @param {Object} $btnLayer - The button layer element to retrieve settings from.
     * @return {Object} The settings configuration object associated with the button layer.
     */
    function getSettings($btnLayer) {
        return $($btnLayer).data('layerConfig').settings
    }

    /**
     * Updates the settings for a given button layer.
     * Assigns the provided settings to the layer configuration.
     *
     * @param {jQuery} $btnLayer - The button layer element to update.
     * @param {object} settings - The new settings to be applied to the button layer.
     * @return {void} This method does not return a value.
     */
    function setSettings($btnLayer, settings) {
        $($btnLayer).data('layerConfig').settings = settings;
    }

    /**
     * Attaches click event handlers to the provided button layer element.
     *
     * @param {jQuery} $btnLayer The jQuery object representing the button layer to which the events will be bound.
     * @return {void} This function does not return a value.
     */
    function btnEvents($btnLayer) {
        $.bsLayer.onDebug(`Adding events to layer button.`);
        $($btnLayer)
            .off('click' + namespace)
            .on('click' + namespace, function (e) {
                e.preventDefault();
                if ($.bsLayer.vars.isAnimating) {
                    $.bsLayer.onDebug('click event blocked, animation is in progress.');
                    return; // Noch in Animation, keine weitere Aktion ausführen
                }
                open($(e.currentTarget));
            });
    }


    /**
     * Closes the latest layer if conditions are met.
     * This includes ensuring no animation is currently active and handling static backdrops.
     *
     * @param {jQuery} $layer - The layer object to be closed.
     * @param {boolean} [clickedOnBackdrop=false] - Indicates if the layer was triggered for closure by clicking on its backdrop.
     * @return {void} This function does not return a value.
     */
    function closeLatestLayer($layer, clickedOnBackdrop = false) {
        if ($.bsLayer.vars.isAnimating) {
            console.warn('An animation runs, closing is blocked.');
            return; // Close to close when animation is running
        }
        if (clickedOnBackdrop && $($layer).data('bs-backdrop') === 'static') {
            console.warn('Backdrops with "Static" cannot be closed by clicking.');
            return;
        }
        close($layer);
    }

    /**
     * Determines and returns the appropriate width for the current layer based on various conditions such as window size,
     * open layers count, and previously configured layer settings.
     *
     * @param {jQuery} $btnLayer - A jQuery object representing the layer button for which the width is being calculated.
     * @return {number} The calculated width for the current layer in pixels.
     */
    function getCurrentWidth($btnLayer) {
        // console.log('getCurrentWidth', 'getSetting');
        const settings = getSettings($btnLayer);
        const config = $.bsLayer.getConfig();
        const openLayerIds = $.bsLayer.vars.openLayers; // Array of IDs (strings)
        const countOpenLayers = openLayerIds.length;
        const winWidth = $(window).width();

        // Bootstrap sm breakpoint: 576px
        if (winWidth < config.fullWidthBreakpoint) {
            return winWidth;
        }

        if (settings.width) {
            return settings.width;
        }

        // First menu: 80% of window width
        if (countOpenLayers === 1) {
            return Math.round(winWidth * config.firstLayerWithInPercent);
        }

        // Find the previous layer by its ID and use its width
        let prevWidth = Math.round(winWidth * 0.8);
        if (countOpenLayers > 1) {
            const prevLayerId = openLayerIds[countOpenLayers - 2];
            const $prevLayer = $(getLayerById(prevLayerId));
            if ($prevLayer.length && $prevLayer.width()) {
                prevWidth = $prevLayer.width();
            }
        }
        return Math.max(prevWidth - config.distanceBetweenLayers, 576);
    }

    /**
     * Retrieves the current z-index for the next layer to be opened.
     *
     * @return {number} The calculated z-index value, determined by the base z-index start value
     * and the count of currently opened layers.
     */
    function getCurrentZIndex() {
        const config = $.bsLayer.getConfig();
        const countOpenLayers = $.bsLayer.vars.openLayers.length;
        return config.zIndexStart + countOpenLayers;
    }

    /**
     * Generates and returns a string representing the HTML for a loading spinner element.
     *
     * @return {string} A string containing the HTML markup for the loading spinner.
     */
    function getLoading() {
        return [
            '<div class="d-flex justify-content-center fs-1 align-items-center h-100 w-100">',
            '<div class="spinner-border text-primary" style="width: 5rem; height: 5rem;" role="status">',
            '<span class="visually-hidden">Loading...</span>',
            '</div>',
            '</div>'
        ].join('');
    }

    /**
     * Generates an HTML template for a UI layer with configurable options such as title, closeable, expandable, and refreshable buttons.
     *
     * @param {Object} settings - Configuration object specifying the behavior and content of the layer.
     * @return {string} The HTML string representing the constructed layer template.
     */
    function getTemplate(settings) {
        const config = $.bsLayer.getConfig();
        const closeableBtn = !settings.closeable ? '' : [
            `<button type="button" class="btn btn-link bg-transparent" data-bs-dismiss="layer"><i class="${config.icons.close}"></i></button>`,
        ].join('');
        const maxMinBtn = !settings.expandable ? '' : [
            `<button type="button" class="btn btn-link bg-transparent btn-toggle-full-width"><i class="${config.icons.maximize}"></i></button>`,
        ].join('');
        const refreshBtn = !settings.refreshable ? '' : [
            `<button type="button" class="btn btn-link bg-transparent btn-refresh"><i class="${config.icons.refresh}"></i></button>`,
        ].join('');

        return [
            '<div class="d-flex flex-column align-items-stretch h-100 w-100">',
            '<div class="layer-header d-flex flex-nowrap justify-content-between align-items-center p-3">',
            `<h5 class="layer-title">${settings.title || ''}</h5>`,
            '<div class="btn-group">',
            refreshBtn,
            maxMinBtn,
            closeableBtn,
            '</div>',
            '</div>',
            '<div class="layer-body p-3 flex-fill overflow-y-auto"></div>',
            '</div>',
        ].join('');
    }


    /**
     * Fetches and loads content asynchronously into a specified layer element.
     *
     * @param {jQuery} $btnLayer The button layer element that triggers the fetch operation, used for reference.
     * @param {jQuery} $layer The target layer element where the content will be loaded.
     * @return {Promise<Object>} A promise that resolves with an object containing the loaded content as a jQuery element and the button layer reference,
     *                           or rejects with an error message if the operation fails.
     */
    function fetchContent($btnLayer, $layer) {
        // Log the start of the function
        $.bsLayer.onDebug('fetchContent called');

        // Return a new Promise that either resolves with the content or rejects on failure
        return new Promise((resolve, reject) => {
            // Retrieve the settings for the provided button layer ($btnLayer)
            const settings = getSettings($btnLayer);

            // Retrieve the global configuration for the plugin
            const config = $.bsLayer.getConfig();

            // Find the title of the layer and its body container
            const layerTitle = $($layer).find('.layer-title'); // Element representing the layer title
            const layerBody = $($layer).find('.layer-body');   // Element representing the layer body

            // Set the layer body to display a loading spinner
            layerBody.html(getLoading());

            // Set the layer's title (fallback to an empty string if not provided)
            layerTitle.html(settings.title || '');

            // Verify if the `url` setting exists, as it's required for fetching content
            if (!settings.url) {
                $.bsLayer.onDebug('Settings.url not defined!');   // Debug log for missing URL
                $.bsLayer.onError('Settings.url not defined!');
                reject('Settings.urlfetch not defined!');         // Reject the promise with an error message
                return;                                           // Exit the function
            }

            // Prepare an initial parameter object for the request
            const params = {};

            // If the `queryParams` property in settings is a function, execute it to get query parameters
            // Otherwise, use the empty `params` object
            const query = typeof settings.queryParams === 'function'
                ? settings.queryParams(params)
                : params;

            // Debug log for the query parameters used
            $.bsLayer.onDebug('queryParams', query);

            let promise; // Declare a variable to hold the promise that will fetch the layer content

            // If `settings.url` is a function, execute it to fetch the data
            if (typeof settings.url === 'function') {
                $.bsLayer.onDebug('Settings.url is a function!');
                try {
                    // Convert the result of the `url` function into a resolved promise
                    promise = Promise.resolve($.bsLayer.utils.executeFunction(settings.url, query));
                } catch (err) {
                    // Handle any errors that occur during function execution
                    $.bsLayer.onDebug('Error in fetchContent: ' + err);
                    $.bsLayer.onError('Error in fetchContent: ' + err);
                    reject(err); // Reject the promise with the error
                    return;      // Exit the function
                }
            } else {
                // If `settings.url` is a string, assume it's a direct URL and fetch it via AJAX
                $.bsLayer.onDebug('Settings.url is a string!');

                // Merge default AJAX settings with any custom settings from the configuration
                const ajaxSettings = $.extend(true, {}, config.ajax, settings.ajax);

                // Initiate an AJAX request with the HTTP method, query parameters, and content type
                promise = $.ajax({
                    url: settings.url,                         // The endpoint to request
                    type: ajaxSettings.method || 'GET',        // HTTP method (default to GET)
                    data: query,                               // Query parameters for the request
                    contentType: ajaxSettings.contentType || 'application/x-www-form-urlencoded; charset=UTF-8'
                });
            }

            // Check if the `promise` variable was successfully initialized
            if (promise && typeof promise.then === 'function') {
                $.bsLayer.onDebug('Promise returned from Settings.url!');

                // When the promise resolves, populate the layer with the content
                promise
                    .then(function (res) {
                        // Convert the response into a jQuery element
                        let $content = $(res);

                        // Validate and ensure the response can be wrapped in a DOM structure
                        if ($content.length === 0 || !$content[0].nodeType) {
                            $content = $('<div>').html(res); // Wrap plain HTML into a `div`
                        }

                        // Clear existing layer body content and append the new content
                        $(layerBody).empty().append($content);

                        // Debug log for the successfully loaded content
                        $.bsLayer.onDebug('Content loaded:', $content);

                        // Resolve the promise with the loaded content and the original button layer
                        resolve({ content: $content, btn: $btnLayer });
                    })
                    .catch(function (error) {
                        // Handle errors that occur during the content fetching process
                        $.bsLayer.onDebug('Error loading the layer:', error);
                        $.bsLayer.onError('Error loading the layer:', error);

                        // Reject the promise with the error message
                        reject(error);
                    });
            } else {
                // Handle cases where `settings.url` does not return a valid promise
                const errMsg = 'Settings.url must be a promise-returning function or a URL!';
                $.bsLayer.onDebug(errMsg);                       // Debug log the issue
                $.bsLayer.onError(errMsg);                       // Error log the issue
                reject(errMsg);                                  // Reject the promise with the error message
            }
        });
    }

    /**
     * Retrieves an HTML layer element by its unique identifier.
     *
     * @param {string} id - The unique identifier of the layer to retrieve.
     * @return {jQuery} A jQuery object representing the layer element with the specified ID.
     */
    function getLayerById(id) {
        return $(`.bs-layer[id="${id}"]`);
    }

    /**
     * Retrieves a layer element associated with the specified button element.
     *
     * @param {jQuery} $btnLayer - The jQuery object representing the button whose associated layer is being retrieved.
     * @return {jQuery} The jQuery object representing the associated layer element.
     */
    function getLayerByButton($btnLayer) {
        return $(`.bs-layer[id="${$($btnLayer).attr('aria-controls')}"]`);
    }

    /**
     * Retrieves a button element associated with a specific layer.
     *
     * @param {jQuery} $layer - The jQuery object representing the layer element.
     * @return {jQuery} The jQuery object representing the button element associated with the given layer.
     */
    function getButtonByLayer($layer) {
        return $('.btn-layer[aria-controls="' + $($layer).attr('id') + '"]');
    }

    /**
     * Retrieves the layer ID associated with a button element by extracting the value of its 'aria-controls' attribute.
     *
     * @param {jQuery} $btnLayer - The button element, jQuery object, or selector representing the button.
     * @return {string|undefined} The value of the 'aria-controls' attribute, representing the layer ID. Returns undefined if the attribute does not exist.
     */
    function getLayerIdByButton($btnLayer) {
        return $($btnLayer).attr('aria-controls');
    }

    /**
     * Opens a new layer or modal associated with the specified button element. Handles animations, AJAX content loading,
     * and layer configurations, such as backdrops, z-index, and content insertion.
     *
     * @param {jQuery} $btnLayer The button or trigger element that will control this layer opening.
     * @return {void} Does not return a value. The method modifies the DOM and application state directly.
     */
    function open($btnLayer) {
        try {

            $.bsLayer.onDebug('open', $btnLayer);
            if ($.bsLayer.vars.isAnimating) {
                $.bsLayer.onDebug('open event blocked, animation is in progress.');
                return;
            }
            $.bsLayer.setAnimated(true);
            const layerId = getLayerIdByButton($btnLayer);
            if (!$.bsLayer.vars.openLayers.includes(layerId)) {
                $.bsLayer.onDebug('Layer not yet open, adding to stack.');
                $.bsLayer.vars.openLayers.push(layerId); // Füge Layer-Id hinzu
            }

            const settings = getSettings($btnLayer);
            const config = $.bsLayer.getConfig();
            const baseName = !settings.name
                ? 'layer' + ($.bsLayer.vars.openLayers.length)
                : $.bsLayer.utils.toCamelCase(settings.name);

            // Check if a layer with the same name is already open (IDs, not objects)
            const nameExists = $.bsLayer.vars.openLayers.some(layerId => {
                const $layer = $(getLayerById(layerId));
                return $layer.attr('data-name') === baseName;
            });
            if (nameExists) {
                $.bsLayer.onError('A layer with the name "' + baseName + '" is already open!');
                $.bsLayer.setAnimated(false);
                $.bsLayer.onDebug('A layer with the name "' + baseName + '" is already open!');
                return;
            }

            triggerEvent($btnLayer, 'show');

            // $.bsLayer.vars.openLayers.push(layerId);

            const width = getCurrentWidth($btnLayer);
            const zIndex = getCurrentZIndex();
            const windowWidth = window.innerWidth;
            const animationDuration = Math.round($.bsLayer.config.animationDuration * (width / windowWidth));
            const layerBackdrop = typeof settings.backdrop === 'boolean' ? (settings.backdrop ? 'true' : 'false') : 'static';
            const backgroundClasses = settings.bgStyle.classes || '';

            const layerCssDefault = {
                width: width + 'px',
                right: '-' + width + 'px',
                zIndex: zIndex,
                transition: 'right ' + animationDuration + 'ms ease-in-out',
                display: 'block',
            };

            const css = $.extend({}, layerCssDefault, settings.bgStyle.css);

            const $layer = $('<div>', {
                'data-bs-backdrop': layerBackdrop,
                class: 'position-fixed  top-0 h-100 rounded-start-5 bs-layer sliding ' + backgroundClasses,
                'data-name': baseName,
                id: layerId,
                html: getTemplate(settings),
                css: css
            }).appendTo(config.parent);

            $.bsLayer.onDebug('Layer created:', $layer);

            // Force browser reflow: accessing offsetWidth triggers layout calculation.
            // Ensures previous style changes are applied before starting a transition or animation.
            void $layer[0].offsetWidth;
            $layer.css('right', '0');

            // Hide overflow for all previous layers
            for (let i = 0; i < $.bsLayer.vars.openLayers.length - 1; i++) {
                const $layer2 = $(getLayerById($.bsLayer.vars.openLayers[i]));
                $layer2.addClass('overflow-hidden pe-0');
            }

            $layer.removeClass('overflow-hidden pe-0');

            // BACKDROP logic
            let $backdrop = $('#' + backdropId);
            if ($backdrop.length === 0) {
                $backdrop = $(`<div id="${backdropId}" class="modal-backdrop fade show"></div>`)
                    .appendTo('body');
            } else {
                $backdrop.appendTo('body');
            }
            const backdropZ = zIndex - 1;
            $backdrop.css({zIndex: backdropZ});

            // Backdrop always blocks interactions.
            // If settings.backdrop is false, make it transparent and invisible but still block mouse events.
            if (layerBackdrop === 'false') {
                $backdrop.css({
                    'background-color': 'transparent',
                    'opacity': 0,
                    'pointer-events': 'auto' // Must not be 'none' to block interaction!
                });
            } else {
                $backdrop.css({
                    'background-color': '', // Reset to default
                    'opacity': '',
                    'pointer-events': 'auto'
                });
            }

            // Only set body overflow for the first opened layer
            if ($.bsLayer.vars.openLayers.length === 1) {
                $('body').addClass('overflow-hidden pe-0');
            }

            fetchContent($btnLayer, $layer).then(function ({content, btn}) {
                triggerEvent(btn, 'post-body', content);
            });

            // Fire event after fully shown
            setTimeout(() => {
                $.bsLayer.setAnimated(false);
                triggerEvent($btnLayer, 'shown');
                $layer.css('transition', 'none');
                $layer.removeClass('sliding');
                $layer.addClass('show');
                updateLayersWidth();
            }, animationDuration);

        } catch (err) {
            $.bsLayer.onDebug('Error in open: ' + err);
            $.bsLayer.onError('Error in open: ' + err);
        }
    }

    /**
     * Closes the given layer element with an animated slide-out effect and removes it from the DOM.
     *
     * @param {jQuery} $layer - The jQuery object representing the layer to close. Must be a valid and not empty jQuery object.
     * @return {void} Does not return a value.
     */
    function close($layer) {
        $.bsLayer.onDebug('close');
        try {
            if ($.bsLayer.vars.isAnimating) {
                $.bsLayer.onDebug('close event blocked, animation is in progress.');
                return;
            }

            if (!$($layer).length) {
                $.bsLayer.onDebug('No layer found to close!');
                $.bsLayer.onError('No layer found to close!');
                return;
            }

            $.bsLayer.setAnimated(true);
            const layerId = $($layer).attr('id');
            const windowWidth = window.innerWidth;
            const width = $($layer).outerWidth() || 0;
            // Dynamische Animationsdauer berechnen:
            const animationDuration = Math.round($.bsLayer.getConfig().animationDuration * (width / windowWidth));

            // Backdrop und Overflow-Verwaltung bereits vor der Animation anpassen
            handleBackdropAndOverflow($layer);

            // Slide-out-Animation starten
            $($layer).css('transition', `right ${animationDuration}ms ease-in-out`).css('right', `-${width}px`);
            $($layer).addClass('sliding').removeClass('show');
            const btn = getButtonByLayer($layer);
            triggerEvent(btn, 'hide');
            // After the animation: remove layer
            setTimeout(() => {
                $($layer).hide(() => {
                    $($layer).remove(); // Remove layer from a cathedral

                    // Remove the layer from the open stacks
                    $.bsLayer.vars.openLayers = $.bsLayer.vars.openLayers.filter(id => id !== layerId);
                    triggerEvent(btn, 'hidden');
                    $.bsLayer.setAnimated(false); // Animation completed
                });
            }, animationDuration);
        } catch (err) {
            $.bsLayer.onDebug('Error in close: ' + err);
            $.bsLayer.onError('Error in close: ' + err);
        }
    }

    /**
     * Handles the backdrop and overflow state for modal-like layers in the UI.
     * It adjusts the backdrop's z-index, visibility, and resets overflow-hidden classes
     * based on the current state of open layers.
     *
     * @param {jQuery} $layer The jQuery object representing the layer being closed or updated.
     * @return {void} Does not return anything.
     */
    function handleBackdropAndOverflow($layer) {
        $.bsLayer.onDebug('handleBackdropAndOverflow');
        // removes `overflow-hidden` for the current layer
        $($layer).removeClass('overflow-hidden pe-0');

        const remainingLayers = $.bsLayer.vars.openLayers.length - 1; // Current layer not yet removed

        if (remainingLayers === 0) {
            // closed the last level, remove the backdrop and reset overflow
            $('#' + backdropId).remove();
            $('body').removeClass('overflow-hidden pe-0');
            $.bsLayer.onDebug('Last layer closed, backdrop removed.');
        } else {
            $.bsLayer.onDebug('Remaining layers:', remainingLayers);
            // adjust the backdrop if levels are still open
            const newTopLayerId = $.bsLayer.vars.openLayers[remainingLayers - 1];
            const $newTopLayer = $(getLayerById(newTopLayerId));
            // Setze Z-Index des Backdrops für die neue oberste Ebene
            const zIndex = parseInt($newTopLayer.css('z-index'), 10) - 1;
            const $backdropElement = $('#' + backdropId);
            $backdropElement.css({zIndex});

            // Optional: Backdrop transparent setzen, wenn es für die neue Ebene deaktiviert ist
            const backdropSetting = $newTopLayer.data('bs-backdrop');
            if (backdropSetting === false) {
                $backdropElement.css({
                    'background-color': 'transparent',
                    'opacity': 0,
                    'pointer-events': 'none',
                });
            } else {
                $backdropElement.css({
                    'background-color': '',
                    'opacity': '',
                    'pointer-events': '',
                });
            }
        }
    }

    /**
     * Closes all open layers sequentially. The method ensures that animations for closing
     * layers do not overlap. If another closing animation is already running or no layers are open,
     * it exits without performing any actions.
     *
     * @return {void} This method does not return any value.
     */
    function closeAll() {
        const vars = $.bsLayer.vars;
        if (vars.isAnimating || !vars.openLayers.length) {
            return;
        }

        /**
         * Closes the next open layer in a sequence. If there are multiple open layers,
         * this function ensures they are closed one by one, waiting for any ongoing animations
         * to complete before proceeding to the next layer.
         *
         * @return {void} Does not return a value.
         */
        function closeNext() {
            if (!vars.openLayers.length) {
                return;
            }
            const latestLayerId = vars.openLayers[$.bsLayer.vars.openLayers.length - 1];
            const $layer = getLayerById(latestLayerId);
            close($layer);
            if (vars.openLayers.length > 0) {
                setTimeout(function waitAndClose() {
                    if (!vars.isAnimating) {
                        closeNext();
                    } else {
                       // still animated, wait again briefly
                        setTimeout(waitAndClose, 30);
                    }
                }, 30);
            }
        }

        closeNext();
    }

    /**
     * Toggles the expanded state of the most recently opened layer.
     * If there are no open layers or the latest layer cannot be found, an error is logged.
     * The expanded state is indicated by the presence or absence of the `data-expanded` attribute.
     * Calls `updateLayersWidth` after toggling the state.
     *
     * @return {void} This function does not return a value.
     */
    function toggleExpand() {
        if (!$.bsLayer.vars.openLayers.length) {
            $.bsLayer.onError('no layer found in toggleExpand');
            return;
        }
        const latestLayerId = $.bsLayer.vars.openLayers[$.bsLayer.vars.openLayers.length - 1];
        const $layer = $(getLayerById(latestLayerId));
        if (!$layer.length) {
            $.bsLayer.onError('no layer found in toggleExpand');
            return;
        }
        const isExpanded = $layer.is('[data-expanded]');
        if (isExpanded) {
            $layer.removeAttr('data-expanded');
        } else {
            $layer.attr('data-expanded', 'true');
        }
        updateLayersWidth();
    }

    /**
     * Determines whether the content should be shown in full width based on the current window width
     * and a predefined full-width breakpoint.
     *
     * @return {boolean} Returns true if the window width is less than the full-width breakpoint, otherwise false.
     */
    function showInFullWidth() {
        const maxWidth = $.bsLayer.getConfig().fullWidthBreakpoint;
        const winWidth = $(window).width();
        return winWidth < maxWidth;
    }

    function updateLayersWidth() {
        $.bsLayer.onDebug('updateLayersWidth');
        if (!$.bsLayer.vars.openLayers.length) {
            $.bsLayer.onDebug('No layers open, skipping update.');
            return;
        }
        const config = $.bsLayer.getConfig();
        const fullWidth = showInFullWidth();
        const winWidth = $(window).width();
        let startWidth = Math.round(winWidth * config.firstLayerWithInPercent);
        let index = 0;

        $.bsLayer.vars.openLayers.forEach(layerId => {
            const $layer = $(getLayerById(layerId));
            const $layerBtn = $(getButtonByLayer($layer));
            const settings = getSettings($layerBtn);
            const $layerMaxMinBtn = $layer.find('.btn-toggle-full-width');
            const $layerMaxMinBtnIcon = $layerMaxMinBtn.find('i');
            $layerMaxMinBtnIcon
                .removeClass(config.icons.maximize)
                .removeClass(config.icons.minimize);

            if ($layer.is('[data-expanded]')) {
                $.bsLayer.onDebug('Layer is expanded, setting width to full.');
                // Immer Fullscreen!
                $layer.addClass('w-100').removeClass('rounded-start-5');
                $layer.width(winWidth);
                $layerMaxMinBtnIcon.addClass(config.icons.minimize);
            } else if (!fullWidth) {
                $.bsLayer.onDebug('Window width is less than full width breakpoint, setting width to full.');
                $layer.removeClass('w-100');
                $layer.addClass('rounded-start-5');
                $layer.width(settings.width || startWidth);
                $layerMaxMinBtnIcon.addClass(config.icons.maximize);
            } else {
                $.bsLayer.onDebug('Window width is greater than full width breakpoint, setting width to auto.');
                $layer.addClass('w-100').removeClass('rounded-start-5');
                $layer.width(winWidth);
                $layerMaxMinBtnIcon.addClass(config.icons.minimize);
            }

            if (fullWidth) {
                $layerMaxMinBtn.hide();
            } else {
                $layerMaxMinBtn.show();
            }

            startWidth -= config.distanceBetweenLayers;
            index++;
        });
    }

    /**
     * Initializes event listeners for global interactions with layers and handles resizing, button clicks,
     * dismiss actions, backdrop clicks, and keyboard events (e.g., `Escape` key functionality).
     *
     * @return {void} This function does not return a value. It sets up global event handlers for user interactions with layers.
     */
    function globalEvents() {
        function debounce(func, wait) {
            let timeout;
            return function () {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, arguments), wait);
            };
        }

        const debouncedUpdateLayersWidth = debounce(updateLayersWidth, 120);

        $(window).on('resize', debouncedUpdateLayersWidth);

        $(document)
            .on('click' + namespace, '.bs-layer .btn-toggle-full-width', function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleExpand();
            })
            .on('click' + namespace, '.bs-layer .btn-refresh', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const closetLayer = $(e.currentTarget).closest('.bs-layer');
                const layerBtn = getButtonByLayer(closetLayer);
                refresh(layerBtn);
            })
            .on('click' + namespace, '.bs-layer [data-bs-dismiss="layer"]', function (e) {
                e.preventDefault();
                const closetLayer = $(e.currentTarget).closest('.bs-layer');
                // alert(closetLayer.attr('id'));
                closeLatestLayer(closetLayer);
            })
            .on('click' + namespace, '#' + backdropId, function (e) {
                e.preventDefault();
                const latestLayerId = $.bsLayer.vars.openLayers[$.bsLayer.vars.openLayers.length - 1];
                const latestLayer = getLayerById(latestLayerId);
                closeLatestLayer(latestLayer, true);
            });

        // ESC schließt nur das oberste Menü (optional: ESC auch ignorieren bei static)
        $(document).on('keydown' + namespace, function (e) {
            if (e.key === "Escape") {
                if ($.bsLayer.vars.openLayers.length) {
                    if ($.bsLayer.vars.isAnimating) {
                        return;
                    }
                    const latestLayerId = $.bsLayer.vars.openLayers[$.bsLayer.vars.openLayers.length - 1];
                    const latestLayer = $(getLayerById(latestLayerId));
                    if (!latestLayer.length) {
                        return;
                    }
                    // ESC sperren, wenn backdrop 'static'
                    if (['static'].includes(latestLayer.attr('data-bs-backdrop'))) {
                        return;
                    }
                    close(latestLayer);
                }
            }
        });
    }
})
(jQuery);
