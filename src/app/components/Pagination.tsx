import { useState } from "react";
import { HStack, Button, IconButton, Box, Text } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

interface PaginationProps {
  count: number; // Total de elementos
  pageSize: number; // Número de elementos por página
  defaultPage: number; // Página inicial
  onPageChange: (page: number) => void; // Función de callback para el cambio de página
}

const Pagination = ({ count, pageSize, defaultPage = 1, onPageChange }) => {
  const [currentPage, setCurrentPage] = useState(defaultPage || 1);

  const handlePageChange = (page) => {
    if (page < 1 || page > count) return;
    setCurrentPage(page);
    onPageChange(page);
  };

  const getPagesToShow = () => {
    const totalPages = count;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];

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


  return (
    <Box as="nav" aria-label="Paginación" width="fit-content" maxW="100%">
      <HStack spacing={1} justify="center" flexWrap="wrap">
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
          isDisabled={currentPage === count}
          aria-label="Página siguiente"
          variant="ghost"
          size="sm"
        />
      </HStack>
    </Box>

  );
};

export default Pagination;
