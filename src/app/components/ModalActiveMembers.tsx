import React, { useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    List,
    ListItem,
    ListIcon,
    Flex,
    Heading,
    Text,
    Stack,
    Button,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogCloseButton,
    AlertDialogBody,
    AlertDialogFooter,
    useDisclosure,
    useToast,
    Spinner,
} from '@chakra-ui/react';
import { mdiChevronLeft, mdiChevronRight, mdiCalendarMonthOutline, mdiEye, mdiPlusCircleOutline } from '@mdi/js';
import Icon from "@mdi/react";
import { CheckCircleIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import ModalCode from './ModalCode';
const ModalActiveMembers = ({ product, onClose }) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simular el proceso de carga de los datos
        if (product.length > 0) {
            setLoading(false); // Cambiar loading a false cuando los datos estén disponibles
        } else if (product.length === 0) {
            setLoading(false);
        } else {
            setLoading(true);
        }
    }, [product]); // Se ejecutará cada vez que `product` cambie

    return (
        <Flex direction="column" p={5}>
            <Heading as="h4" size="md" mb={8}>
                Miembros Activos
            </Heading>
            {loading ? (
                <Flex justifyContent="center" alignItems="center" height="100%">
                    <Spinner size="lg" />
                    <Text ml={4}>Cargando...</Text>
                </Flex>
            ) : product.length > 0 ? (
                <Flex direction="column" overflowY="auto" maxHeight="600px" mb={4}>
                    <List spacing={3}>
                        {product.map((item) => (
                            <ListItem key={item.dni}> {/* Utiliza el dni como clave única */}
                                <Flex alignItems="center" justifyContent="space-between">
                                    <Flex alignItems="center">
                                        <ListIcon as={CheckCircleIcon} color="success.solid" />
                                        {item.name} {item.last_name} - {item.phone} {/* Asegúrate de usar 'dni' en lugar de 'phone' */}
                                    </Flex>
                                </Flex>
                            </ListItem>
                        ))}
                    </List>
                </Flex>
            ) : (
                <Text>No hay miembros activos.</Text>
            )}
            <Stack spacing={4} direction={["column", "row"]} mt={8} justifyContent={"right"}>
                <Button
                    aria-label="Cerrar"
                    onClick={onClose}
                    w={["100%", "135px"]}
                    variant="secondary"
                >
                    Cerrar
                </Button>
            </Stack>
        </Flex>
    );
};

export default ModalActiveMembers;
