---
name: brandkit
description: Premium brand-kit image-generation skill for identity boards, visual-world references, logo directions, palettes, typography, imagery, and presentation applications. Use when a Deckory deck is for a product without a coherent visual identity or when the user explicitly asks for brand-kit exploration.
---

# Brandkit

Adapted for Deckory from `Leonxlnx/taste-skill/skills/brandkit`.

Act as a brand identity art director, logo designer, visual-system strategist, and presentation designer. Generate a coherent identity reference board that feels intentional, premium, strategic, and presentation-ready.

This skill generates reference imagery and direction. It does not create a Deckory product feature, factual evidence, production-ready trademark clearance, or executable slide components.

## Core principle

A premium brand kit is a visual argument for why the brand exists. It must answer:

1. What does the product represent?
2. Who must trust or desire it?
3. What is the central metaphor?
4. How does the mark express that metaphor?
5. How does the system scale across product UI, presentation, image, print, and small details?
6. What makes the system ownable rather than generic?

## Strategy before image generation

Infer and document:

- category and product action;
- primary audience and buying context;
- emotional promise and trust level;
- cultural position and competitive references;
- verified existing assets;
- symbolic metaphor;
- color and typography constraints;
- visual clichés the brand must avoid.

Do not choose symbols randomly. Connect the mark to the product action or emotional promise.

Useful symbolic families include:

- developer tool: frame, cursor, scaffold, grid, build path;
- AI assistant: signal, orbit, handoff, node, guided path;
- security: boundary, protected core, seal, watch mark;
- voice: waveform, pulse, rhythm, speech path;
- compliance: document, seal, ordered boundary, verified state;
- productivity: focus path, momentum, block, check, calendar;
- data product: lens, axis, signal, comparison, connected field;
- creative tool: canvas, frame, cut, layer, transformation.

## Default output

Unless the request specifies another format, create one brand-kit overview image with:

- a clean `3 × 3` or `2 × 3` presentation grid;
- consistent gutters and strong outer margins;
- sparse typography;
- one primary logo direction plus controlled variants;
- core palette with neutral field and one dominant accent family;
- type hierarchy;
- symbol construction or geometry;
- product/presentation applications;
- imagery or texture treatment;
- small-system details such as icon, code, chart, or data styling when relevant.

Use `4:3`, `16:10`, or `16:9` based on the target presentation. For Deckory references, prefer `16:9` when the board will be reviewed as a slide.

## Logo standard

The mark must be simple, memorable, symbolic, scalable, balanced, and connected to the brand idea. It must work as an icon, wordmark companion, small UI mark, monochrome mark, and repeated pattern.

Avoid:

- generic lightning bolts, sparkles, or orbit marks without a strong reason;
- random animals;
- fake luxury crests;
- copied famous marks;
- overly detailed symbols;
- clip-art geometry;
- inconsistent variants;
- meaningless letterforms with no reduction or negative-space idea.

Use at most two concept methods together:

- monogram plus meaning;
- product action reduced into a symbol;
- metaphor fusion;
- negative space;
- modular geometry;
- protective boundary or contained core;
- signal, path, or transformation logic.

## Visual-system standard

A strong board includes an explicit system, not a collection of mockups:

- logo clear space and size behavior;
- neutral, primary, support, and state colors;
- display, body, mono/data type roles;
- image crop, lighting, texture, and overlay rules;
- icon family and stroke treatment;
- chart palette and highlight semantics;
- table density and divider treatment;
- code theme and line-highlight treatment;
- slide title, evidence, and page-number rhythm;
- motion character described in words when relevant.

Use one coherent palette. Avoid automatic AI-purple gradients, beige-and-brass luxury defaults, generic dark-tech neon, and random color changes between panels unless the brief explicitly requires them.

## Presentation quality

The board should feel like a serious identity-studio presentation:

- deliberate grid and negative space;
- restrained panel count;
- one strong idea per panel;
- cinematic but readable atmosphere;
- limited text with real hierarchy;
- repeated mark across meaningful applications;
- subtle grain, halftone, scanline, emboss, or construction texture only when it supports the concept;
- no messy AI moodboard collage;
- no floating mockups without a reason;
- no fake brand claims, awards, customer logos, or product metrics.

## Deckory handoff

After generating the board, extract a concise Deckory handoff:

- visual-language statement;
- palette roles and accessible combinations;
- typography roles and fallbacks;
- slide composition principles;
- chart/table/code treatment;
- icon and image rules;
- motion character;
- forbidden clichés;
- two or three representative slide archetypes.

Then use `deckory-slide-director` to translate the handoff into typed layouts and semantic components. Do not embed the reference board as the only slide design and do not treat generated visual details as product facts.

## Pre-flight

Reject and regenerate when the board has any of these defects:

- no clear brand idea;
- generic mark unrelated to the product;
- inconsistent logo variants;
- multiple competing accent families;
- unreadable typography;
- overcrowded grid;
- mockups that do not demonstrate the identity system;
- random textures or cinematic effects;
- copied or near-copied trademark shapes;
- no usable rules for charts, tables, code, or presentation applications when the product requires them;
- visual quality that cannot be translated into accessible semantic Deckory components.

Source: https://github.com/Leonxlnx/taste-skill/tree/main/skills/brandkit
License: MIT, upstream copyright Leonxlnx and contributors.