import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const IconoCheckMinimal = ({ className }) => (
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

const MenuContexto = memo(({
  x,
  y,
  show,
  onClose,
  options,
  userPlaylists = [],
  currentSong = null
}) => {
  const menuRef = useRef(null);
  const subMenuRef = useRef(null);
  const [mostrarSubMenu, setMostrarSubMenu] = useState(false);
  const [opcionesSubMenu, setOpcionesSubMenu] = useState([]);
  const [posicionSubMenu, setPosicionSubMenu] = useState({ x: 0, y: 0 });
  const temporizadorCierre = useRef(null);

  const handleClose = useCallback(() => {
    setMostrarSubMenu(false);
    setOpcionesSubMenu([]);
    onClose();
  }, [onClose]);

  const iniciarTemporizadorCierre = useCallback(() => {
    temporizadorCierre.current = setTimeout(handleClose, 100);
  }, [handleClose]);

  const cancelarTemporizadorCierre = useCallback(() => {
    if (temporizadorCierre.current) {
      clearTimeout(temporizadorCierre.current);
      temporizadorCierre.current = null;
    }
  }, []);

  useEffect(() => {
    if (!show) {
      setMostrarSubMenu(false);
      setOpcionesSubMenu([]);
      cancelarTemporizadorCierre();
    }
  }, [show, cancelarTemporizadorCierre]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideMenu = menuRef.current?.contains(event.target);
      const isInsideSubMenu = subMenuRef.current?.contains(event.target);

      if (!isInsideMenu && !isInsideSubMenu) {
        handleClose();
      }
    };

    if (show || mostrarSubMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, mostrarSubMenu, handleClose]);

  if (!show) return null;

  const style = { top: y, left: x };
  const menuWidth = 200;
  const menuHeight = options.length * 35;
  const subMenuWidth = 200;

  if (x + menuWidth > window.innerWidth + window.scrollX) {
    style.left = x - menuWidth;
  }

  if (y + menuHeight > window.innerHeight + window.scrollY) {
    style.top = y - menuHeight;
    if (style.top < window.scrollY) style.top = window.scrollY;
  }

  const handleOptionInteraction = (option, event) => {
    cancelarTemporizadorCierre();

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
      let subMenuX = rect.right + window.scrollX;
      let subMenuY = rect.top + window.scrollY;

      if (subMenuX + subMenuWidth > window.innerWidth + window.scrollX) {
        subMenuX = rect.left - subMenuWidth + window.scrollX;
      }

      setOpcionesSubMenu(playlistOptions);
      setPosicionSubMenu({ x: subMenuX, y: subMenuY });
      setMostrarSubMenu(true);
    } else if (option.submenu) {
      const rect = event.currentTarget.getBoundingClientRect();
      let subMenuX = rect.right + window.scrollX;
      let subMenuY = rect.top + window.scrollY;

      if (subMenuX + subMenuWidth > window.innerWidth + window.scrollX) {
        subMenuX = rect.left - subMenuWidth + window.scrollX;
      }

      setOpcionesSubMenu(option.submenu);
      setPosicionSubMenu({ x: subMenuX, y: subMenuY });
      setMostrarSubMenu(true);
    } else {
      if (event.type === 'click' && option.action) {
        option.action();
        handleClose();
      }
    }
  };

  const handleSubMenuOptionClick = (option) => {
    cancelarTemporizadorCierre();
    if (option.action) {
      option.action();
    }
    handleClose();
  };

  return (
    <>
      <div
        ref={menuRef}
        className="absolute z-50 bg-slate-700 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
        style={style}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="options-menu"
        onMouseEnter={cancelarTemporizadorCierre}
        onMouseLeave={iniciarTemporizadorCierre}
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
              onMouseEnter={(e) => {
                if (option.submenu) handleOptionInteraction(option, e);
                else setMostrarSubMenu(false);
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

      {mostrarSubMenu && (
        <div
          ref={subMenuRef}
          className="absolute z-50 bg-slate-700 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
          style={{ top: posicionSubMenu.y, left: posicionSubMenu.x, minWidth: `${subMenuWidth}px` }}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
          onMouseEnter={cancelarTemporizadorCierre}
          onMouseLeave={iniciarTemporizadorCierre}
        >
          <div className="py-1" role="none">
            {opcionesSubMenu.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-400">No tienes playlists</div>
            ) : (
              opcionesSubMenu.map((option, index) => (
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
                    <IconoCheckMinimal className="ml-3 h-4 w-4 text-white" />
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

IconoCheckMinimal.propTypes = {
  className: PropTypes.string,
};

MenuContexto.propTypes = {
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

export default MenuContexto;
