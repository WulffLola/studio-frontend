import { Box, Flex, HStack, Select, Text } from "@chakra-ui/react";
import Icon from '@mdi/react';
import { mdiAccountGroup, mdiAccountMultipleCheck, mdiCancel } from '@mdi/js';
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";

// const months = [
// { id: 1, name: "Enero" },
// { id: 2, name: "Febrero" },
// { id: 3, name: "Marzo" },
// { id: 4, name: "Abril" },
// { id: 5, name: "Mayo" },
// { id: 6, name: "Junio" },
// { id: 7, name: "Julio" },
// { id: 8, name: "Agosto" },
// { id: 9, name: "Septiembre" },
// { id: 10, name: "Octubre" },
// { id: 11, name: "Noviembre" },
// { id: 12, name: "Diciembre" }
// ];

// const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

const CancellationRate = ({ months, years }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMonthCancellation, setSelectedMonthCancellation] = useState('');
    const [selectedYearCancellation, setSelectedYearCancellation] = useState('');
    const [cancellationRateByMonth, setCancellationRateByMonth] = useState([]);
    const { tipo, tokens } = useAuthStore();

    const handleMonthCancallationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMonthCancellation(e.target.value);
    };

    const handleYearCancallationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedYearCancellation(e.target.value);
    };

    async function getCancellationRateByMonth() {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_CANCELLATION_RATE_BY_MONTH}`, {
                headers: {
                  'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                  'Content-Type': 'application/json',
                },
              });
            setCancellationRateByMonth(response.data);
        } catch (error) {
            console.log(error);
        }
    }

    console.log(cancellationRateByMonth)

    useEffect(() => {
        getCancellationRateByMonth();
    }, []);

    useEffect(() => {
        const fetchCancellationRate = async () => {
            if (selectedMonthCancellation && selectedYearCancellation) {
                setIsLoading(true);
                setError(null);

                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_URL_BACKEND_CANCELLATION_RATE_BY_MONTH}${selectedYearCancellation}-${selectedMonthCancellation}`, {
                        headers: {
                          'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                          'Content-Type': 'application/json',
                        },
                      });
                    if (!response.ok) {
                        throw new Error('Error al obtener los datos');
                    }
                    const result = await response.json();
                    setCancellationRateByMonth(result);
                } catch (error) {
                    setError(error.message);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchCancellationRate();
    }, [selectedMonthCancellation, selectedYearCancellation]);

    return (
        <>
            <Box
                bg="bg.surface"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="card"
                boxShadow="card"
                p={5}
                maxWidth="fit-content"  // Ajusta la caja al tamaño de su contenido
            >
                <HStack mb={4} spacing={2.5}>
                    <Flex w="32px" h="32px" borderRadius="8px" bg="brand.50" color="brand.600" align="center" justify="center">
                        <Icon path={mdiAccountMultipleCheck} size={0.75} />
                    </Flex>
                    <Text textStyle="cardTitle">Cancelaciones</Text>
                </HStack>
                <Box>
                    <Box mb={4}>
                        <Select placeholder="Selecciona mes" onChange={handleMonthCancallationChange}>
                            {months.map((month, index) => (
                                <option key={index} value={month.id}>
                                    {month.name}
                                </option>
                            ))}
                        </Select>
                    </Box>

                    <Box mb={4}>
                        <Select placeholder="Selecciona año" onChange={handleYearCancallationChange}>
                            {years.map((year, index) => (
                                <option key={index} value={year}>
                                    {year}
                                </option>
                            ))}
                        </Select>
                    </Box>

                    {isLoading && <Text fontSize="13px" color="text.muted">Cargando datos...</Text>}
                    {error && <Text fontSize="13px" color="error.fg">{error}</Text>}

                    {/* Mostrar datos solo si se selecciona un mes y un año */}
                    {selectedMonthCancellation && selectedYearCancellation && cancellationRateByMonth && (
                        <Flex wrap="wrap" justifyContent="flex-start" gap={2}>
                            <Box
                                bg="bg.subtle"
                                px={4}
                                py={3}
                                borderRadius="control"
                                width="100%"
                            >
                                <HStack spacing={3} justify="space-between">
                                    <Text fontSize="13px" color="text.secondary">Total de clientes</Text>
                                    <Text fontWeight={600}>{cancellationRateByMonth.total_clients}</Text>
                                </HStack>

                            </Box>

                            <Box
                                bg="bg.subtle"
                                px={4}
                                py={3}
                                borderRadius="control"
                                width="100%"
                            >
                                <HStack spacing={3} justify="space-between">
                                    <Text fontSize="13px" color="text.secondary">Clientes cancelados</Text>
                                    <Text fontWeight={600}>{cancellationRateByMonth.cancelled_clients}</Text>
                                </HStack>
                            </Box>

                            <Box
                                bg="bg.subtle"
                                px={4}
                                py={3}
                                borderRadius="control"
                                width="100%"
                            >
                                <HStack spacing={3} justify="space-between">
                                    <Text fontSize="13px" color="text.secondary">Tasa de cancelación</Text>
                                    <Text fontWeight={600}>{cancellationRateByMonth ? Number(cancellationRateByMonth.cancellation_rate).toFixed(2) : "0"}%</Text>
                                </HStack>
                            </Box>
                        </Flex>
                    )}
                </Box>
            </Box>
        </>
    );
};

export default CancellationRate;