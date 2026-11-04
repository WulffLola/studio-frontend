import { ReactNode, useEffect, useState } from "react";
import { HStack, Button, IconButton, Box, Grid, Text } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

interface PaginationProps {
  count: number; // Total de páginas
  pageSize: number; // Número de elementos por página
  defaultPage: number; // Página inicial
  onPageChange: (page: number) => void; // Función de callback para el cambio de página
  totalItems?: number;
  page?: number;
  leftContent?: ReactNode;
}

const Pagination = ({
  count,
  pageSize,
  defaultPage = 1,
  onPageChange,
  totalItems,
  page,
  leftContent,
}: PaginationProps) => {
  const [currentPage, setCurrentPage] = useState(defaultPage || 1);

  // Permite controlar la página desde afuera (por ejemplo, volver a 1 al filtrar)
  useEffect(() => {
    if (page !== undefined) setCurrentPage(page);
  }, [page]);

  // Si al filtrar quedan menos páginas, se vuelve a la última que existe
  useEffect(() => {
    if (count > 0 && currentPage > count) {
      setCurrentPage(count);
      onPageChange(count);
    }
  }, [count, currentPage, onPageChange]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > count) return;
    setCurrentPage(page);
    onPageChange(page);
  };

  const getPagesToShow = () => {
    const totalPages = count;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: Array<number | string> = [1];

    if (currentPage <= 3) {
      // Para las primeras páginas, mostramos 1 2 3 4 ... 31
      pages.push(2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Para las últimas páginas, mostramos 1 ... 28 29 30 31
      pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      // Para páginas intermedias, mostramos 1 ... (páginas alrededor) ... 31
      pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }

    return pages;
  };

  const pagesToShow = getPagesToShow();
  const showRange = totalItems !== undefined;
  const firstVisibleItem = !totalItems ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleItem = !totalItems ? 0 : Math.min(currentPage * pageSize, totalItems);

  const pager = (
    <HStack as="nav" aria-label="Paginación" spacing={1} justify="center" flexWrap="wrap" justifySelf="center">
      <IconButton
        onClick={() => handlePageChange(currentPage - 1)}
        icon={<ChevronLeftIcon boxSize={5} />}
        isDisabled={currentPage === 1}
        aria-label="Página anterior"
        variant="ghost"
        size="sm"
      />
      {pagesToShow.map((page, index) =>
        page === '...' ? (
          <Text key={index} as="span" px={1} color="text.muted" fontSize="13px" aria-hidden>
            …
          </Text>
        ) : (
          <Button
            key={index}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
            variant="ghost"
            size="sm"
            minW="32px"
            px={2}
            fontWeight={currentPage === page ? 600 : 500}
            color={currentPage === page ? "text.brand" : "text.secondary"}
            bg={currentPage === page ? "bg.selected" : "transparent"}
            _hover={{ bg: currentPage === page ? "bg.selectedHover" : "bg.hover", color: currentPage === page ? "text.brand" : "text.primary" }}
          >
            {page}
          </Button>
        )
      )}
      <IconButton
        onClick={() => handlePageChange(currentPage + 1)}
        icon={<ChevronRightIcon boxSize={5} />}
        isDisabled={currentPage === count || count === 0}
        aria-label="Página siguiente"
        variant="ghost"
        size="sm"
      />
    </HStack>
  );

  // Sin contenido extra ni total: se mantiene el paginador compacto de siempre
  if (!leftContent && !showRange) {
    return (
      <Box width="fit-content" maxW="100%">
        {pager}
      </Box>
    );
  }

  return (
    <Grid
      templateColumns={{ base: "1fr", md: "minmax(0, 1fr) auto minmax(0, 1fr)" }}
      alignItems="center"
      gap={3}
      width="100%"
      minWidth={0}
      flex="1 1 100%"
    >
      <Box justifySelf={{ base: "center", md: "start" }} minW={0}>
        {leftContent}
      </Box>
      {pager}
      <Text
        fontSize="13px"
        color="text.muted"
        whiteSpace="nowrap"
        justifySelf={{ base: "center", md: "end" }}
      >
        {showRange ? `Mostrando ${firstVisibleItem}–${lastVisibleItem} de ${totalItems}` : null}
      </Text>
    </Grid>
  );
};

export default Pagination;
