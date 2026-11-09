"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Container,
    Flex,
    HStack,
    VStack,
    Text,
    Button,
    SimpleGrid,
    IconButton,
    Image,
    chakra,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    ModalCloseButton,
    Divider,
    Checkbox,
    Stack,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    useDisclosure,
    Spinner,
} from "@chakra-ui/react";
import TableNotes from "../components/TableNotes";
import TableRecipes from "../components/TableRecipes";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../stores/hooks";
import {
    getRecipes,
    getNotes,
} from '../stores/studioSlice';
import ModalNotesAdd from "../components/ModalNotesAdd";
import ModalRecipesAdd from "../components/ModalRecipesAdd";
import { PageContainer } from "../components/ui/PageContainer";
/* import ModalNotesAdd from "../components/ModalNotesAdd";
import ModalRecipesAdd from "../components/ModalRecipesAdd";
*/

export default function Schedule() {
    const [activeTab, setActiveTab] = useState(0); // Estado para controlar la pestaña activa

    const { recipes, notes } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const { isOpen, onOpen, onClose } = useDisclosure();

    const {
        isOpen: isOpenAddNotes,
        onOpen: onOpenAddNotes,
        onClose: onCloseAddNotes,
    } = useDisclosure();

    const {
        isOpen: isOpenAddRecipes,
        onOpen: onOpenAddRecipes,
        onClose: onCloseAddRecipes,
    } = useDisclosure();

    /*  const {
       isOpen: isOpenAddExpenseType,
       onOpen: onOpenAddExpenseType,
       onClose: onCloseAddExpenseType,
     } = useDisclosure();
    */

    useEffect(() => {
        dispatch(getNotes());
        dispatch(getRecipes());
    }, [dispatch]);
    return (
        <>
            <PageContainer>
                    {/* Tabs Horarios / Mis reservas */}
                    < Tabs
                        variant="soft-rounded"
                        isFitted
                        w="100%"
                        onChange={(index) => setActiveTab(index)} // Actualiza la pestaña activa
                    >
                        <TabList>
                            <Tab>
                                Notas
                            </Tab>
                            <Tab>
                                Recetas
                            </Tab>
                        </TabList>

                        {/* Panel de notas */}
                        <TabPanels>
                            <TabPanel>
                                <TableNotes onOpen={onOpenAddNotes} list={notes} />
                            </TabPanel>

                            {/* Panel de recetas */}
                            <TabPanel>
                                <TableRecipes onOpen={onOpenAddRecipes} list={recipes} />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>

                    <Modal
                        onClose={onCloseAddNotes}
                        isOpen={isOpenAddNotes}
                        size={{ base: "300px" }}
                    >
                        <ModalOverlay />
                        <ModalContent
                            mt={{ base: "40px", md: "60px" }}   // 👈 acá lo subís
                            maxW={{ base: "90%", md: "90%", lg: "75%", xl: "50%" }}
                            maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
                        >
                            <ModalCloseButton />
                            <ModalNotesAdd onClose={onCloseAddNotes} />
                        </ModalContent>
                    </Modal>


                    <Modal
                        onClose={onCloseAddRecipes}
                        isOpen={isOpenAddRecipes}
                        size={{ base: "300px" }}
                    >
                        <ModalOverlay />
                        <ModalContent
                            mt={{ base: "40px", md: "60px" }}   // 🔥 lo sube
                            maxW={{ base: "90%", md: "90%", lg: "75%", xl: "50%" }}
                            maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
                        >
                            <ModalCloseButton />
                            <ModalRecipesAdd
                                onClose={onCloseAddRecipes}
                                getRecipes={getRecipes}
                            />
                        </ModalContent>
                    </Modal>

                    {/* Modal para agregar un gasto */}
                    {/*   <Modal onClose={onCloseAddExpenseType} isOpen={isOpenAddExpenseType} isCentered size={{ base: "300px" }}>
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalExpensesTypeAdd onClose={onCloseAddExpenseType} getExpensesType={getExpenseType} expensesType={expenseType} />
                        </ModalContent>
                    </Modal> */}

            </PageContainer>
        </>
    );
}
