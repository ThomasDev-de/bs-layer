(function ($) {
    'use strict';


    const pluginMethods = {
        setTitle: function (title) {
            const $layerButton = $(this);
            const $layer = getLayerByButton($layerButton);
            $layer.find('.layer-title').html(title);
            const settings = getSettings($layerButton);
            settings.title = title || '';
            setSettings($layerButton, settings);
        },
        show: function (...args) {
            const $layerButton = $(this);
            $layerButton.trigger('click.bs.layer'); // Event auslösen
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
        version: '1.0.0',
        getDefaults() {
            return this.defaults;
        },
        getConfig() {
            return this.config;
        },
        setConfig(config = {}) {
            if (!this.utils.isValueEmpty(config)) {
                const newConfig = $.extend(true, {}, this.config, config);
                this.config = newConfig;
            }
        },
        config: {
            ajax: {
                method: 'GET',
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            distanceBetweenLayers: 100,
            animationDuration: 400,
            zIndexStart: 1050,
            parent: 'body',
            icons: {
                close: 'bi bi-x-lg',
                refresh: 'bi bi-arrow-clockwise',
                maximize: 'bi bi-arrows-angle-expand',
                minimize: 'bi bi-arrows-angle-contract',
            },
            onError(_$message) {
            }
        },
        defaults: {
            name: 'layer01',
            title: null,
            width: undefined,
            backdrop: true,
            url: null,
            refreshable: false,
            closeable: true,
            expandable: true,
            queryParams(params) {
                return params;
            },
            onAll: function (eventName, ...args) {

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
            },
        },
        setAnmiated(animated) {
            // console.log('setAnmiated', animated);
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
                // $.bsLayer.onError('Layer name is required for customEvent!');
                return;
            }
            const cleanName = this.utils.toCamelCase(name);
            const $layer = $(`.bs-layer[data-name="${cleanName}"]`);
            if (!$layer.length) {
                // $.bsLayer.onError('Layer with name "' + name + '" not found!');
                return;
            }
            const $layerBtn = getButtonByLayer($layer);
            if (!$layerBtn.length) {
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
            toCamelCase(string) {
                const result = string
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join('');
                return result.charAt(0).toLowerCase() + result.slice(1);
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

    const namespace = '.bs.layer';
    const backdropId = 'layerBackdrop';


    $.fn.bsLayer = function (optionsOrMethod, ...args) {
        if ($(this).length === 0) {
            $.bsLayer.onError('No layer button found!');
            return;
        }

        const $layerButton = $(this);

        if (typeof optionsOrMethod === 'string') {
            if (pluginMethods[optionsOrMethod]) {
                return pluginMethods[optionsOrMethod].apply(this, args);
            } else {
                $.bsLayer.onError(`Method "${optionsOrMethod}" does not exist on bsLayer.`);
            }
        } else {
            // Initialisierungsmethode verwenden (vorhandener Code)
            if (!$layerButton.data('layerConfig')) {
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

                const layerConfig = {
                    settings: settings,
                };

                $layerButton.data('layerConfig', layerConfig);

                // Event-Listener hinzufügen
                btnEvents($layerButton);
            }

            if (!$.bsLayer.vars.registerGlobalLayerEvents) {
                globalEvents();
                $.bsLayer.vars.registerGlobalLayerEvents = true;
            }
        }

        return $layerButton;
    };

    function refresh($layerBtn, options = {}) {
        const $layer = getLayerByButton($layerBtn);
        if (!$layer.length) {
            // $.bsLayer.onError('Layer with name "' + name + '" not found!');
            return;
        }

        delete options.name;

        // Default: hole aktuelle Settings
        // console.log('refresh', 'getSetting');
        const settings = getSettings($layerBtn);

        // Optionale neue Einstellungen mergen (nur falls übergeben und Typ passt)
        const {url, ajax, queryParams, title} = options;
        if (typeof url === "string" || typeof url === "function") {
            settings.url = url;
        }
        if (ajax && typeof ajax === "object") {
            settings.ajax = ajax;
        }
        if (typeof queryParams === "function") {
            settings.queryParams = queryParams;
        }
        if (typeof title === "string") {
            settings.title = title;
        }


        setSettings($layerBtn, settings);
        fetchContent($layerBtn, $layer, true).then(function ({content, btn}) {
            triggerEvent(btn, 'post-body', content);
            triggerEvent(btn, 'refresh');
        });
    }

    function triggerEvent($btnLayer, eventName, ...args) {
        const $btn = $($btnLayer);
        if (!$btn.data('layerConfig')) {
            return
        }
        // console.log('triggerEvent', 'getSetting', eventName);
        // Retrieve the current bsTable settings for this table
        const settings = getSettings($btn);

        // Compose event-specific table data for event consumers


        // Create a jQuery event object with namespace and attach table context
        const event = $.Event(eventName + namespace);

        // Trigger the event on the table with any extra arguments
        $btn.trigger(event, args);

        // Prevent the event from bubbling up the DOM
        event.stopPropagation();

        // Unless this is the generic 'all' event, fire 'all' for global event listeners too
        if (eventName !== 'all') {
            const allEvent = $.Event(`all${namespace}`);
            $btn.trigger(allEvent, [eventName + namespace, ...args]);
            $.bsLayer.utils.executeFunction(settings.onAll, eventName + namespace, ...args);
            allEvent.stopPropagation();

            // Automatically map the event name to a settings handler and execute it
            // Converts event name to CamelCase + add "on" prefix (e.g., "show-info-window" -> "onShowInfoWindow")
            const eventFunctionName = `on${eventName
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('')}`;

            $.bsLayer.utils.executeFunction(settings[eventFunctionName], ...args);
        }
    }

    function getSettings($btnLayer) {
        return $($btnLayer).data('layerConfig').settings
    }

    function setSettings($btnLayer, settings) {
        $($btnLayer).data('layerConfig').settings = settings;
    }

    function btnEvents($btnLayer) {
        $($btnLayer)
            .off('click' + namespace)
            .on('click' + namespace, function (e) {
                e.preventDefault();
                if ($.bsLayer.vars.isAnimating) {
                    return; // Noch in Animation, keine weitere Aktion ausführen
                }
                open($(e.currentTarget));
            });
    }


    /**
     * Closes the most recently opened layer, if no animations are currently in progress.
     * This function optionally checks if the user clicked on the backdrop,
     * and whether the layer is configured to allow closure via such behavior.
     *
     * @param {boolean} [clickedOnBackdrop=false] - Indicates if the user clicked on the backdrop.
     *                                              If true, the function will check the layer's
     *                                              backdrop configuration to decide if it should close.
     * @return {void}
     */
    function closeLatestLayer($layer, clickedOnBackdrop = false) {
        if ($.bsLayer.vars.isAnimating) {
            console.warn('Es läuft eine Animation, Schließen wird blockiert.');
            return; // Blockiere Schließen, wenn Animation läuft
        }
        if (clickedOnBackdrop && $layer.data('bs-backdrop') === 'static') {
            console.warn('Backdrops mit "static" können nicht durch Klick geschlossen werden.');
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
        if (winWidth < 576) {
            return winWidth;
        }

        if (settings.width) {
            return settings.width;
        }

        // First menu: 80% of window width
        if (countOpenLayers === 1) {
            return Math.round(winWidth * 0.8);
        }

        // Find the previous layer by its ID and use its width
        let prevWidth = Math.round(winWidth * 0.8);
        if (countOpenLayers > 1) {
            const prevLayerId = openLayerIds[countOpenLayers - 2];
            const $prevLayer = getLayerById(prevLayerId);
            if ($prevLayer.length && $prevLayer.width()) {
                prevWidth = $prevLayer.width();
            }
        }
        return Math.max(prevWidth - config.distanceBetweenLayers, 576);
    }

    function getCurrentZIndex() {
        const config = $.bsLayer.getConfig();
        const countOpenLayers = $.bsLayer.vars.openLayers.length;
        return config.zIndexStart + countOpenLayers;
    }

    function getLoading() {
        return [
            '<div class="d-flex justify-content-center fs-1 align-items-center h-100 w-100">',
            '<div class="spinner-border text-primary" style="width: 5rem; height: 5rem;" role="status">',
            '<span class="visually-hidden">Loading...</span>',
            '</div>',
            '</div>'
        ].join('');
    }

    function getTemplate(settings) {
        const config = $.bsLayer.getConfig();
        const closeableBtn = !settings.closeable ? '' : [
            `<button type="button" class="btn" data-bs-dismiss="layer"><i class="${config.icons.close}"></i></button>`,
        ].join('');
        const maxMinBtn = !settings.expandable ? '' : [
            `<button type="button" class="btn btn-toggle-full-width"><i class="${config.icons.maximize}"></i></button>`,
        ].join('');
        const refreshbtn = !settings.refreshable ? '' : [
            `<button type="button" class="btn btn-refresh"><i class="${config.icons.refresh}"></i></button>`,
        ].join('');

        return [
            '<div class="d-flex flex-column align-items-stretch h-100 w-100">',
            '<div class="layer-header d-flex flex-nowrap justify-content-between align-items-center p-3">',
            `<h5 class="layer-title">${settings.title || ''}</h5>`,
            '<div class="btn-group">',
            refreshbtn,
            maxMinBtn,
            closeableBtn,
            '</div>',
            '</div>',
            '<div class="layer-body p-3 flex-fill overflow-y-auto"></div>',
            '</div>',
        ].join('');
    }


    function fetchContent($btnLayer, $layer, triggerRefresh = false) {
        return new Promise((resolve, reject) => {
            const settings = getSettings($btnLayer);
            const config = $.bsLayer.getConfig();
            const layerTitle = $layer.find('.layer-title');
            const layerBody = $layer.find('.layer-body');
            layerBody.html(getLoading());
            layerTitle.html(settings.title || '');

            if (!settings.url) {
                reject('Settings.url not defined!');
                return;
            }

            const params = {};

            const query = typeof settings.queryParams === 'function'
                ? settings.queryParams(params)
                : params;

            let promise;
            if (typeof settings.url === 'function') {
                try {
                    promise = Promise.resolve($.bsLayer.utils.executeFunction(settings.url, query));
                } catch (err) {
                    reject(err);
                    return;
                }
            } else {
                promise = $.ajax({
                    url: settings.url,
                    type: config.ajax.method || 'GET',
                    data: query,
                    contentType: config.ajax.contentType || 'application/x-www-form-urlencoded; charset=UTF-8'
                });
            }

            if (promise && typeof promise.then === 'function') {
                promise
                    .then(function (res) {
                        const $content = $(res);
                        $(layerBody).empty().append($content);
                        resolve({content: $content, btn: $btnLayer});
                    })
                    .catch(function (error) {
                        console.error('Error loading the layer:', error);
                        // $.bsLayer.onError('Error loading the layer:', error);
                        reject(error);
                    });
            } else {
                const errMsg = 'Settings.url muss eine Promise liefernde Funktion oder eine URL sein!';
                console.error(errMsg);
                // $.bsLayer.onError(errMsg);
                reject(errMsg);
            }
        });
    }

    function getLayerById(id) {
        return $(`.bs-layer[id="${id}"]`);
    }

    function getLayerByButton($btnLayer) {
        return $(`.bs-layer[id="${$btnLayer.attr('aria-controls')}"]`);
    }

    function getButtonByLayer($layer) {
        return $('.btn-layer[aria-controls="' + $layer.attr('id') + '"]');
    }

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
        if ($.bsLayer.vars.isAnimating) {
            return;
        }
        $.bsLayer.setAnmiated(true);
        // $.bsLayer.vars.isAnimating = true;      // Set flag to block animations
        const layerId = getLayerIdByButton($btnLayer);
        if (!$.bsLayer.vars.openLayers.includes(layerId)) {
            $.bsLayer.vars.openLayers.push(layerId); // Füge Layer-Id hinzu
        }

        const settings = getSettings($btnLayer);
        const config = $.bsLayer.getConfig();
        const animationDuration = config.animationDuration;
        const baseName = !settings.name
            ? 'layer' + ($.bsLayer.vars.openLayers.length)
            : $.bsLayer.utils.toCamelCase(settings.name);

        // Check if a layer with the same name is already open (IDs, not objects)
        const nameExists = $.bsLayer.vars.openLayers.some(layerId => {
            const $layer = getLayerById(layerId);
            return $layer.attr('data-name') === baseName;
        });
        if (nameExists) {
            if (typeof config.onError === 'function') {
                config.onError('A layer with the name "' + baseName + '" is already open!');
            }

            $.bsLayer.setAnmiated(false);
            // $.bsLayer.vars.isAnimating = false;
            return;
        }

        triggerEvent($btnLayer, 'show');

        // $.bsLayer.vars.openLayers.push(layerId);

        const width = getCurrentWidth($btnLayer);
        const zIndex = getCurrentZIndex();
        const layerBackdrop = typeof settings.backdrop === 'boolean' ? (settings.backdrop ? 'true' : 'false') : 'static';
        const $layer = $('<div>', {
            'data-bs-backdrop': layerBackdrop,
            class: 'position-fixed text-dark top-0 h-100 rounded-start-5 bs-layer sliding',
            'data-name': baseName,
            'data-bs-theme': 'light',
            id: layerId,
            html: getTemplate(settings),
            css: {
                width: width + 'px',
                right: '-' + width + 'px',
                zIndex: zIndex,
                transition: 'right ' + animationDuration + 'ms ease-in-out',
                display: 'block',
                background: 'rgba(255, 255, 255, 0.74)',
                boxShadow: '0 16px 80px rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(9.1px)',
                WebkitBackdropFilter: 'blur(9.1px)',
            }
        }).appendTo(config.parent);


        // Force browser reflow: accessing offsetWidth triggers layout calculation.
        // Ensures previous style changes are applied before starting a transition or animation.
        void $layer[0].offsetWidth;
        $layer.css('right', '0');

        // Hide overflow for all previous layers
        for (let i = 0; i < $.bsLayer.vars.openLayers.length - 1; i++) {
            const $layer2 = getLayerById($.bsLayer.vars.openLayers[i]);
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
            $.bsLayer.setAnmiated(false);
            triggerEvent($btnLayer, 'shown');
            $layer.css('transition', 'none');
            $layer.removeClass('sliding');
            $layer.addClass('show');

        }, animationDuration);
    }

    function close($layer) {
        if ($.bsLayer.vars.isAnimating) {
            return;
        }

        if (!$layer.length) {
            $.bsLayer.onError('No layer found to close!');
            return;
        }

        $.bsLayer.setAnmiated(true);
        const layerId = $layer.attr('id');
        const animationDuration = $.bsLayer.getConfig().animationDuration;

        // Backdrop und Overflow-Verwaltung bereits vor der Animation anpassen
        handleBackdropAndOverflow($layer);

        // Slide-out-Animation starten
        const width = $layer.outerWidth() || 0;
        $layer.css('transition', `right ${animationDuration}ms ease-in-out`).css('right', `-${width}px`);
        $layer.addClass('sliding').removeClass('show');
        const btn = getButtonByLayer($layer);
        triggerEvent(btn, 'hide');
        // Nach der Animation: Layer entfernen
        setTimeout(() => {
            $layer.hide(() => {
                $layer.remove(); // Layer aus DOM entfernen

                // Entferne das Layer aus den offenen Stacks
                $.bsLayer.vars.openLayers = $.bsLayer.vars.openLayers.filter(id => id !== layerId);
                triggerEvent(btn, 'hidden');
                $.bsLayer.setAnmiated(false); // Animation abgeschlossen
            });
        }, animationDuration);
    }

    function handleBackdropAndOverflow($layer) {
        // Entfernt `overflow-hidden` für den aktuellen Layer
        $layer.removeClass('overflow-hidden pe-0');

        const remainingLayers = $.bsLayer.vars.openLayers.length - 1; // Aktueller Layer noch nicht entfernt

        if (remainingLayers === 0) {
            // Letzte Ebene geschlossen, Backdrop entfernen und Overflow zurücksetzen
            $('#' + backdropId).remove();
            $('body').removeClass('overflow-hidden pe-0');
        } else {
            // Backdrop anpassen, falls noch Ebenen geöffnet sind
            const newTopLayerId = $.bsLayer.vars.openLayers[remainingLayers - 1];
            const $newTopLayer = getLayerById(newTopLayerId);
            // Setze Z-Index des Backdrops für die neue oberste Ebene
            const zIndex = parseInt($newTopLayer.css('z-index'), 10) - 1;
            $('#' + backdropId).css({zIndex});

            // Optional: Backdrop transparent setzen, wenn es für die neue Ebene deaktiviert ist
            const backdropSetting = $newTopLayer.data('bs-backdrop');
            if (backdropSetting === false) {
                $('#' + backdropId).css({
                    'background-color': 'transparent',
                    'opacity': 0,
                    'pointer-events': 'none',
                });
            } else {
                $('#' + backdropId).css({
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
                        // Noch animiert, nochmal kurz warten
                        setTimeout(waitAndClose, 30);
                    }
                }, 30);
            }
        }

        closeNext();
    }

    function toggleExpand() {
        if (!$.bsLayer.vars.openLayers.length) {
            return;
        }
        const latestLayerId = $.bsLayer.vars.openLayers[$.bsLayer.vars.openLayers.length - 1];
        const $layer = getLayerById(latestLayerId);
        if (!$layer.length) {
            return;
        }
        const config = $.bsLayer.getConfig();
        const $layerMaxMinBtn = $layer.find('.btn-toggle-full-width i');
        $layer.toggleClass('w-100');
        $layerMaxMinBtn
            .removeClass(config.icons.maximize)
            .removeClass(config.icons.minimize);
        if ($layer.hasClass('w-100')) {
            $layer.removeClass('rounded-start-5');
            $layerMaxMinBtn.addClass(config.icons.minimize);
        } else {
            $layer.addClass('rounded-start-5');
            $layerMaxMinBtn.addClass(config.icons.maximize);
        }
    }

    function globalEvents() {
        // Schließen (immer nur das oberste)
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
                    const latestLayer = getLayerById(latestLayerId);
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
