/**
 * Estilos de componentes de Chakra para Studio.
 *
 * Criterio: el violeta marca jerarquía (acción principal, selección, foco);
 * los neutros construyen el resto de la interfaz; los estados semánticos
 * (success/warning/error/info) nunca se reemplazan por la marca.
 */

type Props = { colorScheme?: string; [k: string]: any };

const transition = "background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease";

const focusRing = {
  _focusVisible: { boxShadow: "focusRing", outline: "none" },
};

const disabled = {
  _disabled: {
    opacity: 1,
    cursor: "not-allowed",
    bg: "bg.muted",
    color: "text.disabled",
    borderColor: "border.subtle",
    boxShadow: "none",
  },
};

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
const Button = {
  baseStyle: {
    fontWeight: 500,
    borderRadius: "control",
    lineHeight: "1.2",
    transitionProperty: "common",
    transitionDuration: "120ms",
    ...focusRing,
    _disabled: { cursor: "not-allowed", opacity: 0.45, boxShadow: "none" },
  },
  sizes: {
    lg: { h: "44px", minW: "44px", fontSize: "15px", px: 5 },
    md: { h: "38px", minW: "38px", fontSize: "14px", px: 4 },
    sm: { h: "32px", minW: "32px", fontSize: "13px", px: 3 },
    xs: { h: "26px", minW: "26px", fontSize: "12px", px: 2 },
  },
  variants: {
    primary: {
      bg: "brand.500",
      color: "text.onBrand",
      _hover: { bg: "brand.600", _disabled: { bg: "brand.500" } },
      _active: { bg: "brand.700" },
      ...disabled,
    },
    secondary: {
      bg: "bg.surface",
      color: "text.primary",
      border: "1px solid",
      borderColor: "border.default",
      _hover: { bg: "bg.hover", borderColor: "border.strong", _disabled: { bg: "bg.muted" } },
      _active: { bg: "bg.muted" },
      ...disabled,
    },
    danger: {
      bg: "red.600",
      color: "white",
      _hover: { bg: "red.700", _disabled: { bg: "red.600" } },
      _active: { bg: "red.800" },
      ...disabled,
    },
    // Conmutadores de vista (grilla/tabla/tarjetas): el seleccionado usa isActive.
    toggle: {
      bg: "bg.surface",
      color: "text.muted",
      border: "1px solid",
      borderColor: "border.default",
      _hover: { bg: "bg.hover", color: "text.primary" },
      _active: { bg: "bg.selected", color: "text.brand", borderColor: "brand.300" },
    },
    // Acciones de ícono en tablas / barras de herramientas.
    ghostDanger: {
      bg: "transparent",
      color: "text.secondary",
      _hover: { bg: "error.bg", color: "error.fg" },
      _active: { bg: "red.100", color: "error.fg" },
    },
    outline: (props: Props) =>
      props.colorScheme === "gray"
        ? {
            bg: "transparent",
            color: "text.primary",
            borderColor: "border.default",
            _hover: { bg: "bg.hover", borderColor: "border.strong" },
            _active: { bg: "bg.muted" },
          }
        : {},
    ghost: (props: Props) =>
      props.colorScheme === "gray"
        ? {
            bg: "transparent",
            color: "text.secondary",
            _hover: { bg: "bg.hover", color: "text.primary" },
            _active: { bg: "bg.muted" },
          }
        : {},
    solid: (props: Props) =>
      props.colorScheme === "gray"
        ? {
            bg: "bg.muted",
            color: "text.primary",
            _hover: { bg: "gray.200" },
            _active: { bg: "gray.300" },
          }
        : {},
    link: {
      color: "text.link",
      fontWeight: 500,
      _hover: { color: "brand.700" },
    },
  },
  defaultProps: {
    variant: "secondary",
    size: "md",
  },
};

// ---------------------------------------------------------------------------
// Formularios
// ---------------------------------------------------------------------------
const fieldBase = {
  bg: "bg.surface",
  border: "1px solid",
  borderColor: "border.default",
  color: "text.primary",
  borderRadius: "control",
  transition,
  _placeholder: { color: "text.muted" },
  _hover: { borderColor: "border.strong" },
  _focusVisible: {
    borderColor: "border.focus",
    boxShadow: "focusRing",
    zIndex: 1,
  },
  _invalid: {
    borderColor: "red.500",
    boxShadow: "none",
    _focusVisible: { borderColor: "red.500", boxShadow: "focusRingError" },
  },
  _disabled: {
    bg: "bg.muted",
    color: "text.secondary",
    borderColor: "border.subtle",
    opacity: 1,
    cursor: "not-allowed",
  },
  _readOnly: { bg: "bg.subtle", boxShadow: "none" },
};

