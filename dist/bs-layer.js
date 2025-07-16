(function ($) {
    'use strict';

    // noinspection JSUnusedGlobalSymbols
    $.bsLayer = {
        version: '1.0.0',
        getDefaults: function () {
            return this.defaults;
        },
        getConfig: function () {
            return this.config;
        },
        config: {
            distanceBetweenLayers: 100,
            animationDuration: 400,
            zIndexStart: 1050,
            parent: 'body',
        },
        defaults: {
            width: undefined,
            backdrop: 'static',
            url: null,
            closeable: true,
            queryParams(params) {
                return params;
            },
            onAll: function (eventName, ...args) {

            },
            onLoad: function ($content) {
            },
            onShow: function ($layer) {
            },
            onShown: function ($layer) {
            },
            onHide: function () {
            },
            onHidden: function () {
            },
        },
        vars: {
            isAnimating: false,
            registerGlobalLayerEvents: false,
            immediate: false,
            openLayers: []
        },
        close: close,
        closeAll: closeAll,
        utils: {
            getUniqueId(prefix = "bs_layer_") {
                const randomId = Math.random().toString(36).substring(2, 10);
                return prefix + randomId;
            },
            isValueEmpty(value) {
                if (value === null || typeof value === 'undefined') {
                    return true; // Null or undefined
                }
                if (Array.isArray(value)) {
                    return value.length === 0; // Empty array
                }
                if (typeof value === 'string') {
                    return value.trim().length === 0; // Empty string (including only spaces)
                }
                return false; // All other values are considered non-empty (including numbers)
            },
            executeFunction(functionOrName, ...args) {
                if (!functionOrName) {
                    // console.warn('No functional name or functional reference!');
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


    $.fn.bsLayer = function (optionsOrMethod) {
        if ($(this).length === 0) return;

        if ($(this).length > 1) {
            return $(this).each(function () {
                return $(this).bsLayer(optionsOrMethod);
            });
        }

        const $layerButton = $(this);

        // Automatische Initialisierung
        if (!$layerButton.data('dataBsLayer')) {
            $layerButton.addClass('btn-layer');
            const options = typeof optionsOrMethod === 'object' ? optionsOrMethod : {};
            // Zusammenfügen von Standard- und benutzerdefinierten Einstellungen
            const settings = $.extend(
                true,
                {},
                $.bsLayer.getDefaults(),
                $layerButton.data(),
                options
            );

            const dataBsLayer = {
                settings: settings,
            };

            $layerButton.data('dataBsLayer', dataBsLayer);
            btnEvents($layerButton);
        }

        if (!$.bsLayer.vars.registerGlobalLayerEvents) {

            globalEvents();
            $.bsLayer.vars.registerGlobalLayerEvents = true;
        }

        if (typeof optionsOrMethod === 'string') {
            switch (optionsOrMethod) {
                case 'show': {
                    $layerButton.trigger('click' + namespace);
                }
                    break;
            }
        }

        return $layerButton;
    };

    function triggerEvent($btnLayer, eventName, ...args) {
        const $btn = $($btnLayer);
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
        return $btnLayer.data('dataBsLayer').settings
    }

    function btnEvents($btnLayer) {
        const settings = getSettings($btnLayer);
        $btnLayer.on('click' + namespace, function (e) {
            e.preventDefault();
            if ($.bsLayer.vars.isAnimating || $('.bs-layer.sliding').length) {
                return; // Noch in Animation, keine weitere Aktion ausführen
            }
            open($(e.currentTarget));
        });
    }

    function globalEvents() {


        // Schließen (immer nur das oberste)
        $(document).on('click' + namespace, '[data-bs-dismiss="layer"]', function (e) {
            e.preventDefault();
            close();
        });
        // Backdrop-Klick: nur wenn Option nicht 'static'
        $(document).on('click' + namespace, '#layerBackdrop', function (e) {
            e.preventDefault();

            // Prüfen, ob gerade eine Animation läuft
            if ($.bsLayer.vars.isAnimating || $('.bs-layer.sliding').length) {
                return; // Noch in Animation, keine weitere Aktion ausführen
            }

            const backdropOpt = $.bsLayer.defaults.backdrop;
            if (backdropOpt === 'static') {
                return; // Keine Aktion bei statischem Backdrop
            }

            close(); // Sicherstellen, dass die Animation nur einmal ausgeführt wird
        });

        // ESC schließt nur das oberste Menü (optional: ESC auch ignorieren bei static)
        $(document).on('keydown' + namespace, function (e) {
            if (e.key === "Escape") {
                // ESC sperren, wenn backdrop 'static'
                const backdropOpt = $.bsLayer.defaults.backdrop;
                if (backdropOpt === 'static') return;
                if ($('.bs-layer.sliding').length) {
                    return;
                }
                close();
            }
        });

    }

    function getCurrentWidth($btnLayer) {
        const settings = getSettings($btnLayer);
        const config = $.bsLayer.getConfig();
        const countOpenLayers = $.bsLayer.vars.openLayers.length;
        const winWidth = $(window).width();

        // Bootstrap sm breakpoint: 576px
        if (winWidth < 576) {
            // Volle Fensterbreite auf XS
            return winWidth;
        }

        // Erstes Menü: 80% der Fensterbreite (kannst du auch fest setzen, falls gewünscht)
        if (countOpenLayers === 1) {
            return Math.round(winWidth * 0.8);
        }

        if (settings.width) {
            return settings.width;
        }
        const prevWidth = $.bsLayer.vars.openLayers[$.bsLayer.vars.openLayers.length - 2].width ?
            $.bsLayer.vars.openLayers[$.bsLayer.vars.openLayers.length - 2].width() : Math.round(winWidth * 0.8);
        return Math.max(prevWidth - config.distanceBetweenLayers, 576);
    }

    function getCurrentZIndex($btnLayer) {
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

    function getTemplate($btnLayer) {
        const settings = getSettings($btnLayer);
        const closeableBtn = !settings.closeable ? '' : [
            '<button type="button" class="btn-close" data-bs-dismiss="layer" aria-label="Close" style="filter: invert(1) grayscale(1) brightness(0.2);"></button>',
        ].join('');
        return [
            // Oberstes Container-Div mit flexiblen Eigenschaften
            '<div class="d-flex flex-column align-items-stretch h-100 w-100">',
            // Layer-Header mit Titel und Schließen-Button
            '<div class="layer-header d-flex flex-nowrap justify-content-between align-items-center p-3">',
            '<h5 class="layer-title"></h5>',
            closeableBtn,
            '</div>',
            // Hauptinhalt des Layers
            '<div class="layer-body p-3 flex-fill overflow-y-auto"></div>',
            '</div>',
        ].join('');
    }

    /**
     * Ensures the element has a valid target and returns the plain target string (without the hash).
     * For <a>: ensures href="#id"
     * For <button>: ensures data-bs-target="#id"
     * @param {jQuery} $btnLayer - The jQuery element (link or button) to process.
     * @returns {string} The target id (without #)
     */
    function getOrCreateTarget($btnLayer) {
        let target;
        if ($btnLayer.is('a')) {
            let href = $btnLayer.attr('href');
            if ($.bsLayer.utils.isValueEmpty(href) || href === '#') {
                // Generate unique ID, set as href with '#'
                const newId = $.bsLayer.utils.getUniqueId();
                $btnLayer.attr('href', '#' + newId);
                target = newId;
            } else if (href.charAt(0) === '#') {
                target = href.substring(1);
            } else {
                target = href;
            }
        } else if ($btnLayer.is('button')) {
            let dataTarget = $btnLayer.attr('data-bs-target');
            if ($.bsLayer.utils.isValueEmpty(dataTarget) || dataTarget === '#') {
                // Generate unique ID, set as data-bs-target with '#'
                const newId = $.bsLayer.utils.getUniqueId();
                $btnLayer.attr('data-bs-target', '#' + newId);
                target = newId;
            } else if (dataTarget.charAt(0) === '#') {
                target = dataTarget.substring(1);
            } else {
                target = dataTarget;
            }
        }
        return target;
    }

    function open($btnLayer) {
        if ($.bsLayer.vars.isAnimating) {
            return;
        } // Abbrechen, wenn eine Animation bereits läuft
        $.bsLayer.vars.isAnimating = true;      // Flag setzen, um Animation zu blockieren
        const settings = getSettings($btnLayer);
        const config = $.bsLayer.getConfig();
        let target = getOrCreateTarget($btnLayer);
        const animationDuration = config.animationDuration;
        const $menu = $('<div>', {
            id: target,
            html: getTemplate($btnLayer)
        }).appendTo(config.parent);
        $menu.data('controller', $btnLayer);

        $.bsLayer.vars.openLayers.push($menu);

        const width = getCurrentWidth($btnLayer);
        const zIndex = getCurrentZIndex($btnLayer);
        $menu
            .addClass('position-fixed top-0 h-100 rounded-start-5 bs-layer sliding')
            .css({
                width: width + 'px',
                right: '-' + width + 'px',
                zIndex: zIndex,
                transition: 'right ' + animationDuration + 'ms',
                display: 'block',
                background: 'rgba(255, 255, 255, 0.74)',
                borderRadius: '16px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(9.1px)',
                WebkitBackdropFilter: 'blur(9.1px)',
                border: '1px solid rgba(255, 255, 255, 1)'
            })
            .attr('aria-modal', 'true')
            .attr('role', 'layer');

        const layerBody = $menu.find('.layer-body');
        layerBody.html(getLoading());

        // If a URL is set, load content via AJAX and insert into the layer
        if (settings.url) {
            const query = typeof settings.queryParams === 'function' ? settings.queryParams() : {};
            $.ajax({
                url: settings.url, // URL to load content from
                type: 'GET',
                data: query, // Optional: query parameter pairs
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                success: function (res) {
                    const $content = $(res);
                    layerBody.empty().append($content);
                    triggerEvent($btnLayer, 'load', $content);
                },
                error: function (xhr, status, error) {
                    console.error('Error loading URL:', error);
                }
            });
        }

        // Animate in
        void $menu[0].offsetWidth;
        $menu.css('right', '0');

        // Hide overflow for all previous layers
        for (let i = 0; i < $.bsLayer.vars.openLayers.length - 1; i++) {
            $.bsLayer.vars.openLayers[i].addClass('overflow-hidden');
        }
        $menu.removeClass('overflow-hidden');

        // BACKDROP logic
        if (settings.backdrop) {
            let $backdrop = $('#layerBackdrop');
            if ($backdrop.length === 0) {
                $backdrop = $('<div id="layerBackdrop" class="modal-backdrop fade show"></div>')
                    .appendTo('body');
            } else {
                $backdrop.appendTo('body');
            }
            const backdropZ = zIndex - 1;
            $backdrop.css({zIndex: backdropZ});
        }

        // Only set body overflow for the first opened layer
        if ($.bsLayer.vars.openLayers.length === 1) {
            $('body').addClass('overflow-hidden');
        }

        // Fire event before showing
        triggerEvent($btnLayer, 'show', $menu);

        // Fire event after fully shown
        bsLayerTimeout(() => {
            $menu.css('transition', 'none');
            triggerEvent($btnLayer, 'shown', $menu);
            $menu.removeClass('sliding');
            $menu.addClass('show');
            $btnLayer.data('layer', $menu);
            $.bsLayer.vars.isAnimating = false;
        }, animationDuration);
    }

    function close() {
        if ($.bsLayer.vars.isAnimating) {
            return;
        }
        $.bsLayer.vars.isAnimating = true;

        const settings = $.bsLayer.defaults;
        const config = $.bsLayer.getConfig();
        const animationDuration = config.animationDuration;
        const $layer = $.bsLayer.vars.openLayers[$.bsLayer.vars.openLayers.length - 1];
        const $layerBtn = $layer.data('controller');
        const width = $layer && $layer.outerWidth ? $layer.outerWidth() : 0;
        $layer.css('transition', 'right ' + animationDuration + 'ms');
        if ($layer) {
            triggerEvent($layerBtn, 'hide');
        }

        if (settings.backdrop) {
            if ($.bsLayer.vars.openLayers.length === 1) {
                $('#layerBackdrop').remove();
            } else if ($.bsLayer.vars.openLayers.length > 1) {
                const $underLayer = $.bsLayer.vars.openLayers[$.bsLayer.vars.openLayers.length - 2];
                const zIndex = $underLayer && $underLayer.css
                    ? (parseInt($underLayer.css('z-index'), 10) || 1050)
                    : 1050;
                $('#layerBackdrop').css({zIndex: zIndex - 1});
            }
        }

        // Menü animiert schließen
        if ($layer && $layer.css) {
            $layer.css('right', '-' + width + 'px');
            $layer.addClass('sliding');

            setTimeout(function () {
                $layer.hide(function () {
                    triggerEvent($layerBtn, 'hidden');
                    $layer.remove(); // Layer aus DOM entfernen

                    $.bsLayer.vars.openLayers.pop(); // Layer aus dem Stack entfernen
                    if ($.bsLayer.vars.openLayers.length) {
                        $.bsLayer.vars.openLayers[$.bsLayer.vars.openLayers.length - 1].removeClass('overflow-hidden');
                    } else {
                        $('body').removeClass('overflow-hidden');
                    }

                    $.bsLayer.vars.isAnimating = false; // Animation abgeschlossen
                });
            }, animationDuration);
        } else {
            $.bsLayer.vars.isAnimating = false;
        }
    }

    /**
     * Schliesst alle offenen Layer nacheinander animiert (rückwärts).
     */
    function closeAll() {
        const vars = $.bsLayer.vars;
        // Wenn bereits eine Animation läuft, nicht doppelt starten
        if (vars.isAnimating || !vars.openLayers.length) {
            return;
        }

        function closeNext() {
            if (!vars.openLayers.length) return;

            // Layer wird bereits im Stack-ele letzten geschlossen
            close();
            // Callback im close() einhängen: wenn close() fertig ist, closeNext() wieder aufrufen
            // close() setzt isAnimating am Ende auf false, daher muss Polling verwendet werden,
            // falls close keine Callback-Unterstützung hat:
            if (vars.openLayers.length > 0) {
                // Warte bis die aktuelle Animation durch ist, dann nächsten schließen
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

    /**
     * Zentraler Timeout für bsLayer
     * Führt callback sofort aus, wenn $.bsLayer.immediate true ist, sonst wie setTimeout.
     * @param {function} callback
     * @param {number} duration
     */
    function bsLayerTimeout(callback, duration) {
        if ($.bsLayer.vars.immediate || duration === 0) {
            callback();
            return null;
        } else {
            return setTimeout(callback, duration);
        }
    }
})
(jQuery);
