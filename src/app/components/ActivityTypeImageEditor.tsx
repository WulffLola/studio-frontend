import {
  Box,
  Button,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiMove, FiMinus, FiPlus } from "react-icons/fi";

type ActivityTypeImageEditorProps = {
  src: string;
  editable: boolean;
  zoom: number;
  offsetX: number;
  offsetY: number;
  onZoomChange: (value: number) => void;
  onOffsetXChange: (value: number) => void;
  onOffsetYChange: (value: number) => void;
  onSaveFrame?: (zoom: number, offsetX: number, offsetY: number) => void;
  openRequest?: number;
};

const clamp = (value: number) => Math.max(-100, Math.min(100, value));

const ActivityTypeImageEditor = ({
  src,
  editable,
  zoom,
  offsetX,
  offsetY,
  onZoomChange,
  onOffsetXChange,
  onOffsetYChange,
  onSaveFrame,
  openRequest,
}: ActivityTypeImageEditorProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: editable });
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const savedFrame = useRef({ zoom, offsetX, offsetY });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState(560);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (editable) {
      savedFrame.current = { zoom, offsetX, offsetY };
      onOpen();
    }
  // Opening is intentionally tied to a newly selected image URL.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, editable]);

  useEffect(() => {
    if (editable && openRequest) onOpen();
  }, [editable, onOpen, openRequest]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateWidth = () => setStageWidth(stage.clientWidth || 560);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [isOpen]);

  const frameGeometry = useMemo(() => {
    const frameHeight = stageWidth / 2.5;
    if (!naturalSize.width || !naturalSize.height) {
      return { frameHeight, stageHeight: frameHeight, width: stageWidth, height: frameHeight, left: 0, top: 0 };
    }

    const baseScale = Math.max(stageWidth / naturalSize.width, frameHeight / naturalSize.height);
    const scale = baseScale * zoom;
    const width = naturalSize.width * scale;
    const height = naturalSize.height * scale;
    const horizontalTravel = Math.max(0, (width - stageWidth) / 2);
    const verticalTravel = Math.max(0, (height - frameHeight) / 2);
    const stageHeight = Math.min(340, Math.max(frameHeight, height));

    return {
      frameHeight,
      stageHeight,
      width,
      height,
      left: (stageWidth - width) / 2 - (offsetX / 100) * horizontalTravel,
      top: (stageHeight - height) / 2 - (offsetY / 100) * verticalTravel,
    };
  }, [naturalSize, offsetX, offsetY, stageWidth, zoom]);

  const cancelEditor = () => {
    onZoomChange(savedFrame.current.zoom);
    onOffsetXChange(savedFrame.current.offsetX);
    onOffsetYChange(savedFrame.current.offsetY);
    onClose();
  };

  const saveFrame = () => {
    savedFrame.current = { zoom, offsetX, offsetY };
    onSaveFrame?.(zoom, offsetX, offsetY);
    onClose();
  };

  return (
    <Stack spacing={4}>

      {editable && (
        <Modal isOpen={isOpen} onClose={cancelEditor} isCentered size="2xl" closeOnOverlayClick={false}>
          <ModalOverlay />
          <ModalContent overflow="hidden">
            <ModalHeader pr={12}>
              Editar imagen de actividad
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody>
              <HStack justify="center" color="text.muted" mb={5} spacing={2}>
                <FiMove />
                <Text fontSize="sm">Arrastrá la imagen para elegir el encuadre</Text>
              </HStack>

              <Box
                position="relative"
                ref={stageRef}
                w="100%"
                maxW="560px"
                h={`${frameGeometry.stageHeight}px`}
                mx="auto"
                overflow="hidden"
                borderRadius="card"
                bg="gray.900"
                cursor="grab"
                touchAction="none"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragStart.current = { x: event.clientX, y: event.clientY, offsetX, offsetY };
                  event.currentTarget.style.cursor = "grabbing";
                }}
                onPointerMove={(event) => {
                  if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  onOffsetXChange(clamp(dragStart.current.offsetX - ((event.clientX - dragStart.current.x) / rect.width) * 200));
                  onOffsetYChange(clamp(dragStart.current.offsetY - ((event.clientY - dragStart.current.y) / rect.height) * 200));
                }}
                onPointerUp={(event) => {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                  event.currentTarget.style.cursor = "grab";
                }}
              >
                <Image
                  src={src}
                  alt="Imagen para encuadrar"
                  position="absolute"
                  left={`${frameGeometry.left}px`}
                  top={`${frameGeometry.top}px`}
                  w={`${frameGeometry.width}px`}
                  h={`${frameGeometry.height}px`}
                  maxW="none"
                  pointerEvents="none"
                  userSelect="none"
                  onLoad={(event) => setNaturalSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  })}
                />
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w="100%"
                  h={`${frameGeometry.frameHeight}px`}
                  borderRadius="md"
                  border="2px solid rgba(255,255,255,.95)"
                  boxShadow="0 0 0 9999px rgba(0,0,0,.52), 0 8px 24px rgba(0,0,0,.35)"
                  pointerEvents="none"
                />
              </Box>

              <HStack maxW="400px" mx="auto" mt={7} spacing={4} color="text.muted">
                <FiMinus />
                <Slider min={1} max={3} step={0.05} value={zoom} onChange={onZoomChange} aria-label="Zoom de imagen" flex={1}>
                  <SliderTrack bg="gray.200" h="4px"><SliderFilledTrack /></SliderTrack>
                  <SliderThumb boxSize={5} border="2px solid" borderColor="brand.500" boxShadow="sm" />
                </Slider>
                <FiPlus />
              </HStack>
              <Text textAlign="center" mt={2} fontSize="xs" color="text.disabled">
                Área visible de la card: 400 × 160 px · salida: 1400 × 560 px
              </Text>
            </ModalBody>

            <ModalFooter>
              <Button variant="secondary" onClick={cancelEditor} aria-label="Cancelar">Cancelar</Button>
              <Button onClick={saveFrame} variant="primary">
                Guardar encuadre
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Stack>
  );
};

export default ActivityTypeImageEditor;
