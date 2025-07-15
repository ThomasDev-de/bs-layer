(function ($) {
    'use strict';

    $.bsLayerSlideMenu = {
        defaults: {
            width: 50,       // Jeder neue Layer ist 85% so breit wie der vorherige
            animationDuration: 300,
            backdrop: true,
            parent: 'body'
        }
    };

    const layers = [];
    // Offene Layer zählen
    var openCount = 0;

    // Plugin Initialisierung
    $.fn.bsLayerSlideMenu = function () {
        if ($(this).length === 0) return;
        if ($(this).length > 1) return $(this).each(function () {
            $(this).bsLayerSlideMenu();
        });

        const layerButton = $(this);
        const settingsBefore = layerButton.data('bsLayerSlideMenu') || layerButton.data() || {};
        const newSettings = $.extend(true, {}, $.bsLayerSlideMenu.defaults, settingsBefore);
        layerButton.data('bsLayerSlideMenu', newSettings);
        buildLayer(layerButton);
        return this;
    };

    function getSettings($btnLayer) {
        return $btnLayer.data('bsLayerSlideMenu')
    }

    function events() {
        // Öffnen
        $(document).on('click', '[data-bs-toggle="layerSlideMenu"]', function (e) {
            e.preventDefault();
            const btn = $(e.currentTarget);
            btn.bsLayerSlideMenu();
        });

        // Schließen (immer nur das oberste)
        $(document).on('click', '[data-bs-dismiss="layerSlideMenu"]', function (e) {
            e.preventDefault();
            closeTopMenu();
        });
        // Backdrop-Klick: nur wenn Option nicht 'static'
        $(document).on('click', '#layerSlideBackdrop', function (e) {
            const backdropOpt = $.bsLayerSlideMenu.defaults.backdrop;
            if (backdropOpt === 'static') {
                // Ignorieren!
                return;
            }
            e.preventDefault();
            closeTopMenu();
        });

        // ESC schließt nur das oberste Menü (optional: ESC auch ignorieren bei static)
        $(document).on('keydown', function (e) {
            if (e.key === "Escape") {
                // ESC sperren, wenn backdrop 'static'
                const backdropOpt = $.bsLayerSlideMenu.defaults.backdrop;
                if (backdropOpt === 'static') return;
                closeTopMenu();
            }
        });

    }

    function buildLayer($btnLayer) {
        const options = getSettings($btnLayer);
        var $menu = $('<div>').appendTo(options.parent);
        layers.push($menu);
        openMenu($btnLayer);
        return $menu;
    }

    function getCurrentWidth($btnLayer) {
        const settings = $.bsLayerSlideMenu.defaults;
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

        const prevWidth = layers[layers.length - 2].width ? layers[layers.length - 2].width() : Math.round(winWidth * 0.8);
        return Math.max(prevWidth - settings.width, 576);
    }

    function getCurrentZIndex($btnLayer) {
        const settings = $.bsLayerSlideMenu.defaults;
        const countOpenLayers = layers.length;
        return 1050 + countOpenLayers;
    }

    function openMenu($btnLayer) {
        const options = getSettings($btnLayer);
        const $menu = layers[layers.length - 1];
        const width = getCurrentWidth($btnLayer);
        const zIndex = getCurrentZIndex($btnLayer);

        $menu.addClass('position-fixed top-0 h-100 shadow-lg bg-white rounded-start-5 bs-layer-slide-menu')
            .css({
                width: width + 'px',
                right: '-' + width + 'px',
                zIndex: zIndex,
                opacity: .95,
                transition: 'right ' + options.animationDuration + 'ms',
                display: 'block',
                borderLeft: '5px solid rgba(120,160,255,0.60)',
                backdropFilter: 'blur(15px) saturate(170%)',
                WebkitBackdropFilter: 'blur(15px) saturate(170%)',
            })
            .attr('aria-modal', 'true')
            .attr('role', 'layer');

        $menu.append(
            $('<button type="button" class="btn-close position-absolute top-0 end-0 m-3" aria-label="Close" data-bs-dismiss="layerSlideMenu" style="filter: invert(1) grayscale(1) brightness(0.2);"></button>')
        );
        $menu.append(
            $('<a href="#" data-bs-toggle="layerSlideMenu" class="btn btn-primary mt-5 ms-4">Weiteres Menü öffnen</a>')
        );

        // Reflow/Animation
        void $menu[0].offsetWidth;
        $menu.css('right', '0');

        for (var i = 0; i < layers.length - 1; i++) {
            layers[i].addClass('overflow-hidden');
        }
        $menu.removeClass('overflow-hidden');

        // BACKDROP LOGIK
        if (options.backdrop) {
            // es gibt immer nur EIN backdrop!
            let $backdrop = $('#layerSlideBackdrop');

            // wenn nicht vorhanden, anlegen
            if ($backdrop.length === 0) {
                $backdrop = $('<div id="layerSlideBackdrop" class="modal-backdrop fade show"></div>')
                    .appendTo('body');
            } else {
                // am DOM-Ende sicherstellen, falls Layer entfernt wurde
                $backdrop.appendTo('body');
            }

            // Z-Index: eine Stufe unter dem neuesten Menü, aber über dem darunterliegenden Layer/Menu
            let backdropZ = zIndex - 1;
            $backdrop.css({ zIndex: backdropZ });
        }

        // Body overflow nur fürs erste Layer
        if (openCount === 1) {
            $('body').addClass('overflow-hidden');
        }
    }
    function closeTopMenu() {
        const settings = $.bsLayerSlideMenu.defaults;
        var $topMenu = layers[layers.length - 1];
        var width = $topMenu && $topMenu.outerWidth ? $topMenu.outerWidth() : 0;

        // --- BACKDROP zuerst verschieben ---
        if (settings.backdrop) {
            if (layers.length === 1) {
                // Letztes Menü: sofort entfernen
                $('#layerSlideBackdrop').remove();
            } else if (layers.length > 1) {
                // Sonst: nur wenn noch ein darunterliegender Layer existiert!
                const $underLayer = layers[layers.length - 2];
                const zIndex = $underLayer && $underLayer.css
                    ? (parseInt($underLayer.css('z-index'), 10) || 1050)
                    : 1050;
                $('#layerSlideBackdrop').css({ zIndex: zIndex - 1 });
            }
        }

        // Menü animiert schließen
        if ($topMenu && $topMenu.css) {
            $topMenu.css('right', '-' + width + 'px');
            setTimeout(function() {
                $topMenu.hide(function() {
                    $topMenu.remove();
                    layers.pop();
                    if (layers.length) {
                        layers[layers.length - 1].removeClass('overflow-hidden');
                    }
                });
                openCount--;
                if (openCount === 0) {
                    $('body').removeClass('overflow-hidden');
                }
            }, settings.animationDuration);
        }
    }

    events();
})
(jQuery);
