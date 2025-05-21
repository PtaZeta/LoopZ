import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const MinimalCheckIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={3}
        stroke="currentColor"
        className={className}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

MinimalCheckIcon.propTypes = {
    className: PropTypes.string,
};

const ContextMenu = memo(function ContextMenu({
    x,
    y,
    show,
    onClose,
    options,
    userPlaylists = [],
    currentSong = null
}) {
    const menuRef = useRef(null);
    const [showSubMenu, setShowSubMenu] = useState(false);
    const [subMenuOptions, setSubMenuOptions] = useState([]);
    const [subMenuPosition, setSubMenuPosition] = useState({ x: 0, y: 0 });
    const closeTimer = useRef(null);

    const handleClose = useCallback(() => {
        setShowSubMenu(false);
        setSubMenuOptions([]);
        onClose();
    }, [onClose]);

    const startCloseTimer = useCallback(() => {
        closeTimer.current = setTimeout(handleClose, 100);
    }, [handleClose]);

    const cancelCloseTimer = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }, []);

    useEffect(() => {
        if (!show) {
            setShowSubMenu(false);
            setSubMenuOptions([]);
            cancelCloseTimer();
        }
    }, [show, cancelCloseTimer]);

    if (!show) return null;

    // Las coordenadas x, y ya son relativas al viewport desde Show.jsx
    const style = { top: y, left: x };
    const menuWidth = 200; // Ancho estimado del menú, ajusta si es necesario
    const menuHeight = options.length * 35; // Altura estimada, ajusta si es necesario (aproximación)
    const subMenuWidth = 200; // Ancho estimado del submenú

    // Ajustes de posición para que no se salga de los bordes del viewport
    // (estas correcciones son más robustas si también se hacen en el componente de origen como Show.jsx,
    // pero se mantienen aquí para un control adicional)
    if (x + menuWidth > window.innerWidth) {
        style.left = window.innerWidth - menuWidth - 10; // 10px de margen
    }
    if (x < 10) {
        style.left = 10;
    }
    if (y + menuHeight > window.innerHeight) {
        style.top = window.innerHeight - menuHeight - 10;
    }
    if (y < 10) {
        style.top = 10;
    }

    const handleOptionInteraction = (option, event) => {
        cancelCloseTimer();

        if (option.submenu === 'userPlaylists') {
            const playlistOptions = Array.isArray(userPlaylists)
                ? userPlaylists.map((playlist) => ({
                        label: playlist.name,
                        icon: playlist.icon,
                        disabled: playlist.disabled,
                        containsSong: playlist.canciones?.some((c) => c.id === currentSong?.id),
                        image: playlist.imagen,
                        action: () => {
                            playlist.action();
                            handleClose();
                        },
                    }))
                : [];

            const rect = event.currentTarget.getBoundingClientRect();
            let subMenuX = rect.right; // Coordenada x relativa al viewport
            let subMenuY = rect.top;   // Coordenada y relativa al viewport

            // Ajuste para el submenú si se sale por la derecha
            if (subMenuX + subMenuWidth > window.innerWidth) {
                subMenuX = rect.left - subMenuWidth;
            }

            setSubMenuOptions(playlistOptions);
            setSubMenuPosition({ x: subMenuX, y: subMenuY });
            setShowSubMenu(true);
        } else if (option.submenu) {
            // Manejo de submenús genéricos si los hubiere
            const rect = event.currentTarget.getBoundingClientRect();
            let subMenuX = rect.right;
            let subMenuY = rect.top;

            if (subMenuX + subMenuWidth > window.innerWidth) {
                subMenuX = rect.left - subMenuWidth;
            }

            setSubMenuOptions(option.submenu); // Asume que option.submenu es un array de opciones de submenú
            setSubMenuPosition({ x: subMenuX, y: subMenuY });
            setShowSubMenu(true);
        } else {
            if (event.type === 'click' && option.action) {
                option.action();
                handleClose();
            }
        }
    };

    const handleSubMenuOptionClick = (option) => {
        option.action();
        handleClose();
    };

    return (
        <>
            <div
                ref={menuRef}
                // *** CAMBIO CLAVE AQUÍ: de "absolute" a "fixed" ***
                className="fixed z-50 bg-slate-700 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
                style={style}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
                onMouseEnter={cancelCloseTimer}
                onMouseLeave={startCloseTimer}
            >
                <div className="py-1" role="none">
                    {options.map((option, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                if (option.submenu) {
                                    handleOptionInteraction(option, e);
                                } else {
                                    option.action?.();
                                    handleClose();
                                }
                            }}
                            // Abre el submenú al pasar el ratón por encima, si hay un submenú
                            onMouseEnter={(e) => {
                                if (option.submenu) handleOptionInteraction(option, e);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-slate-600 hover:text-white w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            role="menuitem"
                            disabled={option.disabled}
                        >
                            {option.icon && <span className="mr-3">{option.icon}</span>}
                            {option.label}
                            {(option.submenu || option.submenu === 'userPlaylists') && (
                                <ChevronRightIcon className="ml-auto h-4 w-4 text-gray-400" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {showSubMenu && (
                <div
                    // *** CAMBIO CLAVE AQUÍ: de "absolute" a "fixed" ***
                    className="fixed z-50 bg-slate-700 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
                    style={{ top: subMenuPosition.y, left: subMenuPosition.x, minWidth: `${subMenuWidth}px` }}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                    onMouseEnter={cancelCloseTimer}
                    onMouseLeave={startCloseTimer}
                >
                    <div className="py-1" role="none">
                        {subMenuOptions.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-400">No tienes playlists</div>
                        ) : (
                            subMenuOptions.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSubMenuOptionClick(option)}
                                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-slate-600 hover:text-white w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                    role="menuitem"
                                    disabled={option.disabled}
                                >
                                    {option.image && (
                                        <img
                                            src={option.image}
                                            alt={option.label}
                                            className="w-6 h-6 rounded mr-3 object-cover"
                                        />
                                    )}
                                    {option.icon && <span className="mr-3">{option.icon}</span>}
                                    {option.label}
                                    {option.containsSong && (
                                        <MinimalCheckIcon className="ml-3 h-4 w-4 text-white" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </>
    );
});

ContextMenu.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            action: PropTypes.func,
            icon: PropTypes.node,
            disabled: PropTypes.bool,
            submenu: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.arrayOf(
                    PropTypes.shape({
                        label: PropTypes.string.isRequired,
                        action: PropTypes.func,
                        icon: PropTypes.node,
                        disabled: PropTypes.bool,
                    })
                ),
            ]),
        })
    ).isRequired,
    userPlaylists: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            icon: PropTypes.node,
            disabled: PropTypes.bool,
            action: PropTypes.func,
            canciones: PropTypes.arrayOf(
                PropTypes.shape({
                    id: PropTypes.number.isRequired,
                })
            ),
            imagen: PropTypes.string,
        })
    ),
    currentSong: PropTypes.shape({
        id: PropTypes.number,
    }),
};

export default ContextMenu;