const fieldSizes = {
  lg: { fontSize: "15px", px: 4, h: "44px", borderRadius: "control" },
  md: { fontSize: "14px", px: 3, h: "40px", borderRadius: "control" },
  sm: { fontSize: "13px", px: 3, h: "32px", borderRadius: "control" },
  xs: { fontSize: "12px", px: 2, h: "26px", borderRadius: "control" },
};

const Input = {
  variants: {
    outline: {
      field: fieldBase,
      addon: {
        bg: "bg.subtle",
        border: "1px solid",
        borderColor: "border.default",
        color: "text.secondary",
        borderRadius: "control",
      },
      element: { color: "text.muted" },
    },
  },
  sizes: {
    lg: { field: fieldSizes.lg, addon: fieldSizes.lg },
    md: { field: fieldSizes.md, addon: fieldSizes.md },
    sm: { field: fieldSizes.sm, addon: fieldSizes.sm },
    xs: { field: fieldSizes.xs, addon: fieldSizes.xs },
  },
  defaultProps: { variant: "outline", size: "md" },
};

const NumberInput = {
  variants: { outline: { field: fieldBase } },
  sizes: {
    md: { field: fieldSizes.md },
    sm: { field: fieldSizes.sm },
  },
  defaultProps: { variant: "outline", size: "md" },
};

const Select = {
  variants: { outline: { field: fieldBase, icon: { color: "text.muted" } } },
  sizes: {
    md: { field: { ...fieldSizes.md, pe: 8 } },
    sm: { field: { ...fieldSizes.sm, pe: 8 } },
  },
  defaultProps: { variant: "outline", size: "md" },
};

const Textarea = {
  variants: { outline: { ...fieldBase, py: 2.5 } },
  sizes: {
    md: { fontSize: "14px", px: 3, borderRadius: "control" },
    sm: { fontSize: "13px", px: 3, borderRadius: "control" },
  },
  defaultProps: { variant: "outline", size: "md" },
};

const FormLabel = {
  baseStyle: {
    fontSize: "13px",
    fontWeight: 500,
    color: "text.primary",
    mb: 1.5,
    me: 2,
    _disabled: { opacity: 0.6 },
  },
};

const Form = {
  baseStyle: {
    requiredIndicator: { color: "red.500", ms: 0.5 },
    helperText: { mt: 1.5, fontSize: "12px", color: "text.muted", lineHeight: "1.45" },
  },
};

const FormError = {
  baseStyle: {
    text: { mt: 1.5, fontSize: "12px", color: "error.fg", lineHeight: "1.45" },
    icon: { color: "error.fg" },
  },
};

const Checkbox = {
  baseStyle: {
    control: {
      borderRadius: "4px",
      borderColor: "border.strong",
      transition,
      _focusVisible: { boxShadow: "focusRing" },
    },
    label: { fontSize: "14px" },
  },
  defaultProps: { colorScheme: "brand" },
};

const Radio = {
  baseStyle: {
    control: {
      borderColor: "border.strong",
      transition,
      _focusVisible: { boxShadow: "focusRing" },
    },
    label: { fontSize: "14px" },
  },
  defaultProps: { colorScheme: "brand" },
};

const Switch = {
  baseStyle: {
    track: {
      bg: "gray.300",
      _checked: { bg: "brand.500" },
      _focusVisible: { boxShadow: "focusRing" },
    },
  },
  defaultProps: { colorScheme: "brand" },
};

const Slider = { defaultProps: { colorScheme: "brand" } };
const Progress = { defaultProps: { colorScheme: "brand" } };

