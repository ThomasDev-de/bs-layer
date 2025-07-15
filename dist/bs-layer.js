(function ($) {
    'use strict';

    $.bsLayer = {
        getDefaults: function () {
            return this.defaults;
        },
        getConfig: function () {
            return this.config;
        },
        config: {
            distanceBetweenLayers: 100,
            animationDuration: 1500,
            parent: 'body',
        },
        defaults: {
            width: undefined,
            backdrop: true,
            url: null,
            queryParams(params) {
                return params;
            }
        }
    };

    const namespace = '.bs.layer';
    let registerGlobalLayerEvents = false;

    const layers = [];
    // Offene Layer zählen
    var openCount = 0;

    $.fn.bsLayer = function (optionsOrMethod) {
        if ($(this).length === 0) return;

        if ($(this).length > 1) {
            return $(this).each(function () {
                return $(this).bsLayer(optionsOrMethod);
            });
        }

        const $layerButton = $(this);
        const optionsSet = typeof optionsOrMethod === 'object';

        // Automatische Initialisierung
        if (!$layerButton.data('dataBsLayer')) {
            $layerButton.addClass('btn-layer');
            console.log('Initialisiere Button:', $layerButton);
            const options = typeof optionsOrMethod === 'object' ? optionsOrMethod : {};
            // Zusammenfügen von Standard- und benutzerdefinierten Einstellungen
            const settings = $.extend(
                true,
                {},
                $.bsLayer.getDefaults(),
                options
            );

            const dataBsLayer = {
                settings: settings,
            };

            $layerButton.data('dataBsLayer', dataBsLayer);
            btnEvents($layerButton);
        }

        if (!registerGlobalLayerEvents) {

            globalEvents();
            registerGlobalLayerEvents = true;
        }

        return $layerButton;
    };

    function getSettings($btnLayer) {
        return $btnLayer.data('dataBsLayer').settings
    }

    function btnEvents($btnLayer) {
        const settings = getSettings($btnLayer);
        $btnLayer.on('click' + namespace, function (e) {
            e.preventDefault();
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
            if (isAnimating || $('.bs-layer.sliding').length) {
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
        const countOpenLayers = layers.length;
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

        if(settings.width) {
            return settings.width;
        }
        const prevWidth = layers[layers.length - 2].width ? layers[layers.length - 2].width() : Math.round(winWidth * 0.8);
        return Math.max(prevWidth - config.distanceBetweenLayers, 576);
    }

    function getCurrentZIndex($btnLayer) {
        const settings = getSettings($btnLayer);
        const countOpenLayers = layers.length;
        return 1050 + countOpenLayers;
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

    function getTemplate() {
        return [
            // Oberstes Container-Div mit flexiblen Eigenschaften
            '<div class="d-flex flex-column align-items-stretch h-100 w-100">',
            // Layer-Header mit Titel und Schließen-Button
            '<div class="layer-header d-flex flex-nowrap justify-content-between align-items-center p-3">',
            '<h5 class="layer-title"></h5>',
            '<button type="button" class="btn-close" data-bs-dismiss="layer" aria-label="Close" style="filter: invert(1) grayscale(1) brightness(0.2);"></button>',
            '</div>',
            // Hauptinhalt des Layers
            '<div class="layer-body p-3 flex-fill overflow-y-auto"></div>',
            '</div>',
        ].join('');
    }

    function open($btnLayer) {
        const settings = getSettings($btnLayer);
        const config = $.bsLayer.getConfig();
        const animationDuration = config.animationDuration;
        var $menu = $('<div>', {
            html: getTemplate()
        }).appendTo(config.parent);
        layers.push($menu);
        // const $menu = layers[layers.length - 1];
        const width = getCurrentWidth($btnLayer);
        const zIndex = getCurrentZIndex($btnLayer);

        let target;
        if ($btnLayer.is('a')) {
            target = $btnLayer.attr('href');
        } else if ($btnLayer.is('button')) {
            target = $btnLayer.attr('data-bs-target');
        }

        $menu
            .addClass('position-fixed top-0 h-100 rounded-start-5 bs-layer sliding')
            .css({
                width: width + 'px',
                right: '-' + width + 'px',
                zIndex: zIndex,
                opacity: .95,
                transition: 'right ' + animationDuration + 'ms',
                display: 'block',
                background: 'rgba(255, 255, 255, 0.74)',
                borderRadius: '16px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(9.1px)',
                WebkitBackdropFilter: 'blur(9.1px)',
                border: '1px solid rgba(255, 255, 255, 1)'
            })
            .attr('id', target)
            .attr('aria-modal', 'true')
            .attr('role', 'layer');

        const layerBody = $menu.find('.layer-body');
        layerBody.html(getLoading());

        if (settings.url) {
            const query = typeof settings.queryParams === 'function' ? settings.queryParams() : {};
            $.ajax({
                url: settings.url, // Die URL, von der der Inhalt geladen wird
                type: 'GET', // HTTP-Methode (GET für diese Anfrage)
                data: query, // Optional: Übergebene Query-Parameter-Paare
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8', // Standard Content-Type

                success: function (res) {
                    const $content = $(res);
                    layerBody.empty().append($content);
                    // Prüfe und rufe die onLoad-Funktion auf, wenn sie definiert ist
                    if (typeof settings.onLoad === 'function') {

                        settings.onLoad($content);
                    } else {
                        console.error('onLoad ist kein gültiges Callback!');
                    }
                },
                error: function (xhr, status, error) {
                    // Fehler behandeln (z. B. anzeigen, warum der Inhalt nicht geladen wurde)
                    console.error('Fehler beim Laden der URL:', error);
                }
            });
        }
        // $menu.append(
        //     $('<button type="button" class="btn-close position-absolute top-0 end-0 m-3" aria-label="Close" data-bs-dismiss="layer" style="filter: invert(1) grayscale(1) brightness(0.2);"></button>')
        // );
        // $menu.append(
        //     $('<a href="#" data-bs-toggle="layer" class="btn btn-primary mt-5 ms-4">Open another layer</a>')
        // );

        // Reflow/Animation
        void $menu[0].offsetWidth;
        $menu.css('right', '0');

        for (var i = 0; i < layers.length - 1; i++) {
            layers[i].addClass('overflow-hidden');
        }
        $menu.removeClass('overflow-hidden');

        // BACKDROP LOGIK
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

        // Body overflow nur fürs erste Layer
        if (openCount === 1) {
            $('body').addClass('overflow-hidden');
        }

        // Event vor dem Anzeigen auslösen
        $menu.trigger('show' + namespace, [$menu]);
        // Event nach komplettem Öffnen auslösen
        setTimeout(() => {
            $menu.removeClass('sliding');
            $menu.trigger('shown' + namespace, [$menu]);
        }, animationDuration);
    }

    let isAnimating = false;

    function close() {
        if (isAnimating) return; // Abbrechen, wenn eine Animation bereits läuft
        isAnimating = true;      // Flag setzen, um Animation zu blockieren

        const settings = $.bsLayer.defaults;
        const config = $.bsLayer.getConfig();
        const animationDuration = config.animationDuration;
        var $topMenu = layers[layers.length - 1];
        var width = $topMenu && $topMenu.outerWidth ? $topMenu.outerWidth() : 0;

        // Event vor dem Schließen auslösen
        if ($topMenu) {
            $topMenu.trigger('hide' + namespace);
        }

        // --- BACKDROP zuerst verschieben ---
        if (settings.backdrop) {
            if (layers.length === 1) {
                $('#layerBackdrop').remove();
            } else if (layers.length > 1) {
                const $underLayer = layers[layers.length - 2];
                const zIndex = $underLayer && $underLayer.css
                    ? (parseInt($underLayer.css('z-index'), 10) || 1050)
                    : 1050;
                $('#layerBackdrop').css({zIndex: zIndex - 1});
            }
        }

        // Menü animiert schließen
        if ($topMenu && $topMenu.css) {
            $topMenu.css('right', '-' + width + 'px');
            $topMenu.addClass('sliding');

            setTimeout(function () {
                $topMenu.hide(function () {
                    $topMenu.trigger('hidden' + namespace); // Event nach vollständigem Schließen auslösen
                    $topMenu.remove(); // Layer aus DOM entfernen

                    layers.pop(); // Layer aus dem Stack entfernen
                    if (layers.length) {
                        layers[layers.length - 1].removeClass('overflow-hidden');
                    }

                    isAnimating = false; // Animation abgeschlossen
                });

                openCount--;
                if (openCount === 0) {
                    $('body').removeClass('overflow-hidden');
                }
            }, animationDuration);
        } else {
            isAnimating = false;
        }
    }


})
(jQuery);
