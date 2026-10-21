"use client";

import React from "react";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";

type HomePhrasePreviewProps = {
    title: string;
    lines: string[];
};

const HomePhrasePreview = ({ title, lines }: HomePhrasePreviewProps) => {
    return (
        <Box
            bg="bg.surface"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="card"
            boxShadow="card"
            px={{ base: 4, md: 10 }}
            py={{ base: 6, md: 8 }}
            w="100%"
            mb={0}
        >
            <Heading
                as="h1"
                size={{ base: "md", md: "lg" }}
                textAlign="center"
                mb={3}
                color="text.primary"
            >
                {title}
            </Heading>

            <VStack spacing={1} fontSize={{ base: "sm", md: "md" }} color="text.primary">
                {lines.map((line, index) => (
                    <Text key={index} textAlign="center">
                        {line}
                    </Text>
                ))}
            </VStack>
        </Box>
    );
};

export default HomePhrasePreview;