// ---------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------
const Table = {
  baseStyle: {
    table: {
      fontVariantNumeric: "tabular-nums",
      // Tablas anchas: la última columna (acciones) queda fija a la derecha
      // mientras el resto se desplaza horizontalmente.
      // `--sticky-bg` pinta la celda y una franja exterior que tapa restos sub-píxel.
      "&[data-sticky-actions] tr > :last-child": {
        "--sticky-bg": "var(--chakra-colors-bg-surface)",
        position: "sticky",
        right: "-1px",
        zIndex: 1,
        bg: "var(--sticky-bg)",
        boxShadow: "inset 1px 0 0 var(--chakra-colors-border-subtle), 4px 0 0 0 var(--sticky-bg)",
        transition: "background-color 120ms ease",
      },
      "&[data-sticky-actions] thead tr > :last-child": { "--sticky-bg": "var(--chakra-colors-bg-subtle)" },
      "&[data-sticky-actions] tbody tr:hover > :last-child": { "--sticky-bg": "var(--chakra-colors-bg-hover)" },
      "&[data-sticky-actions] tbody tr[data-selected] > :last-child": { "--sticky-bg": "var(--chakra-colors-bg-selected)" },
      "&[data-sticky-actions] tbody tr > td[colspan]:last-child": {
        position: "static",
        boxShadow: "none",
        bg: "transparent",
      },
    },
    th: {
      fontFamily: "body",
      textTransform: "none",
      letterSpacing: "0.01em",
      fontWeight: 600,
      color: "text.secondary",
      whiteSpace: "nowrap",
    },
    td: { color: "text.primary" },
  },
  variants: {
    simple: {
      th: {
        bg: "bg.subtle",
        borderBottom: "1px solid",
        borderColor: "border.subtle",
      },
      td: {
        borderBottom: "1px solid",
        borderColor: "gray.100",
      },
      tbody: {
        tr: {
          transition: "background-color 120ms ease",
          _hover: { bg: "bg.hover" },
          "&[data-selected]": { bg: "bg.selected" },
          "&[data-selected]:hover": { bg: "bg.selectedHover" },
          "&:last-of-type td": { borderBottom: "none" },
        },
      },
    },
  },
  sizes: {
    sm: {
      th: { px: 3, py: 2.5, fontSize: "12px", lineHeight: "1.4" },
      td: { px: 3, py: 2.5, fontSize: "14px", lineHeight: "1.45" },
    },
    md: {
      th: { px: 4, py: 3, fontSize: "12px", lineHeight: "1.4" },
      td: { px: 4, py: 3, fontSize: "14px", lineHeight: "1.45" },
    },
  },
  defaultProps: { variant: "simple", size: "md", colorScheme: "gray" },
};

const Badge = {
  baseStyle: {
    textTransform: "none",
    fontWeight: 500,
    fontSize: "12px",
    lineHeight: "1.5",
    borderRadius: "full",
    px: 2,
    py: 0.5,
  },
  variants: {
    subtle: (props: Props) =>
      props.colorScheme === "gray"
        ? { bg: "neutral.bg", color: "neutral.fg" }
        : { bg: `${props.colorScheme}.50`, color: `${props.colorScheme}.700` },
  },
  defaultProps: { variant: "subtle", colorScheme: "gray" },
};

const Tag = {
  baseStyle: { container: { fontWeight: 500, borderRadius: "full" } },
  defaultProps: { colorScheme: "brand" },
};

const Card = {
  baseStyle: {
    container: {
      bg: "bg.surface",
      borderRadius: "card",
      border: "1px solid",
      borderColor: "border.subtle",
      boxShadow: "card",
    },
    header: { pb: 0 },
  },
  sizes: {
    md: { header: { p: 5 }, body: { p: 5 }, footer: { p: 5 } },
  },
  defaultProps: { variant: "elevated", size: "md" },
};

const Divider = {
  baseStyle: { borderColor: "border.subtle", opacity: 1 },
};

// ---------------------------------------------------------------------------
// Navegación
// ---------------------------------------------------------------------------
const Tabs = {
  baseStyle: {
    // El contenido de cada pestaña se alinea con el borde de la lista de pestañas.
    tabpanel: { px: 0, pt: 5, pb: 0 },
    tab: {
      fontWeight: 500,
      color: "text.secondary",
      transition,
      _focusVisible: { boxShadow: "focusRing", zIndex: 1 },
      _disabled: { opacity: 0.45, cursor: "not-allowed" },
    },
  },
  sizes: {
    md: { tab: { fontSize: "14px", py: 2, px: 4 } },
    sm: { tab: { fontSize: "13px", py: 1.5, px: 3 } },
  },
  variants: {
    // Navegación secundaria: pestañas subrayadas.
    line: {
      // Línea base como sombra interna: permite scroll horizontal sin recortar el indicador.
      tablist: {
        borderBottom: "none",
        boxShadow: "inset 0 -1px 0 var(--chakra-colors-border-subtle)",
        gap: 1,
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      },
      tab: {
        borderBottom: "2px solid",
        borderColor: "transparent",
        mb: 0,
        whiteSpace: "nowrap",
        flexShrink: 0,
        _hover: { color: "text.primary" },
        _selected: { color: "text.brand", borderColor: "brand.500", fontWeight: 600 },
        _active: { bg: "transparent" },
      },
    },
    // Navegación principal de una página: control segmentado.
    "soft-rounded": {
      tablist: {
        bg: "bg.muted",
        p: 1,
        borderRadius: "8px",
        gap: 1,
      },
      tab: {
        borderRadius: "control",
        border: "none",
        px: { base: 2, md: 4 },
        _hover: { color: "text.primary" },
        _selected: {
          bg: "bg.surface",
          color: "text.brand",
          fontWeight: 600,
          boxShadow: "xs",
        },
      },
    },
    unstyled: {
      tab: {
        _selected: { color: "text.brand" },
      },
    },
  },
  defaultProps: { variant: "line", colorScheme: "brand", size: "md" },
};

