"use client";

import { forwardRef } from "react";
import {
  Select as ChakraReactSelect,
  type ChakraStylesConfig,
  type GroupBase,
  type Props,
  type SelectInstance,
} from "chakra-react-select";

/**
 * chakra-react-select con los estilos de Studio. Hereda alto, borde y foco del
 * theme de Input; acá sólo se ajustan el menú y las opciones, que el paquete
 * dibuja por su cuenta (por defecto en azul).
 */
const studioChakraStyles: ChakraStylesConfig<any, boolean, GroupBase<any>> = {
  // Mismo alto que Input (40px) para que los formularios queden alineados.
  control: (base) => ({ ...base, minHeight: "40px" }),
  placeholder: (base) => ({ ...base, color: "text.muted", fontSize: "14px" }),
  singleValue: (base) => ({ ...base, fontSize: "14px" }),
  dropdownIndicator: (base) => ({ ...base, color: "text.muted", bg: "transparent", px: 2.5 }),
  indicatorSeparator: (base) => ({ ...base, display: "none" }),
  clearIndicator: (base) => ({ ...base, color: "text.muted" }),
  menu: (base) => ({ ...base, zIndex: 1500 }),
  menuList: (base) => ({
    ...base,
    bg: "bg.surface",
    border: "1px solid",
    borderColor: "border.subtle",
    borderRadius: "8px",
    boxShadow: "dropdown",
    p: 1,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "14px",
    borderRadius: "control",
    color: "text.primary",
    bg: state.isSelected ? "bg.selected" : state.isFocused ? "bg.hover" : "transparent",
    fontWeight: state.isSelected ? 500 : 400,
    _active: { bg: "bg.muted" },
  }),
  groupHeading: (base) => ({ ...base, fontSize: "12px", color: "text.muted", fontWeight: 600 }),
  noOptionsMessage: (base) => ({ ...base, fontSize: "13px", color: "text.muted" }),
  multiValue: (base) => ({ ...base, bg: "brand.50", color: "brand.700" }),
};

/** Selector de filtro (p. ej. estudio): mismo alto que los botones y texto con peso. */
const filterChakraStyles: ChakraStylesConfig<any, boolean, GroupBase<any>> = {
  container: (base) => ({ ...base, width: "100%" }),
  control: (base) => ({ ...base, minHeight: "38px", height: "38px", cursor: "pointer" }),
  valueContainer: (base) => ({ ...base, px: 3 }),
  singleValue: (base) => ({ ...base, fontSize: "14px", fontWeight: 500, color: "text.primary" }),
};

type StudioSelectProps<Option, IsMulti extends boolean, Group extends GroupBase<Option>> = Props<
  Option,
  IsMulti,
  Group
> & {
  /** `filter`: selectores de filtro en barras de herramientas. */
  appearance?: "default" | "filter";
};

const compose = (layers: Array<Record<string, any> | undefined>) => {
  const present = layers.filter(Boolean) as Array<Record<string, any>>;
  const keys = Array.from(new Set(present.flatMap((layer) => Object.keys(layer))));
  return Object.fromEntries(
    keys.map((key) => [
      key,
      (provided: any, state: any) =>
        present.reduce((acc, layer) => (layer[key] ? layer[key](acc, state) : acc), provided),
    ]),
  );
};

function SelectInner<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  { chakraStyles, appearance = "default", ...props }: StudioSelectProps<Option, IsMulti, Group>,
  ref: React.Ref<SelectInstance<Option, IsMulti, Group>>,
) {
  const merged = compose([
    studioChakraStyles,
    appearance === "filter" ? filterChakraStyles : undefined,
    chakraStyles as Record<string, any> | undefined,
  ]) as ChakraStylesConfig<Option, IsMulti, Group>;

  return (
    <ChakraReactSelect<Option, IsMulti, Group>
      ref={ref}
      selectedOptionStyle="color"
      selectedOptionColorScheme="brand"
      tagColorScheme="brand"
      chakraStyles={merged}
      {...props}
    />
  );
}

const Select = forwardRef(SelectInner) as <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  props: StudioSelectProps<Option, IsMulti, Group> & { ref?: React.Ref<SelectInstance<Option, IsMulti, Group>> },
) => ReturnType<typeof SelectInner>;

export { Select };
export default Select;
