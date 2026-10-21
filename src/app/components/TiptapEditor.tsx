"use client";

import React from "react";
import { Box, Button, HStack } from "@chakra-ui/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { MdFormatListBulleted, MdFormatListNumbered } from "react-icons/md";

type TiptapEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "Escribir...",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  React.useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    if (value !== currentHtml) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <Box border="1px solid" borderColor="border.default" borderRadius="control" overflow="hidden" bg="bg.surface" transition="border-color 120ms ease, box-shadow 120ms ease" _focusWithin={{ borderColor: "border.focus", boxShadow: "focusRing" }}>
      <HStack
        spacing={2}
        p={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
        flexWrap="wrap"
        bg="bg.subtle"
      >
        <Button
          size="sm"
          variant="toggle"
          isActive={editor.isActive("bold")}
          aria-pressed={editor.isActive("bold")}
          fontWeight="bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </Button>

        <Button
          size="sm"
          variant="toggle"
          isActive={editor.isActive("italic")}
          aria-pressed={editor.isActive("italic")}
          fontStyle="italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </Button>

        <Button
          size="sm"
          variant="toggle"
          isActive={editor.isActive("underline")}
          aria-pressed={editor.isActive("underline")}
          textDecoration="underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          U
        </Button>

        <Button
          size="sm"
          variant="toggle"
          isActive={editor.isActive("bulletList")}
          aria-pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <MdFormatListBulleted size={18} />
        </Button>

        <Button
          size="sm"
          variant="toggle"
          isActive={editor.isActive("orderedList")}
          aria-pressed={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <MdFormatListNumbered size={18} />
        </Button>

      </HStack>

      <Box
        p={3}
        minH="140px"
        sx={{
          ".tiptap-editor": {
            outline: "none",
            minHeight: "110px",
          },
          ".tiptap-editor p.is-editor-empty:first-of-type::before": {
            content: 'attr(data-placeholder)',
            float: "left",
            color: "var(--chakra-colors-text-muted)",
            pointerEvents: "none",
            height: "0",
          },
          ".tiptap-editor ul, .tiptap-editor ol": {
            paddingLeft: "1.5rem",
            margin: "0.5rem 0",
          },
          ".tiptap-editor p": {
            margin: "0.5rem 0",
          },
          ".tiptap-editor h1, .tiptap-editor h2, .tiptap-editor h3": {
            fontWeight: "bold",
            margin: "0.75rem 0 0.5rem",
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}