const Link = {
  baseStyle: {
    color: "text.link",
    fontWeight: 500,
    _hover: { textDecoration: "none", color: "brand.700" },
    _focusVisible: { boxShadow: "focusRing" },
  },
};

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------
const Modal = {
  baseStyle: {
    overlay: { bg: "bg.overlay" },
    dialog: {
      bg: "bg.surface",
      borderRadius: "modal",
      boxShadow: "modal",
      mx: 4,
      // Formularios renderizados como contenido libre (sin ModalBody): si superan
      // el alto máximo del modal, el contenido se desplaza y las acciones siguen
      // siendo accesibles; el botón de cierre queda fijo.
      display: "flex",
      flexDirection: "column",
      "& > :not(.chakra-modal__close-btn):not(header):not(footer):not(.chakra-modal__body)": {
        flex: "1 1 auto",
        minH: 0,
        overflowY: "auto",
      },
    },
    header: {
      fontSize: "18px",
      fontWeight: 600,
      color: "text.primary",
      px: 6,
      pt: 5,
      pb: 2,
    },
    closeButton: {
      top: 4,
      insetEnd: 4,
      zIndex: 3,
      color: "text.muted",
      borderRadius: "control",
      _hover: { bg: "bg.hover", color: "text.primary" },
      _focusVisible: { boxShadow: "focusRing" },
    },
    body: { px: 6, py: 3, color: "text.primary" },
    footer: { px: 6, pt: 4, pb: 5, gap: 3 },
  },
};

const Drawer = {
  baseStyle: {
    overlay: { bg: "bg.overlay" },
    dialog: { bg: "bg.surface", boxShadow: "modal" },
    header: { fontSize: "18px", fontWeight: 600, color: "text.primary" },
    closeButton: {
      color: "text.muted",
      borderRadius: "control",
      _hover: { bg: "bg.hover", color: "text.primary" },
    },
  },
};

const Popover = {
  baseStyle: {
    content: {
      bg: "bg.surface",
      borderColor: "border.subtle",
      borderRadius: "8px",
      boxShadow: "dropdown",
      _focusVisible: { boxShadow: "dropdown" },
    },
  },
};

const Menu = {
  baseStyle: {
    list: {
      bg: "bg.surface",
      border: "1px solid",
      borderColor: "border.subtle",
      borderRadius: "8px",
      boxShadow: "dropdown",
      p: 1,
      minW: "180px",
    },
    item: {
      fontSize: "14px",
      color: "text.primary",
      borderRadius: "control",
      px: 3,
      py: 2,
      bg: "transparent",
      transition: "background-color 100ms ease",
      _hover: { bg: "bg.hover" },
      _focus: { bg: "bg.hover" },
      _active: { bg: "bg.muted" },
    },
    divider: { my: 1, borderColor: "border.subtle", opacity: 1 },
    groupTitle: { fontSize: "12px", fontWeight: 600, color: "text.muted", mx: 3 },
  },
};

const Tooltip = {
  baseStyle: {
    bg: "bg.inverted",
    color: "white",
    fontSize: "12px",
    fontWeight: 500,
    borderRadius: "control",
    px: 2,
    py: 1,
    boxShadow: "sm",
    "--popper-arrow-bg": "colors.bg.inverted",
  },
};

const Alert = {
  baseStyle: {
    container: { borderRadius: "8px", fontSize: "14px" },
    title: { fontWeight: 600 },
  },
};

const Spinner = {
  baseStyle: { color: "brand.500" },
  defaultProps: { size: "md" },
};

const Skeleton = {
  baseStyle: { borderRadius: "control" },
};

const Heading = {
  baseStyle: {
    fontWeight: 600,
    color: "text.primary",
    letterSpacing: "-0.01em",
  },
  sizes: {
    xl: { fontSize: "22px", lineHeight: "1.3" },
    lg: { fontSize: "18px", lineHeight: "1.35" },
    md: { fontSize: "16px", lineHeight: "1.4" },
    sm: { fontSize: "15px", lineHeight: "1.4" },
    xs: { fontSize: "13px", lineHeight: "1.4" },
  },
  defaultProps: { size: "lg" },
};

const Avatar = {
  baseStyle: {
    container: { bg: "brand.100", color: "brand.700", fontWeight: 600 },
  },
};

export const components = {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Drawer,
  Form,
  FormError,
  FormLabel,
  Heading,
  Input,
  Link,
  Menu,
  Modal,
  NumberInput,
  Popover,
  Progress,
  Radio,
  Select,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Table,
  Tabs,
  Tag,
  Textarea,
  Tooltip,
};
